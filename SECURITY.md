# Security

## Security model

DemoVox is a static website. It has no backend, no database and no server-side secrets, so hosting it costs nothing beyond static hosting and cannot spend anyone else's API credits.

| Data | Where it goes | Where it is stored |
| --- | --- | --- |
| Anthropic API key | `api.anthropic.com`, directly from the browser | `sessionStorage` (cleared when the tab closes), or `localStorage` only if the user ticks "Remember on this device" |
| ElevenLabs API key | `api.elevenlabs.io`, directly from the browser | Same as above |
| Product description and screenshots | `api.anthropic.com` (as message content) | Browser memory only |
| Voiceover script | `api.elevenlabs.io` | Browser memory only |
| Generated audio and video | Nowhere: rendered in the browser with WebCodecs | Browser memory until downloaded |
| Cost estimates | Nowhere | `localStorage` |
| Site origin (e.g. `https://example.com`) | `www.remotion.pro`, Remotion's license usage counter, once per render | — |

Defenses in place:

- **No untrusted HTML.** Model output, error messages and file names are rendered as plain text. Nothing uses `dangerouslySetInnerHTML` or renders Markdown.
- **The model cannot reach the network.** Its only tools are `generate_voiceover` and `render_video`. Their inputs are validated: script length, a hex color, and screenshot ids that must match images the user attached. The model never sees the API keys and cannot supply URLs.
- **Content Security Policy** in production builds (`app/layout.tsx`). Scripts, images, media, fonts and workers load only from the site itself or in-memory `blob:`/`data:` URLs. Network requests are allowed only to `api.anthropic.com`, `api.elevenlabs.io` and `www.remotion.pro`.
- **Host security headers** in `public/_headers` (Netlify and Cloudflare Pages read it): `frame-ancestors 'none'` against clickjacking, `nosniff` and `no-referrer`. On other hosts, set the same headers in the host's config.
- **Per-message limits** in the agent loop (`lib/agent.ts`): at most 6 model calls of up to 8,000 output tokens, 2 voiceovers, 1 render and 120 words of narration each time the user sends a message. Screenshots are sent as images only on the turn they were attached.
- **Keys are never logged**, never put in URLs and never sent to the site's own origin.

What this does not protect against:

- Malicious browser extensions or a compromised device can read anything in the page, including keys. Users should use keys with spending limits and revoke them when done.
- A CSP cannot stop every way out: code that somehow got injected could still leak data by navigating the page. The real defense is having no injection path, as described above.
- Prompt injection inside a screenshot or description can change what the video says, and spend up to the per-message limits on the user's own accounts. It cannot reach the keys or any other site.
- If you fork and deploy DemoVox, you are responsible for what you deploy. Do not add a backend that holds your own keys unless you also add authentication and rate limiting.

## Reporting a vulnerability

Please do not open a public issue for security problems. Use GitHub's [private vulnerability reporting](https://github.com/san97o/demovox/security/advisories/new) for this repository.
