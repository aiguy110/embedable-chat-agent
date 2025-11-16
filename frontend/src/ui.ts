import { Message } from './api-client';

export class ChatUI {
  private container: HTMLElement;
  private messagesContainer: HTMLElement;
  private inputContainer: HTMLElement;
  private input: HTMLTextAreaElement;
  private sendButton: HTMLButtonElement;
  private toggleButton: HTMLElement;
  private isOpen: boolean = false;

  constructor(containerId: string = 'embed-chat-widget') {
    this.container = this.createContainer(containerId);
    this.toggleButton = this.createToggleButton();
    this.messagesContainer = this.createMessagesContainer();
    this.inputContainer = this.createInputContainer();
    this.input = this.createInput();
    this.sendButton = this.createSendButton();

    this.setupLayout();
    this.setupStyles();
  }

  private createContainer(id: string): HTMLElement {
    const container = document.createElement('div');
    container.id = id;
    container.className = 'embed-chat-container';
    container.style.display = 'none'; // Hidden by default
    document.body.appendChild(container);
    return container;
  }

  private createToggleButton(): HTMLElement {
    const button = document.createElement('div');
    button.className = 'embed-chat-toggle';
    button.innerHTML = '💬';
    button.onclick = () => this.toggle();
    document.body.appendChild(button);
    return button;
  }

  private createMessagesContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'embed-chat-messages';
    return container;
  }

  private createInputContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'embed-chat-input-container';
    return container;
  }

  private createInput(): HTMLTextAreaElement {
    const input = document.createElement('textarea');
    input.className = 'embed-chat-input';
    input.placeholder = 'Type your message...';
    input.rows = 1;

    // Auto-resize textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    // Send on Enter (but allow Shift+Enter for new lines)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendButton.click();
      }
    });

    return input;
  }

  private createSendButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'embed-chat-send';
    button.innerHTML = '➤';
    button.type = 'button';
    return button;
  }

  private setupLayout(): void {
    this.inputContainer.appendChild(this.input);
    this.inputContainer.appendChild(this.sendButton);

    const header = document.createElement('div');
    header.className = 'embed-chat-header';
    header.innerHTML = '<span>Chat Assistant</span>';

    const closeButton = document.createElement('button');
    closeButton.className = 'embed-chat-close';
    closeButton.innerHTML = '✕';
    closeButton.onclick = () => this.toggle();
    header.appendChild(closeButton);

    this.container.appendChild(header);
    this.container.appendChild(this.messagesContainer);
    this.container.appendChild(this.inputContainer);
  }

  private setupStyles(): void {
    if (document.getElementById('embed-chat-styles')) {
      return; // Already injected
    }

    const style = document.createElement('style');
    style.id = 'embed-chat-styles';
    style.textContent = `
      .embed-chat-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #007bff;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: transform 0.2s, box-shadow 0.2s;
        z-index: 9999;
      }

      .embed-chat-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }

      .embed-chat-container {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 380px;
        max-width: calc(100vw - 40px);
        height: 600px;
        max-height: calc(100vh - 120px);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        display: flex;
        flex-direction: column;
        z-index: 9998;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .embed-chat-header {
        padding: 16px;
        background: #007bff;
        color: white;
        border-radius: 12px 12px 0 0;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .embed-chat-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .embed-chat-close:hover {
        background: rgba(255,255,255,0.1);
      }

      .embed-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .embed-chat-message {
        padding: 10px 14px;
        border-radius: 12px;
        max-width: 80%;
        word-wrap: break-word;
        animation: slideIn 0.2s ease-out;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .embed-chat-message.user {
        background: #007bff;
        color: white;
        align-self: flex-end;
        margin-left: auto;
      }

      .embed-chat-message.assistant {
        background: #f1f3f4;
        color: #202124;
        align-self: flex-start;
      }

      .embed-chat-message.assistant pre {
        background: #e8eaed;
        padding: 8px;
        border-radius: 6px;
        overflow-x: auto;
      }

      .embed-chat-input-container {
        display: flex;
        gap: 8px;
        padding: 12px;
        border-top: 1px solid #e0e0e0;
      }

      .embed-chat-input {
        flex: 1;
        padding: 10px;
        border: 1px solid #d0d0d0;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        resize: none;
        outline: none;
        transition: border-color 0.2s;
      }

      .embed-chat-input:focus {
        border-color: #007bff;
      }

      .embed-chat-send {
        padding: 10px 16px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 18px;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .embed-chat-send:hover:not(:disabled) {
        background: #0056b3;
      }

      .embed-chat-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .embed-chat-typing {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #999;
        animation: typing 1.4s infinite;
      }

      @keyframes typing {
        0%, 60%, 100% { opacity: 0.3; }
        30% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  public toggle(): void {
    this.isOpen = !this.isOpen;
    this.container.style.display = this.isOpen ? 'flex' : 'none';

    if (this.isOpen) {
      this.input.focus();
    }
  }

  public addMessage(role: 'user' | 'assistant', content: string): HTMLElement {
    const messageEl = document.createElement('div');
    messageEl.className = `embed-chat-message ${role}`;
    messageEl.textContent = content;
    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
    return messageEl;
  }

  public updateMessage(messageEl: HTMLElement, content: string): void {
    messageEl.textContent = content;
    this.scrollToBottom();
  }

  public clearInput(): void {
    this.input.value = '';
    this.input.style.height = 'auto';
  }

  public getInput(): string {
    return this.input.value.trim();
  }

  public setInputDisabled(disabled: boolean): void {
    this.input.disabled = disabled;
    this.sendButton.disabled = disabled;
  }

  public onSend(callback: () => void): void {
    this.sendButton.onclick = callback;
  }

  private scrollToBottom(): void {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}
