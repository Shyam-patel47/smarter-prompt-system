# PromptMe

A workspace to build, test, compare, and organize high-quality AI prompts. Turn trial-and-error prompting into a repeatable, versioned system.

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS (heavily customized)
- **Database:** PostgreSQL via [Neon](https://neon.tech)
- **ORM:** Prisma
- **Auth:** NextAuth.js v5 + custom OTP flow
- **Email OTP:** [Resend](https://resend.com)
- **SMS OTP:** [Twilio Verify](https://twilio.com/verify) (optional)
- **Hosting:** Vercel

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon/Postgres connection string (pooled) |
| `DIRECT_URL` | Neon/Postgres direct connection (for migrations) |
| `NEXTAUTH_SECRET` | Random 32+ char secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your app URL (`http://localhost:3000` in dev) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `RESEND_API_KEY` | From Resend dashboard |
| `RESEND_FROM_EMAIL` | Verified sender email |
| `TWILIO_ACCOUNT_SID` | From Twilio (optional — SMS OTP) |
| `TWILIO_AUTH_TOKEN` | From Twilio (optional) |
| `TWILIO_VERIFY_SID` | Twilio Verify service SID (optional) |

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in your values...

# 3. Run database migrations
npx prisma db push

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Migrations

```bash
# Push schema changes to database
npx prisma db push

# Generate Prisma client after schema changes
npx prisma generate

# View/edit data in browser
npx prisma studio
```

## Deployment (Vercel)

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Deploy — Vercel auto-detects Next.js

## Build Phases

- **Phase 1 ✅** — Auth (email/phone OTP, Google OAuth, password reset)
- **Phase 2** — Prompt Builder + Dashboard
- **Phase 3** — Prompt Library + Detail View
- **Phase 4** — A/B Compare + Settings + Polish + Deploy

## Auth Flows

- **Signup:** Enter name + email/phone + password → verify OTP → account created
- **Login:** Enter email/phone + password → dashboard
- **Forgot password:** Enter email/phone → verify OTP → set new password
- **Google OAuth:** One-click Google sign in
