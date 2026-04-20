# SideStuff · landing page

Next.js 14 (App Router) + Tailwind + Firebase + Anthropic API.
Landing page with 3 working AI tools and a Firestore-backed waitlist.

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

### 2 · Get an Anthropic API key

→ Go to https://console.anthropic.com/settings/keys
→ Create a key, copy it into `.env.local` as `ANTHROPIC_API_KEY`

### 3 · Set up Firebase (waitlist storage)

1. Go to https://console.firebase.google.com → **Add project** → name it `sidestuff` → disable Analytics → Create.
2. Left sidebar → **Build** → **Firestore Database** → **Create database** → Start in **production mode** → pick a region (pick one close to you, e.g. `asia-south1` for India).
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

4. Click the gear icon → **Project settings** → scroll down to **Your apps** → click the **</>** web icon.
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
# first time only:
git init && git add . && git commit -m "sidestuff v0.1"
# create a new GitHub repo, then:
git remote add origin <your-github-url>
git push -u origin main
```

Then:

1. Go to https://vercel.com/new → import the repo.
2. In **Environment Variables**, paste in everything from `.env.local` (all 7 of them).
3. Click **Deploy**. You'll have a live URL in ~60 seconds.
4. (Optional) Settings → Domains → add your domain.

Done. You're live.

---

## Project structure

```
sidestuff/
├── app/
│   ├── api/claude/route.js   ← server proxy to Anthropic (hides key)
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

## What the tools do (all real, via `/api/claude`)

- **Automation Builder** — sentence → structured JSON workflow → custom SVG flow diagram with icons.
- **AI Clone** — user description → system prompt → live chat session that preserves context.
- **Startup Simulator** — idea → 6-month user + revenue curve (Recharts) + narrative + problem list.

## What the waitlist does

- Writes to `waitlist/{safe_email_id}`: `{ email, source, created_at }`.
- Atomically increments `counters/waitlist.count` — shown live in the hero pill.
- Stores `ss_joined=1` in localStorage so returning visitors see "you're in" instead of the CTA.

## Changing the Claude model

In `.env.local`:
```
ANTHROPIC_MODEL=claude-haiku-4-5-20251001   # fastest, cheapest
ANTHROPIC_MODEL=claude-sonnet-4-6           # default — smart + affordable
ANTHROPIC_MODEL=claude-opus-4-7             # strongest, pricier
```

## Troubleshooting

- **Tools show "couldn't build that one"** → check `ANTHROPIC_API_KEY` is set in Vercel env vars and redeploy.
- **Waitlist shows "couldn't save that"** → check Firestore rules are published, and all 6 `NEXT_PUBLIC_FIREBASE_*` vars are in Vercel (no quotes, no trailing spaces).
- **Hero counter stuck at 0** → that's fine; it shows "private beta · limited seats" until the first signup lands.
- **Fonts look generic on first load** → `next/font` preloads them; hard refresh once after deploy.

## Cost napkin-math

- **Vercel Hobby**: free (plenty for a landing page).
- **Firestore**: free tier is 50K reads / 20K writes per day — more than enough for a waitlist.
- **Anthropic**: Haiku is ~$0.0001 per tool run. Sonnet ~$0.005. A thousand visitors trying all three tools runs ~$1–15/mo depending on model.

If it blows up, switch to Haiku and cap `max_tokens` in `/api/claude/route.js`.

---

sidestuff · built by builders, for builders.
