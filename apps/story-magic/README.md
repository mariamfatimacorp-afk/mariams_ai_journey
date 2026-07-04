# ✨ StoryMagic — Personalized Rhymes & Bedtime Stories

**Business #1 from the [portfolio plan](../../PORTFOLIO_PLAN.md).**
Parent types their child's name, age, and favourite animal → gets a personalized rhyme or bedtime story in one click, with read-aloud, printable keepsake, and an English+Urdu mode.

Everything runs in the browser — **$0/month to operate**. No servers, no API bills, no data stored.

## Features already built
- 🎵 Rhyme mode + 📖 bedtime-story mode (multiple templates, randomized so "Another one" feels fresh)
- 🌙 English + Urdu sprinkle mode with a mini glossary (your niche advantage — no big competitor does this)
- 🔊 Read-aloud via the browser's built-in speech (free "audio" feature)
- 🖨️ Print keepsake (print stylesheet strips the UI, leaves a clean page for framing)
- 💰 Soft paywall: after 5 free stories, an upsell modal offers the **StoryMagic Pack ($4.99)**

## Launch checklist (≈1 hour total)
1. **Go live free on GitHub Pages:** repo Settings → Pages → deploy from `main` branch. The app will be at
   `https://<username>.github.io/mariams_ai_journey/apps/story-magic/`
2. **Create the paid product:** on [Gumroad](https://gumroad.com) or [Lemon Squeezy](https://lemonsqueezy.com) (both free to start), create "StoryMagic Pack — $4.99". For launch, the pack can be a PDF bundle: 20 story printables + a "Star of the Story" certificate template (make these in Canva in an afternoon).
3. **Connect the paywall:** in `index.html`, set `BUY_URL` to your product link. The modal activates automatically once the URL is real.
4. **Announce it:** LinkedIn post ("I built and launched my first app with AI — here's how"), a YouTube video of the build story, and parenting/mums groups. The Urdu mode is the hook — lead with it.

## Upgrade path (only after first sales)
- **v2 — real AI stories:** swap the template engine for a Claude API call behind a tiny serverless function (Vercel, free tier). Charge $4/month for "unlimited unique AI stories". Do this only once ~10 people have paid — that's proof of demand.
- **v3 — audio & art:** ElevenLabs narration + an illustration per story; raise price to $7/month.
- **v4 — the moat:** child's photo → illustrated storybook PDF (this is Wonderbly's $29-per-book business).

## Pricing logic
| Tier | What | Price |
|---|---|---|
| Free | 5 stories/device, read-aloud, print | $0 (the marketing) |
| Pack | printables bundle + certificate | $4.99 one-time (first dollar, zero code) |
| Pro (v2) | unlimited unique AI stories | $4/mo |
