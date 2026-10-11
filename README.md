# portfolio

Anjali Vathanakumaran's portfolio. Two modes, one set of content:

- **Pro mode** (`site/index.html`, the homepage): one scrolling page with side tabs for About me, Skills & education, Experience and Projects. Muted pink and sage with a few strawberries, and each job's tech stack drawn as a stack of blocks.
- **Fun mode** (`site/garden.html`): a watercolour garden on one screen. Bunnies are work experience, peonies are projects, the gardener is the About page, and the library holds every project. Press **Run model inference** to watch a (scripted) detect → classify → segment pass, then click anything to open its results.

Plain HTML, CSS and JavaScript: no build step, no dependencies.

## Run it locally

Open `site/index.html` (Pro mode) or `site/garden.html` (Fun mode) in a browser. That's it.

## Edit your content

Everything lives in `site/assets/js/data.js`: your details, the five roles (with your resume `bullets` and `tools`, which become the block stack), and the five projects. Both pages read from it, so edit once.

- `resumeUrl`: add a PDF to the repo (without your phone number) and put its path here to show Résumé links.
- `funFact`: fill it in to show it on the model card.
- Each project's `link` points to your GitHub profile; swap in the repo URL when it's public.

## Add your own watercolour art

The garden is drawn in code until you have real art. Put images in `site/assets/img/` and set the `art` paths in `data.js`:

| Key | What to make | Notes |
|---|---|---|
| `background` | Full garden painting, 1440 × 900 | Replaces the drawn sky, lawn, path and library |
| `gardener` | You, watering hydrangeas, transparent PNG | Feet at the bottom centre |
| `bunnies.<id>` | One bunny per role with its prop, transparent PNG | ids: `graze`, `honest`, `martinrea1`, `martinrea2`, `electrium` |
| `peonies.<id>` | One peony per project, transparent PNG | ids: `rtx`, `wordle`, `cpusim`, `water`, `fall` |

Use the same style words in every prompt so the pieces match, for example: *soft realistic watercolour illustration, natural light, transparent background*.

## Put it online with Netlify

`netlify.toml` tells Netlify to publish only the `site/` folder, so the `mockup/` drafts stay private.

**Option A: connect GitHub (updates itself on every push)**
1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project → GitHub**, pick `portfolio`.
3. Leave the build command empty. Netlify reads `netlify.toml`, so the publish directory is already `site`.
4. Deploy. You get a link like `https://<name>.netlify.app`.

**Option B: drag and drop (no GitHub needed)**
Go to **app.netlify.com/drop** and drag the `site` folder onto it. To update later, open the site in Netlify and drag the folder onto its **Deploys** tab.

**Option C: command line**
`npx netlify-cli deploy --prod --dir=site`

## Use your own domain: anjaliv.ca

1. Buy `anjaliv.ca` from a CIRA-certified registrar (for example Namecheap, GoDaddy or Rebel). `.ca` needs Canadian presence; citizens and permanent residents qualify.
2. In Netlify: **Site configuration → Domain management → Add a domain**, enter `anjaliv.ca`.
3. Point the domain at Netlify, one of two ways:
   - **Netlify DNS (easiest):** let Netlify manage the domain, then copy the four name servers it shows into your registrar's name server settings.
   - **Keep your registrar's DNS:** add the records Netlify shows. Usually an `A` record for `@` pointing to Netlify's load balancer IP, and a `CNAME` for `www` pointing to `<name>.netlify.app`.
4. Netlify sets up HTTPS for free once DNS works. That can take from a few minutes to about a day.

Then `anjaliv.ca` shows Pro mode and `anjaliv.ca/garden` shows the garden. Old `/pro` links redirect to the homepage.

## Files

```
netlify.toml               Netlify settings (publishes site/)
site/index.html            Pro mode (homepage)
site/garden.html           Fun mode (the garden)
site/404.html              "lost in the garden" page
site/favicon.svg           tab icon
site/assets/js/data.js     all content + optional art paths
site/assets/js/garden.js   garden scene, bunnies, inference, windows
site/assets/js/pro.js      Pro mode rendering
site/assets/css/garden.css garden styles
site/assets/css/pro.css    Pro mode styles
mockup/                    earlier design drafts (not published, safe to delete)
```
