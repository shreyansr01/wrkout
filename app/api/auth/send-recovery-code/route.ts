import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, findUserByUsername } from '@/lib/auth/server';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_LENGTH = 6;
const CODE_EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS_PER_HOUR = 5;

async function sendVerificationEmail(params: {
  to: string;
  code: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM_EMAIL;

  if (!apiKey || !from) {
    return { configured: false, error: null };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: 'Your wrkout verification code',
      html: `
        <p>Your verification code for password recovery is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${params.code}</p>
        <p>This code expires in 15 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
      text: `Your verification code for password recovery is:\n\n${params.code}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, you can safely ignore this email.`,
    }),
  });

  if (!response.ok) {
    return {
      configured: true,
      error: `Email provider returned ${response.status}`,
    };
  }

  return { configured: true, error: null };
}

function generateVerificationCode(): string {
  // Use cryptographically secure random number generation
  const arr = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(x => (x % 10).toString()).join('');
}

export async function POST(request: NextRequest) {
  try {
    const { email = '', username = '' } = (await request.json()) as { email?: string; username?: string };
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // 1. Verify username and match recovery email if username is provided
    if (normalizedUsername) {
      const user = await findUserByUsername(supabase, normalizedUsername);
      if (!user) {
        return NextResponse.json({ error: 'No account found with this username' }, { status: 404 });
      }

      const registeredEmail = user.user_metadata?.recovery_email;
      if (!registeredEmail) {
        return NextResponse.json({ error: 'No recovery email has been set for this account' }, { status: 400 });
      }

      if (registeredEmail.trim().toLowerCase() !== normalizedEmail) {
        return NextResponse.json({ error: 'The provided email does not match the recovery email' }, { status: 400 });
      }
    }

    // Rate limiting: check if email has exceeded max attempts in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentCodes } = await supabase
      .from('verification_codes')
      .select('id')
      .eq('email', normalizedEmail)
      .gt('created_at', oneHourAgo);

    if (recentCodes && recentCodes.length >= MAX_ATTEMPTS_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many verification requests. Please try again later.' },
        { status: 429 }
      );
    }

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // Store code in Supabase
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert([
        {
          email: normalizedEmail,
          code,
          expires_at: expiresAt,
        },
      ]);

    if (insertError) {
      console.error('Error storing verification code:', insertError);
      return NextResponse.json(
        { error: 'Failed to process request' },
        { status: 500 }
      );
    }

    const delivery = await sendVerificationEmail({
      to: normalizedEmail,
      code,
    });

    if (delivery.error) {
      return NextResponse.json({ error: 'Failed to send verification code' }, { status: 502 });
    }

    if (!delivery.configured) {
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json(
          {
            message: 'Verification code generated. Email delivery is not configured.',
            code,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: 'Email delivery is not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Unexpected error in POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const code = searchParams.get('code');

    if (!email || !code) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createServiceRoleClient();
    
    // Retrieve the absolute most recent code for this email (used or unused)
    const selectQuery = supabase
      .from('verification_codes')
      .select('id, code, expires_at, attempts, used_at')
      .eq('email', normalizedEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    interface VerificationRecord {
      id: string;
      code: string;
      expires_at: string;
      attempts?: number | null;
      used_at?: string | null;
    }

    let queryResult = await selectQuery;
    let hasAttemptsColumn = true;
    let records: VerificationRecord[] | null = queryResult.data as VerificationRecord[] | null;

    if (queryResult.error) {
      // Postgres error 42703 is "undefined_column"
      if (queryResult.error.code === '42703') {
        hasAttemptsColumn = false;
        const fallbackResult = await supabase
          .from('verification_codes')
          .select('id, code, expires_at, used_at')
          .eq('email', normalizedEmail)
          .order('created_at', { ascending: false })
          .limit(1);

        if (fallbackResult.error) {
          console.error('Fallback query error:', fallbackResult.error);
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
        records = fallbackResult.data;
      } else {
        console.error('Query error:', queryResult.error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'No verification code requested for this email.' }, { status: 400 });
    }

    const record = records[0];
    const now = new Date();
    const expiresAt = new Date(record.expires_at);
    const attempts = hasAttemptsColumn ? (record.attempts || 0) : 0;

    // 1. Check if the code has already been marked as used / expired
    if (record.used_at !== null) {
      if (hasAttemptsColumn && attempts >= 5) {
        return NextResponse.json({ error: 'Too many failed attempts. Please request a new code.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'This verification code has already been used. Please request a new code.' }, { status: 400 });
    }

    // 2. Check if expires_at has passed
    if (now > expiresAt) {
      // Burn the code by setting used_at so it cannot be guessed again
      await supabase
        .from('verification_codes')
        .update({ used_at: now.toISOString() })
        .eq('id', record.id);
      return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
    }

    // 3. Check if attempts already reached safety limit
    if (hasAttemptsColumn && attempts >= 5) {
      // Burn the code by marking it as used
      await supabase
        .from('verification_codes')
        .update({ used_at: now.toISOString() })
        .eq('id', record.id);
      return NextResponse.json({ error: 'Too many failed attempts. Please request a new code.' }, { status: 400 });
    }

    // Increment attempts
    const newAttempts = attempts + 1;

    // Use constant-time comparison to prevent timing attacks
    const isCodeValid = timingSafeEqual(record.code, code);

    if (!isCodeValid) {
      // If attempts reach limit now, burn the code
      if (hasAttemptsColumn && newAttempts >= 5) {
        await supabase
          .from('verification_codes')
          .update({ 
            attempts: newAttempts,
            used_at: now.toISOString()
          })
          .eq('id', record.id);
        return NextResponse.json({ error: 'Too many failed attempts. Please request a new code.' }, { status: 400 });
      } else {
        if (hasAttemptsColumn) {
          await supabase
            .from('verification_codes')
            .update({ attempts: newAttempts })
            .eq('id', record.id);
        }
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }
    }

    // Mark code as used on successful verification so it can only be used once, and record the final attempt count
    const updatePayload: Record<string, unknown> = { used_at: now.toISOString() };
    if (hasAttemptsColumn) {
      updatePayload.attempts = newAttempts;
    }

    await supabase
      .from('verification_codes')
      .update(updatePayload)
      .eq('id', record.id);

    return NextResponse.json({ verified: true, email: normalizedEmail });
  } catch (error) {
    console.error('Unexpected error in GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
