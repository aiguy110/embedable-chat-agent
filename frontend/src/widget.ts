import { APIClient, Message, ToolCallData } from './api-client';
import { ChatUI } from './ui';

interface EmbedChatConfig {
  baseURL: string;
}

class EmbedChatWidget {
  private apiClient: APIClient | null = null;
  private ui: ChatUI | null = null;
  private conversationHistory: Message[] = [];
  private isProcessing: boolean = false;

  public init(config: EmbedChatConfig): void {
    if (!config.baseURL) {
      throw new Error('baseURL is required in EmbedChat.init()');
    }

    this.apiClient = new APIClient(config.baseURL);
    this.ui = new ChatUI();

    this.ui.onSend(() => this.handleSend());

    console.log('EmbedChat initialized with baseURL:', config.baseURL);
  }

  private async handleSend(): Promise<void> {
    if (!this.ui || !this.apiClient) {
      console.error('Widget not initialized. Call EmbedChat.init() first.');
      return;
    }

    const userMessage = this.ui.getInput();

    if (!userMessage || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.ui.setInputDisabled(true);

    // Add user message to UI and history
    this.ui.addMessage('user', userMessage);
    this.conversationHistory.push({ role: 'user', content: userMessage });

    this.ui.clearInput();

    // Track assistant message element and content
    let assistantMessageEl: HTMLElement | null = null;
    let assistantContent = '';
    let currentSegmentContent = '';

    try {
      await this.apiClient.sendMessage(userMessage, this.conversationHistory, {
        onContent: (content: string) => {
          assistantContent += content;
          currentSegmentContent += content;

          // Create assistant message element on first content
          if (!assistantMessageEl) {
            assistantMessageEl = this.ui!.addMessage('assistant', currentSegmentContent);
          } else {
            this.ui!.updateMessage(assistantMessageEl, currentSegmentContent);
          }
        },
        onTool: (toolData: ToolCallData) => {
          this.ui!.addToolCall(toolData);

          // Reset for next segment - create new message element for content after tool
          assistantMessageEl = null;
          currentSegmentContent = '';
        },
        onDone: () => {
          // Only add to history if we have content
          if (assistantContent) {
            this.conversationHistory.push({
              role: 'assistant',
              content: assistantContent,
            });
          }
          this.isProcessing = false;
          this.ui!.setInputDisabled(false);
        },
        onError: (error: string) => {
          console.error('Chat error:', error);

          if (!assistantMessageEl) {
            assistantMessageEl = this.ui!.addMessage('assistant', `Error: ${error}`);
          } else {
            this.ui!.updateMessage(assistantMessageEl, `Error: ${error}`);
          }
          this.isProcessing = false;
          this.ui!.setInputDisabled(false);
        },
      });
    } catch (error) {
      console.error('Unexpected error:', error);

      if (!assistantMessageEl) {
        this.ui.addMessage('assistant', `Error: ${(error as Error).message}`);
      } else {
        this.ui.updateMessage(assistantMessageEl, `Error: ${(error as Error).message}`);
      }
      this.isProcessing = false;
      this.ui.setInputDisabled(false);
    }
  }

  public open(): void {
    if (this.ui && !(this.ui as any).isOpen) {
      this.ui.toggle();
    }
  }

  public close(): void {
    if (this.ui && (this.ui as any).isOpen) {
      this.ui.toggle();
    }
  }
}

// Export as global singleton
const embedChat = new EmbedChatWidget();

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).EmbedChat = embedChat;
}

export default embedChat;
