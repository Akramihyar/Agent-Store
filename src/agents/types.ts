export type AgentId = string;

export interface AgentEndpoint {
  type: 'webhook' | 'http' | 'ws';
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

export interface AgentDefinition {
  id: AgentId;
  name: string;
  description?: string;
  icon: 'support' | 'sales' | 'ops' | 'generic';
  endpoint: AgentEndpoint;
  // Extendable per-agent settings in future
  settings?: Record<string, unknown>;
}
