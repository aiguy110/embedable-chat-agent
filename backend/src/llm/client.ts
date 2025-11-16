import OpenAI from 'openai';
import { LLMConfig } from '../types/config';
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export class LLMClient {
  private client: OpenAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;

    const apiKey = config.apiKey || process.env.OPENAI_API_KEY || 'dummy-key';

    this.client = new OpenAI({
      apiKey,
      baseURL: config.baseURL,
    });
  }

  async *streamChat(
    messages: ChatMessage[],
    tools?: ChatCompletionTool[]
  ): AsyncGenerator<string | { toolCalls: any[] }, void, unknown> {
    try {
      const formattedMessages: ChatCompletionMessageParam[] = messages.map(msg => {
        if (msg.role === 'system') {
          return { role: 'system', content: msg.content };
        } else if (msg.role === 'user') {
          return { role: 'user', content: msg.content };
        } else if (msg.role === 'assistant') {
          if (msg.tool_calls && msg.tool_calls.length > 0) {
            return {
              role: 'assistant',
              content: msg.content || null,
              tool_calls: msg.tool_calls,
            };
          }
          return { role: 'assistant', content: msg.content };
        } else if (msg.role === 'tool') {
          return {
            role: 'tool',
            content: msg.content,
            tool_call_id: msg.tool_call_id || '',
          };
        }
        throw new Error(`Unknown message role: ${msg.role}`);
      });

      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: formattedMessages,
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens,
        stream: true,
        ...(tools && tools.length > 0 && { tools }),
      });

      let toolCalls: any[] = [];

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (!delta) continue;

        // Handle tool calls
        if (delta.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const index = toolCall.index;

            if (!toolCalls[index]) {
              toolCalls[index] = {
                id: toolCall.id || '',
                type: 'function',
                function: {
                  name: toolCall.function?.name || '',
                  arguments: ''
                }
              };
            }

            if (toolCall.function?.name) {
              toolCalls[index].function.name = toolCall.function.name;
            }

            if (toolCall.function?.arguments) {
              toolCalls[index].function.arguments += toolCall.function.arguments;
            }

            if (toolCall.id) {
              toolCalls[index].id = toolCall.id;
            }
          }
        }

        // Handle content
        if (delta.content) {
          yield delta.content;
        }

        // Check if stream is finished
        if (chunk.choices[0]?.finish_reason === 'tool_calls' && toolCalls.length > 0) {
          yield { toolCalls };
        }
      }
    } catch (error) {
      console.error('Error in LLM streaming:', error);
      throw error;
    }
  }

  async chat(messages: ChatMessage[], tools?: ChatCompletionTool[]): Promise<string> {
    const formattedMessages: ChatCompletionMessageParam[] = messages.map(msg => {
      if (msg.role === 'system') {
        return { role: 'system', content: msg.content };
      } else if (msg.role === 'user') {
        return { role: 'user', content: msg.content };
      } else if (msg.role === 'assistant') {
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          return {
            role: 'assistant',
            content: msg.content || null,
            tool_calls: msg.tool_calls,
          };
        }
        return { role: 'assistant', content: msg.content };
      } else if (msg.role === 'tool') {
        return {
          role: 'tool',
          content: msg.content,
          tool_call_id: msg.tool_call_id || '',
        };
      }
      throw new Error(`Unknown message role: ${msg.role}`);
    });

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: formattedMessages,
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens,
      ...(tools && tools.length > 0 && { tools }),
    });

    return response.choices[0]?.message?.content || '';
  }
}
