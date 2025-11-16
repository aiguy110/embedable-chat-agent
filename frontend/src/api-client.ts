export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolCallData {
  name: string;
  arguments: any;
  result?: any;
  error?: string;
  status: 'success' | 'error';
}

export interface StreamCallbacks {
  onContent: (content: string) => void;
  onTool: (toolData: ToolCallData) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
  }

  async sendMessage(
    message: string,
    history: Message[],
    callbacks: StreamCallbacks
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'content') {
                callbacks.onContent(parsed.content);
              } else if (parsed.type === 'tool') {
                callbacks.onTool({
                  name: parsed.name,
                  arguments: parsed.arguments,
                  result: parsed.result,
                  error: parsed.error,
                  status: parsed.status,
                });
              } else if (parsed.type === 'done') {
                callbacks.onDone();
              } else if (parsed.type === 'error') {
                callbacks.onError(parsed.error);
              }
            } catch (e) {
              console.error('Failed to parse SSE message:', data);
            }
          }
        }
      }
    } catch (error) {
      callbacks.onError((error as Error).message);
    }
  }
}
