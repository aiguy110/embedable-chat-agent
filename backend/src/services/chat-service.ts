import { LLMClient, ChatMessage } from '../llm/client';
import { MCPManager } from '../mcp/manager';

export class ChatService {
  constructor(
    private llmClient: LLMClient,
    private mcpManager: MCPManager,
    private systemPrompt: string
  ) {}

  async *processMessage(
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): AsyncGenerator<string | { type: 'tool'; data: any }, void, unknown> {
    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    const tools = this.mcpManager.hasTools() ? this.mcpManager.getOpenAITools() : undefined;

    let requiresToolExecution = true;
    let currentMessages = [...messages];

    while (requiresToolExecution) {
      requiresToolExecution = false;
      let assistantMessage = '';
      let toolCalls: any[] | null = null;

      // Stream the response
      for await (const chunk of this.llmClient.streamChat(currentMessages, tools)) {
        if (typeof chunk === 'string') {
          assistantMessage += chunk;
          yield chunk;
        } else if ('toolCalls' in chunk) {
          toolCalls = chunk.toolCalls;
        }
      }

      // Handle tool calls if present
      if (toolCalls && toolCalls.length > 0) {
        requiresToolExecution = true;

        // Add assistant message with tool calls
        currentMessages.push({
          role: 'assistant',
          content: assistantMessage || '',
          tool_calls: toolCalls,
        });

        // Execute each tool and add results
        for (const toolCall of toolCalls) {
          let args: any = {};
          try {
            args = JSON.parse(toolCall.function.arguments);
            const result = await this.mcpManager.executeTool(toolCall.function.name, args);

            // Format tool result
            const toolResultContent = JSON.stringify(result.content || result);

            currentMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: toolResultContent,
            });

            // Send tool execution info to frontend
            yield {
              type: 'tool',
              data: {
                name: toolCall.function.name,
                arguments: args,
                result: result.content || result,
                status: 'success',
              },
            };
          } catch (error) {
            console.error(`Tool execution error:`, error);
            const errorMessage = (error as Error).message;

            currentMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: `Error: ${errorMessage}`,
            });

            // Send tool error info to frontend
            yield {
              type: 'tool',
              data: {
                name: toolCall.function.name,
                arguments: args,
                error: errorMessage,
                status: 'error',
              },
            };
          }
        }
      }
    }
  }
}
