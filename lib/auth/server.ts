import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { createPseudoEmail } from './auth-utils';

export function createServiceRoleClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role credentials are not configured');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function findUserByUsername(
  supabase: SupabaseClient,
  username: string
): Promise<User | null> {
  const pseudoEmail = createPseudoEmail(username);

  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: pseudoEmail,
    });

    if (data?.user) {
      return data.user;
    }

    if (error) {
      const isNotFound =
        error.status === 404 ||
        error.code === 'user_not_found' ||
        error.message?.toLowerCase().includes('not found');
      if (isNotFound) {
        return null;
      }
    }
  } catch {
    // If direct lookup encounters an unexpected error, proceed to bounded fallback
  }

  // Bounded fallback: check the most recent 100 users to avoid unbounded memory pagination
  const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
  return listData?.users.find((candidate) => candidate.email?.toLowerCase() === pseudoEmail) ?? null;
}
