# Agents

Agents are modular units that define a name, icon, and an HTTP endpoint (usually an n8n webhook). The UI can render a default chat shell or a custom page per agent.

## Where agents live

- `src/agents/types.ts` – type definitions
- `src/agents/registry.ts` – add/edit agents here
- `src/agents/client.ts` – sends JSON payloads to the agent endpoint

```ts
export interface AgentDefinition {
  id: string;
  name: string;
  description?: string;
  icon: 'support' | 'sales' | 'ops' | 'generic';
  endpoint: { type: 'webhook' | 'http' | 'ws'; url: string; method?: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE' };
}
```

## Expected response

Default chat shell expects a JSON of the form:
```json
{
  "reply": [
    { "Folder_url": "https://...", "Company_name": "Acme" }
  ]
}
```
- If `Company_name` is absent, the UI derives a readable label from the URL host.

## Custom UI per agent

Switch on `id` in `src/pages/ChatPage.tsx` and render an alternative page:
```ts
if (agent?.id === 'sales') {
  return <SalesMissionForm badgeLabel={label} agentId={agent.id} />;
}
```

## Payloads sent to agents

- Chat shell: `{ agentId, agentName, message, userId, metadata, timestamp }`
- Sales mission form: A single `message` string including `company_name`, `company_url`, `count`.

If you need richer structures, adjust `sendMessageToAgent` to post a structured JSON payload and update the receiver.
