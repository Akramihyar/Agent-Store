# Hub UI Recreation (React + Tailwind)

This is a clean, componentized recreation of the Hub UI chat/agents experience built with Vite + React + Tailwind, with minimal state and no external trackers. It is designed to be extended by multiple agents, each with its own endpoint (e.g., n8n webhooks).

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` and navigate to "Agents Store".

## What’s included

- Agents Store with per-agent routes
- Chat UI with bubbles, Enter-to-send, Shift+Enter newline
- Sales agent mission form (not chat): Company name, URL, number of documents
- Animated loader while awaiting responses
- n8n webhook integration (per-agent endpoint)

## Directory structure

```
/clean-react
  index.html
  tailwind.config.js
  postcss.config.js
  vite.config.ts
  /src
    main.tsx
    App.tsx
    /agents
      registry.ts         # Agent catalog with endpoints
      types.ts            # Agent types
      client.ts           # Sends messages to agent endpoints
    /components
      MainContent.tsx     # Chat UI shell
      Sidebar.tsx
      LoadingDog.tsx
      /icons               # Inline SVG icon components
    /pages
      AssistantsPage.tsx  # Agents Store
      ChatPage.tsx        # Per-agent view; switches Sales to form
      SalesMissionForm.tsx
    /data
      content.json        # Sidebar nav labels
    /styles
      globals.css
```

## Architecture overview

- Routing: `App.tsx` defines `/`, `/assistants`, `/assistants/:id/chat`.
- Sidebar → "Agents Store" → pick agent → Chat or Form (depending on agent id).
- Agents are modular: each entry in `src/agents/registry.ts` defines id, name, icon, and `endpoint`.
- Chat UI (`MainContent.tsx`):
  - Maintains transcript state
  - Enter sends, Shift+Enter newline
  - Shows loader while awaiting response
  - Expects JSON body from endpoint:
    ```json
    { "reply": [ { "Folder_url": "https://...", "Company_name": "..." } ] }
    ```
  - Renders a tree + clickable company name (falls back to host-derived name)
- Sales agent form (`SalesMissionForm.tsx`):
  - Posts a single mission with `company_name`, `company_url`, `count`
  - Renders a single result card when complete

## n8n integration

- Each agent’s endpoint is defined in `src/agents/registry.ts`. Point these to your n8n webhook URLs.
- Recommended response contract for Respond to Webhook:
  ```json
  {
    "reply": [
      { "Folder_url": "https://...", "Company_name": "Acme" }
    ]
  }
  ```
- Ensure the Webhook node is set to respond only when the last node finishes (or use Respond to Webhook).
- Set `Content-Type: application/json` on the final response.

## Styling & tokens

- Colors are exposed via CSS variables in `src/styles/globals.css` and mapped in `tailwind.config.js`.
- Components use Tailwind utilities, with minimal custom CSS.

## Adding a new agent

1. Add an entry to `src/agents/registry.ts`:
   ```ts
   {
     id: 'research',
     name: 'Research Agent',
     description: 'Finds and summarizes sources.',
     icon: 'generic',
     endpoint: { type: 'webhook', url: 'https://your-n8n/webhook/research', method: 'POST' },
   }
   ```
2. If it needs a custom UI instead of chat, switch on its `id` in `src/pages/ChatPage.tsx` and render a custom page.

## Conventions

- TypeScript, explicit prop types
- Semantic HTML, accessible focus states
- No runtime analytics or tracking scripts

## Scripts

- `npm run dev` – start Vite dev server
- `npm run build` – build for production
- `npm run preview` – preview built app
- `npm run lint` – run linter

## Troubleshooting

- Loader doesn’t stop: ensure the webhook delays response until the final result and returns JSON with the fields above.
- Empty `Response: {}`: your webhook responded with an empty object; double-check the Respond to Webhook node output.
- CORS: if testing across domains, add `Access-Control-Allow-Origin: *` on n8n response.

## License / attribution

- Inline SVG icons are derived from the original UI; fonts replaced with system stack/Inter.
- No third-party tracking included.
