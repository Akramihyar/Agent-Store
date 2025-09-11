import { AgentDefinition } from './types';

export interface SendMessagePayload {
  agentId: string;
  message: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export async function sendMessageToAgent(agent: AgentDefinition, payload: SendMessagePayload) {
  const body = {
    agentId: agent.id,
    agentName: agent.name,
    message: payload.message,
    userId: payload.userId ?? 'demo-user',
    metadata: payload.metadata ?? {},
    timestamp: new Date().toISOString(),
  };

  const method = agent.endpoint.method ?? 'POST';
  const res = await fetch(agent.endpoint.url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Agent endpoint error ${res.status}: ${text}`);
  }

  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      // fallthrough to text
    }
  }
  const text = await res.text().catch(() => '');
  return text;
}
