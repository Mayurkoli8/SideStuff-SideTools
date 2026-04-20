# SideStuff · landing page

Next.js 14 (App Router) + Tailwind + Firebase + **Groq (free tier)**.
Landing page with 3 working AI tools and a Firestore-backed waitlist.
**100% free to deploy and run** — no credit card needed.

```
stop thinking. start building.
```

---

## Why Groq?

Groq's free tier on Llama 3.3 70B gets you:
- **30 requests per minute**
- **14,400 requests per day**
- **No credit card required**
- **~300 tokens per second** — fastest inference available (feels instant in the UI)

By comparison, Google Gemini's free tier is currently 5 RPM / 20 RPD for new projects — you'll hit the cap after 20 tool uses. Groq gives you ~720× more daily headroom.

---

## Quick deploy — 10 minutes from zero to live URL

### 1 · Install locally

```bash
unzip sidestuff.zip && cd sidestuff
npm install
cp .env.local.example .env.local
```

### 2 · Get a free Groq API key (30 seconds)

1. Go to **https://console.groq.com/keys**
2. Sign in with Google, GitHub, or email.
3. Click **Create API Key** → name it `sidestuff` → **Submit**.
4. Copy the key (starts with `gsk_...`) into `.env.local` as `GROQ_API_KEY`.

**No credit card. No billing setup. No trial credits to run out.**

### 3 · Set up Firebase (waitlist storage — also free)

1. Go to https://console.firebase.google.com → **Add project** → name it `sidestuff` → disable Analytics → Create.
2. Left sidebar → **Build** → **Firestore Database** → **Create database** → Start in **production mode** → pick a region close to you (e.g. `asia-south1` for India).
3. Once Firestore is ready, click the **Rules** tab and paste this, then **Publish**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /waitlist/{docId} {
         allow create: if request.resource.data.email is string
                       && request.resource.data.email.size() < 200;
         allow read, update, delete: if false;
       }
       match /counters/waitlist {
         allow read, write: if true;
       }
     }
   }
   ```

4. Click the gear icon → **Project settings** → scroll to **Your apps** → click the **</>** web icon.
5. Name it `sidestuff-web`, skip Hosting, click Register.
6. Copy each value from the `firebaseConfig` object into `.env.local`:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sidestuff-xxxx.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=sidestuff-xxxx
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sidestuff-xxxx.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=1:...
   ```

### 4 · Run locally

```bash
npm run dev
```

Open http://localhost:3000 — test the 3 tools, test the waitlist. Check Firestore console → Data → `waitlist` collection to confirm emails are landing.

### 5 · Ship to Vercel

```bash
git init && git add . && git commit -m "sidestuff v0.1"
git remote add origin <your-github-url>
git push -u origin main
```

Then:

1. Go to https://vercel.com/new → import the repo.
2. In **Environment Variables**, paste in everything from `.env.local` (8 vars total).
3. Click **Deploy**. Live URL in ~60 seconds.

**Already deployed with Gemini?** In Vercel → Settings → Environment Variables:
- **Add** `GROQ_API_KEY` with your new Groq key
- **Remove** `GEMINI_API_KEY` (optional — won't hurt to keep it)
- Go to Deployments → three-dot menu on latest → **Redeploy**

---

## Project structure

```
sidestuff/
├── app/
│   ├── api/ai/route.js       ← server proxy to Groq (hides key)
│   ├── layout.jsx            ← fonts + metadata
│   ├── page.jsx              ← the entire landing page
│   └── globals.css           ← design tokens + animations
├── lib/
│   └── firebase.js           ← Firestore client init
├── .env.local.example
├── package.json
├── tailwind.config.js
└── README.md
```

## Changing the Groq model

In `.env.local` or Vercel env vars:

```
GROQ_MODEL=llama-3.3-70b-versatile    # default — best quality
GROQ_MODEL=llama-3.1-8b-instant       # fastest, still very capable
GROQ_MODEL=llama-4-scout-17b-16e-instruct  # newer, 512K context
GROQ_MODEL=qwen/qwen3-32b             # alt reasoning model
```

All share the same rate limits (30 RPM / 14,400 RPD).

## Troubleshooting

| Error banner says… | Fix |
|---|---|
| `GROQ_API_KEY not set` | Add the env var in Vercel, then **redeploy** (critical — Vercel doesn't apply new env vars to existing deploys) |
| `API key invalid or missing` | Key mishandled. Regenerate at console.groq.com/keys, paste into Vercel fresh, redeploy |
| `Rate limited — 30 RPM / 14,400 RPD` | Wait ~30 sec (you hit the per-minute burst limit — easy to do during testing) |
| `Model ... not found` | Check `GROQ_MODEL` spelling. `llama-3.3-70b-versatile` is the safe default |
| `Waitlist: couldn't save that` | Firestore rules not published yet, or Firebase env vars missing/mistyped in Vercel |

## Cost napkin-math

| | Free tier | You'd only pay if… |
|---|---|---|
| **Vercel** | Hobby covers landing pages | 100K+ monthly visits |
| **Firebase** | 50K reads + 20K writes/day | 20K+ signups/day |
| **Groq** | 30 RPM / 14,400 RPD | 14K+ tool uses/day |

A landing page waitlist stays entirely free. Forever.

---

sidestuff · built by builders, for builders.
