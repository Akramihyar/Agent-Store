# Architecture

## Routing
- `/` – chat landing
- `/assistants` – Agents Store
- `/assistants/:id/chat` – per-agent page (chat shell or custom form)

Defined in `src/App.tsx` using React Router.

## Components
- `Sidebar` – static nav with link to Agents Store
- `MainContent` – chat shell: header badge, transcript, input
- `SalesMissionForm` – special page for sales agent
- `LoadingDog` – animated loader

## Data flow
- Messages/form submissions send a POST to the agent endpoint via `sendMessageToAgent`.
- The response is parsed; if it contains `reply[0].Folder_url`, the app renders a tree + clickable company name.
- Otherwise, text or raw JSON is shown so the user sees what was returned.

## Agents
- Registry entry: id, name, icon, endpoint
- Custom behavior routed in `ChatPage.tsx`

## Styling
- TailwindCSS + CSS variables for theme colors
- Minimal custom CSS; responsive by default

## Accessibility
- Semantic landmarks, keyboard-friendly controls
- Enter-to-send, Shift+Enter newline in chat shell
- Buttons have accessible labels
