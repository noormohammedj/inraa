# inraasolution.com

Website for Inraa Solution: the Plotskart, Mandapkart and Fitcheq products, a business picker, and a proposal
agent that turns a problem statement into a requirement document (RFP) and a technical and commercial proposal.

Plain HTML, CSS and JavaScript. No build step. Hosted on GitHub Pages.

| Path | What it is |
| --- | --- |
| `index.html` | Home page |
| `assets/js/config.js` | **Edit here:** phone, email, WhatsApp number, product links and prices |
| `assets/js/agent.js` | Proposal agent: requirement detection, effort, timeline and pricing model (`RATE` at the top) |
| `assets/js/site.js` | Page behaviour: product sections, picker, proposal flow, contact links |
| `assets/css/site.css` | Styles |
| `fitcheq/` | Fitcheq sales site, member app and owner console prototype |
| `worker/` | Optional Cloudflare Worker that uses Claude to write proposal text |
| `CNAME` | Custom domain for GitHub Pages |

## Change contact details
Edit `phone`, `phoneDisplay`, `whatsapp` and `email` in `assets/js/config.js`, then commit and push.

## Run locally
```bash
python3 -m http.server 8738
```
Then open http://localhost:8738.

## Domain (GoDaddy → GitHub Pages)
In GoDaddy DNS for `inraasolution.com`:
- Delete the existing `A` records for `@` (GoDaddy parking).
- Add four `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
- Set `CNAME` for `www` to `noormohammedj.github.io`.

After DNS updates (up to a few hours), tick **Enforce HTTPS** in the repository's Settings → Pages.
