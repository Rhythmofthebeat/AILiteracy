# AI Literacy Academy

A full-curriculum web app that teaches AI from zero to neural networks — built for **Minorities in STEM**.

- **31 lessons** across three tracks (Beginner / Intermediate / Expert), grouped into 9 modules
- **Quizzes** with instant feedback + unlimited AI-generated practice sets
- **Practice Lab**: write and run real Python in the browser (via Pyodide) with an AI mentor that reviews your code
- **AI Encyclopedia**: every tool and term explained, with on-demand AI re-explanations
- Powered by the **OpenAI API (gpt-4o-mini)** through a secure Supabase backend

---

## How the AI is wired (read this first)

Your OpenAI API key **never goes in this code**. It lives only as a secret inside a Supabase edge function (`supabase/functions/ai-tutor`). The browser app calls *your function*; the function adds the key and talks to OpenAI. This is the only safe design — anything in the front-end code is visible to every student who opens the app.

```
Browser app  ──►  Supabase edge function  ──►  OpenAI
(no key)          (key lives here, secret)      (gpt-4o-mini)
```

---

## Setup

### 1. Run the front-end locally
```bash
npm install
npm run dev
```
Out of the box (with `BACKEND_URL` empty) the app runs in fallback mode so you can develop without deploying anything.

### 2. Deploy the AI backend
```bash
npm i -g supabase            # install CLI
supabase login
supabase link                # link to your Supabase project
supabase db push             # creates the ai_usage rate-limit table

# Store your OpenAI key as a secret — this is the ONLY place it goes.
# Type it in your terminal; never put it in a file or commit it.
supabase secrets set OPENAI_API_KEY=sk-your-new-key

# Optional knobs:
supabase secrets set DAILY_LIMIT=40         # requests per student per day
supabase secrets set OPENAI_MODEL=gpt-4o-mini

supabase functions deploy ai-tutor --no-verify-jwt
```
The CLI prints your function URL, e.g.
`https://abcd1234.supabase.co/functions/v1/ai-tutor`

### 3. Connect the app to the backend
Open `src/AILiteracyAcademy.jsx`, line ~30, and paste the URL:
```js
const BACKEND_URL = "https://abcd1234.supabase.co/functions/v1/ai-tutor";
```
Save. Every AI feature now routes through your backend. Done.

### 4. Build for production
```bash
npm run build      # outputs static files to dist/
```
Host `dist/` anywhere (Vercel, Netlify, Azure Static Web Apps, etc.).

---

## Security checklist before students use it

- [ ] **Never commit your OpenAI key.** It belongs only in `supabase secrets`. `.env` is git-ignored.
- [ ] If a key was ever pasted somewhere public, **revoke it** at platform.openai.com and issue a new one.
- [ ] In `supabase/functions/ai-tutor/index.ts`, tighten the CORS line from `"*"` to your real domain.
- [ ] Set a `DAILY_LIMIT` you're comfortable paying for, and watch usage in the OpenAI dashboard.
- [ ] Consider adding Supabase Auth so the rate limiter keys off verified user IDs instead of IP.

---

## Project structure
```
ai-literacy-academy/
├─ index.html
├─ package.json
├─ vite.config.js
├─ src/
│  ├─ main.jsx                       # mounts the app
│  └─ AILiteracyAcademy.jsx          # the entire app (BACKEND_URL near top)
└─ supabase/
   ├─ functions/ai-tutor/index.ts    # OpenAI proxy (holds the key, rate-limits)
   └─ migrations/0001_ai_usage.sql   # usage table for rate limiting
```

---

Built with care for the Minorities in STEM AI tutoring initiative.
