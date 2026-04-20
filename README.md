# SideStuff · landing page

Next.js 14 (App Router) + Tailwind + Firebase + **Google Gemini (free tier)**.
Landing page with 3 working AI tools and a Firestore-backed waitlist.
**100% free to deploy and run** — no credit card needed.

```
stop thinking. start building.
```

---

## Quick deploy — 10 minutes from zero to live URL

### 1 · Install locally

```bash
unzip sidestuff.zip && cd sidestuff
npm install
cp .env.local.example .env.local
```

### 2 · Get a free Gemini API key (30 seconds)

1. Go to https://aistudio.google.com/apikey
2. Sign in with any Google account.
3. Click **Create API key** → **Create API key in new project**.
4. Copy the key (starts with `AIza...`) into `.env.local` as `GEMINI_API_KEY`.

**No credit card. No billing setup. Just works.**

Free tier gets you 500 requests/day on `gemini-2.5-flash` — plenty for a landing page.

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

Firebase free tier: 50K reads + 20K writes per day. Way more than you need.

### 4 · Run locally

```bash
npm run dev
```

Open http://localhost:3000 — test the 3 tools, test the waitlist. Check Firestore console → Data → `waitlist` collection to confirm emails are landing.

### 5 · Ship to Vercel (also free)

```bash
git init && git add . && git commit -m "sidestuff v0.1"
# create a new GitHub repo, then:
git remote add origin <your-github-url>
git push -u origin main
```

Then:

1. Go to https://vercel.com/new → import the repo.
2. In **Environment Variables**, paste in everything from `.env.local` (all 8 of them).
3. Click **Deploy**. You'll have a live URL in ~60 seconds.
4. (Optional) Settings → Domains → add your domain.

**Done. You're live. Total cost: $0.**

---

## Project structure

```
sidestuff/
├── app/
│   ├── api/ai/route.js       ← server proxy to Gemini (hides key)
│   ├── layout.jsx            ← fonts + metadata
│   ├── page.jsx              ← the entire landing page
│   └── globals.css           ← design tokens + animations
├── lib/
│   └── firebase.js           ← Firestore client init
├── .env.local.example        ← template — copy to .env.local
├── package.json
├── tailwind.config.js
└── README.md
```

## What the tools do (all real, via Gemini)

- **Automation Builder** — sentence → structured JSON workflow → custom SVG flow diagram with icons. Uses Gemini's native JSON mode for reliability.
- **AI Clone** — user description → system prompt → live chat session that preserves context.
- **Startup Simulator** — idea → 6-month user + revenue curve (Recharts) + narrative + problem list. Uses Gemini's JSON mode.

## What the waitlist does

- Writes to `waitlist/{safe_email_id}`: `{ email, source, created_at }`.
- Atomically increments `counters/waitlist.count` — shown live in the hero pill.
- Stores `ss_joined=1` in localStorage so returning visitors see "you're in" instead of the CTA.

## Changing the Gemini model

In `.env.local` or Vercel env vars:

```
GEMINI_MODEL=gemini-2.5-flash-lite   # 15 RPM · 1000 req/day · fastest
GEMINI_MODEL=gemini-2.5-flash        # 10 RPM ·  500 req/day · default (best balance)
GEMINI_MODEL=gemini-2.5-pro          #  5 RPM ·  100 req/day · smartest
```

All three are free on the free tier. `2.5-flash` is the sweet spot for this app.

## Running out of Gemini free quota?

If you hit 500 requests in a day and want more, you have options without paying:

1. **Switch to `gemini-2.5-flash-lite`** — doubles your daily quota to 1,000 req/day.
2. **Add a second free Gemini project** — each Google account can have multiple projects, each with its own free quota. Route traffic between keys.
3. **Swap to Groq** — Llama 3.3 70B is also free and fast. Replace the fetch URL in `app/api/ai/route.js` with Groq's endpoint (https://api.groq.com/openai/v1/chat/completions) — Groq is OpenAI-compatible, so the format is slightly different. ~15 min rewrite.
4. **Enable Gemini billing** — Tier 1 unlocks at 150 RPM for just adding a payment method (you still pay $0 until you use it).

## Troubleshooting

- **Tools error "couldn't build that one"** → check `GEMINI_API_KEY` is set in Vercel env vars and redeploy. Verify the key works at https://aistudio.google.com.
- **429 errors after many tests** → you hit the daily rate limit. Wait until midnight Pacific time, or switch to `gemini-2.5-flash-lite` for 2× the quota.
- **Waitlist shows "couldn't save that"** → check Firestore rules are published, and all 6 `NEXT_PUBLIC_FIREBASE_*` vars are in Vercel (no quotes, no trailing spaces).
- **Hero counter stuck at 0** → that's fine; it shows "private beta · limited seats" until the first signup lands.
- **Fonts look generic on first load** → `next/font` preloads them; hard refresh once after deploy.

## Cost napkin-math

| | Free tier | What you'd need to pay for |
|---|---|---|
| **Vercel** | Hobby tier covers landing pages | Only if you get ~100K+ visits/month |
| **Firebase** | 50K reads + 20K writes/day | Only if waitlist hits ~20K signups/day |
| **Gemini** | 500 req/day on `2.5-flash` | Only if tools get used >500 times/day |

A landing page for a waitlist will stay entirely free. If tool usage explodes past free quotas, that's a good problem — it means it's working.

---

sidestuff · built by builders, for builders.
