# wrkout

> Minimal, distraction-free workout logger built for Push, Pull, Legs (PPL) split. Log sets in seconds, track volume, and monitor progressive overload.

[![Live Demo](https://img.shields.io/badge/Live_Demo-wrkout--tracker.vercel.app-blue?style=flat-square)](https://wrkout-tracker.vercel.app/)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square)](https://supabase.com)

---

<p align="center">
  <img src="public/readme_home_page.png" alt="wrkout Dashboard" width="750" />
</p>

---

## Features

- **Inline logging**: Adjust weight, reps, and sets with steppers and save in one tap.
- **Progressive overload**: Automatic volume calculation and workout-to-workout comparisons.
- **Custom routines**: Organize Push, Pull, Legs, and custom splits with built-in exercises.
- **Minimal sign-in**: Simple username login with optional email recovery.
- **Audio & haptics**: Subtle sound cues and vibration feedback when completing sets.

---

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth)
- **Deployment**: Vercel

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/ShreyanDev5/wrkout.git
cd wrkout
npm install
```

### 2. Environment setup

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Resend API for password recovery
RESEND_API_KEY=
PASSWORD_RESET_FROM_EMAIL=
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Author

**Shreyan Sardar** — [Portfolio](https://shreyandev.vercel.app) · [GitHub](https://github.com/ShreyanDev5) · [LinkedIn](https://www.linkedin.com/in/shreyansardar/)
