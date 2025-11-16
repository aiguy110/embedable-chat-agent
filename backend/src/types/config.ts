export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface LLMConfig {
  provider: 'openai' | 'custom';
  model: string;
  apiKey?: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AppConfig {
  llm: LLMConfig;
  systemPrompt: string;
  mcpServers?: MCPServerConfig[];
  cors?: {
    allowedOrigins?: string[];
  };
}
