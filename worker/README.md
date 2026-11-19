# Optional: AI proposal writer

The website works without this. Its built-in agent (`assets/js/agent.js`) already writes the requirement
document and a full technical and commercial proposal in the browser.

Deploy this worker if you want Claude to rewrite the proposal text for each client. Prices and days still
come from the website's pricing model, so every client sees consistent numbers.

1. Install and sign in to Cloudflare:
   ```bash
   cd worker && npm install && npx wrangler login
   ```
2. Store your Anthropic API key as a secret (never commit it):
   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   ```
3. Deploy:
   ```bash
   npm run deploy
   ```
4. Copy the URL it prints (for example `https://inraa-proposal.<you>.workers.dev`) into `aiEndpoint`
   in `assets/js/config.js`, then commit and push.

Model: `claude-opus-5-5`, with server-side refusal fallbacks turned on (`fallbacks: "default"`).
Remove the `betas` and `fallbacks` lines in `src/index.js` if you don't want fallbacks.
