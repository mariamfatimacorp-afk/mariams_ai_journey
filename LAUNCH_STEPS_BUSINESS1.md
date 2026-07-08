# 🚀 Business 1 (StoryMagic) — Exact Launch Steps

Follow in order. No coding needed. Total time: about 40 minutes.

## ✅ Part 1 — Put the app on the internet (10 min, free)

1. Log in at **github.com** and open `mariamfatimacorp-afk/mariams_ai_journey`
2. Click **Settings** (⚙️ tab in the repo's top menu)
3. Left sidebar → **Pages**
4. Under **Build and deployment → Branch**: change **None** to **`claude/money-making-apps-portfolio-wzp35h`**
5. Leave folder as **/ (root)** → click **Save**
6. Wait 2–3 minutes, refresh — a green "Your site is live" box appears
7. Test your app here (type a name + animal → story should appear):
   `https://mariamfatimacorp-afk.github.io/mariams_ai_journey/apps/story-magic/`

## ✅ Part 2 — Create the Gumroad product (25 min, free)

**Download the PDF:** in the repo open `products` → `storymagic-pack` → `StoryMagic-Pack.pdf` → click the ⬇ download icon.

1. **gumroad.com** → Sign up → verify email
2. Click **New product**
   - Name: `StoryMagic Pack — 20 Printables for Magical Bedtimes (Urdu + English)`
   - Type: **Digital product** · Price: `4.99`
3. **Content** section → **Upload files** → choose `StoryMagic-Pack.pdf`
4. Description — paste:
   > Make bedtime the best part of the day! ⭐ This pack includes a "Star of the Story" certificate for your little one, 6 storybook coloring pages, fill-in stories, name tracing, bedtime routine & reward charts — plus something no other pack has: **Urdu–English word cards in real Urdu script** (چاند، ستارہ) to share your language with your child. 22 print-ready A4 pages. Instant download. Pairs with the free StoryMagic app, where your child becomes the star of their own story!
5. Cover images: screenshot page 1 (cover) and page 3 (certificate) of the PDF, upload both
6. Click **Publish** → **copy your product link** (`https://yourname.gumroad.com/l/...`)
7. **Payouts:** Gumroad Settings → Payments. In Pakistan: get free US bank details from **payoneer.com** and enter those — or use **payhip.com** instead (same steps, more countries).

## ✅ Part 3 — Connect the Buy button (5 min)

1. In the repo, set the branch dropdown (above the file list) to `claude/money-making-apps-portfolio-wzp35h`
2. Open `apps` → `story-magic` → `index.html` → click the ✏️ pencil to edit
3. Ctrl+F → search `BUY_URL` → find:
   `const BUY_URL = "#";`
4. Replace only the `#` with your Gumroad link (keep the quotes):
   `const BUY_URL = "https://yourname.gumroad.com/l/something";`
5. Green **Commit changes…** button → **Commit changes**
6. After 2 min, generate 6 stories in the app — the popup should appear and open your Gumroad page

## ✅ Part 4 — Tell people (sales come from here)

- WhatsApp the app link to 5 parent friends: "I made this free app — type your kid's name and it makes them a bedtime story!"
- Post in 2–3 Facebook parenting groups (desi parenting groups first — lead with the Urdu mode)
- LinkedIn: "I built and launched my first app with AI" + the link

## Troubleshooting
- **Pages settings shows no branch dropdown** → you may be on the Fork/wrong repo, or not logged in as the owner
- **App link shows 404** → wait 5 more minutes; check the branch chosen in Pages is exactly `claude/money-making-apps-portfolio-wzp35h`
- **Story doesn't appear when testing** → make sure both Name and Animal boxes are filled
- **Popup never shows** → it only appears from the 6th story onward, and only after Part 3 is done
