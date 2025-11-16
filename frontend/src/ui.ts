import { Message, ToolCallData } from "./api-client";
import { marked } from "marked";
import DOMPurify from "dompurify";

export class ChatUI {
  private container: HTMLElement;
  private messagesContainer: HTMLElement;
  private inputContainer: HTMLElement;
  private input: HTMLTextAreaElement;
  private sendButton: HTMLButtonElement;
  private toggleButton: HTMLElement;
  private isOpen: boolean = false;

  constructor(containerId: string = "embed-chat-widget") {
    this.container = this.createContainer(containerId);
    this.toggleButton = this.createToggleButton();
    this.messagesContainer = this.createMessagesContainer();
    this.inputContainer = this.createInputContainer();
    this.input = this.createInput();
    this.sendButton = this.createSendButton();

    this.setupLayout();
    this.setupStyles();
    this.configureMarked();
  }

  private configureMarked(): void {
    // Configure marked options
    marked.setOptions({
      breaks: true, // Convert \n to <br>
      gfm: true, // GitHub Flavored Markdown
    });

    // Configure renderer for links to open in new tab
    const renderer = new marked.Renderer();
    const originalLinkRenderer = renderer.link.bind(renderer);
    renderer.link = (token) => {
      const html = originalLinkRenderer(token);
      return html.replace(
        /^<a /,
        '<a target="_blank" rel="noopener noreferrer" ',
      );
    };
    marked.setOptions({ renderer });
  }

  private parseMarkdown(text: string): string {
    // Parse markdown to HTML
    const rawHtml = marked.parse(text, { async: false }) as string;

    // Sanitize the HTML to prevent XSS attacks
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "s",
        "code",
        "pre",
        "a",
        "ul",
        "ol",
        "li",
        "blockquote",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "hr",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "div",
        "span",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "class"],
    });

    return cleanHtml;
  }

  private createContainer(id: string): HTMLElement {
    const container = document.createElement("div");
    container.id = id;
    container.className = "embed-chat-container";
    container.style.display = "none"; // Hidden by default
    document.body.appendChild(container);
    return container;
  }

  private createToggleButton(): HTMLElement {
    const button = document.createElement("div");
    button.className = "embed-chat-toggle";
    button.innerHTML = "💬";
    button.onclick = () => this.toggle();
    document.body.appendChild(button);
    return button;
  }

  private createMessagesContainer(): HTMLElement {
    const container = document.createElement("div");
    container.className = "embed-chat-messages";
    return container;
  }

  private createInputContainer(): HTMLElement {
    const container = document.createElement("div");
    container.className = "embed-chat-input-container";
    return container;
  }

  private createInput(): HTMLTextAreaElement {
    const input = document.createElement("textarea");
    input.className = "embed-chat-input";
    input.placeholder = "Type your message...";
    input.rows = 1;

    // Auto-resize textarea
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });

    // Send on Enter (but allow Shift+Enter for new lines)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendButton.click();
      }
    });

    return input;
  }

  private createSendButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "embed-chat-send";
    button.innerHTML = "➤";
    button.type = "button";
    return button;
  }

  private setupLayout(): void {
    this.inputContainer.appendChild(this.input);
    this.inputContainer.appendChild(this.sendButton);

    const header = document.createElement("div");
    header.className = "embed-chat-header";
    header.innerHTML = "<span>Chat Assistant</span>";

    const closeButton = document.createElement("button");
    closeButton.className = "embed-chat-close";
    closeButton.innerHTML = "✕";
    closeButton.onclick = () => this.toggle();
    header.appendChild(closeButton);

    this.container.appendChild(header);
    this.container.appendChild(this.messagesContainer);
    this.container.appendChild(this.inputContainer);
  }

  private setupStyles(): void {
    if (document.getElementById("embed-chat-styles")) {
      return; // Already injected
    }

    const style = document.createElement("style");
    style.id = "embed-chat-styles";
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
        line-height: 1.5;
        overflow-wrap: break-word;
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

      .embed-chat-message pre {
        background: #2d2d2d;
        color: #f8f8f2;
        padding: 12px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 8px 0;
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 13px;
      }

      .embed-chat-message code {
        background: rgba(0, 0, 0, 0.08);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 13px;
      }

      .embed-chat-message.user code {
        background: rgba(255, 255, 255, 0.2);
      }

      .embed-chat-message pre code {
        background: transparent;
        padding: 0;
      }

      .embed-chat-message strong {
        font-weight: 600;
      }

      .embed-chat-message em {
        font-style: italic;
      }

      .embed-chat-message ul,
      .embed-chat-message ol {
        margin: 8px 0;
        padding-left: 24px;
      }

      .embed-chat-message li {
        margin: 4px 0;
      }

      .embed-chat-message p {
        margin: 8px 0;
      }

      .embed-chat-message p:first-child {
        margin-top: 0;
      }

      .embed-chat-message p:last-child {
        margin-bottom: 0;
      }

      .embed-chat-message a {
        color: #007bff;
        text-decoration: underline;
      }

      .embed-chat-message.user a {
        color: #ffffff;
      }

      .embed-chat-message h1,
      .embed-chat-message h2,
      .embed-chat-message h3,
      .embed-chat-message h4,
      .embed-chat-message h5,
      .embed-chat-message h6 {
        margin: 12px 0 8px 0;
        font-weight: 600;
        line-height: 1.3;
      }

      .embed-chat-message h1 { font-size: 1.5em; }
      .embed-chat-message h2 { font-size: 1.3em; }
      .embed-chat-message h3 { font-size: 1.1em; }
      .embed-chat-message h4,
      .embed-chat-message h5,
      .embed-chat-message h6 { font-size: 1em; }

      .embed-chat-message blockquote {
        border-left: 3px solid #007bff;
        margin: 8px 0;
        padding: 4px 0 4px 12px;
        color: #5a5a5a;
        font-style: italic;
      }

      .embed-chat-message.user blockquote {
        border-left-color: rgba(255, 255, 255, 0.5);
        color: rgba(255, 255, 255, 0.9);
      }

      .embed-chat-message hr {
        border: none;
        border-top: 1px solid #e0e0e0;
        margin: 12px 0;
      }

      .embed-chat-message table {
        border-collapse: collapse;
        width: 100%;
        margin: 8px 0;
        font-size: 13px;
      }

      .embed-chat-message th,
      .embed-chat-message td {
        border: 1px solid #d0d0d0;
        padding: 6px 10px;
        text-align: left;
      }

      .embed-chat-message th {
        background: #f5f5f5;
        font-weight: 600;
      }

      .embed-chat-message.user th {
        background: rgba(255, 255, 255, 0.2);
      }

      .embed-chat-message.user th,
      .embed-chat-message.user td {
        border-color: rgba(255, 255, 255, 0.3);
      }

      .embed-chat-tool-call {
        background: #3a3a3a;
        border-radius: 8px;
        margin: 8px 0;
        overflow: hidden;
        max-width: 90%;
        min-width: 200px;
        align-self: flex-start;
        flex-shrink: 0;
        min-height: 44px;
      }

      .embed-chat-tool-header {
        padding: 10px 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        user-select: none;
        transition: background 0.2s;
        min-height: 44px;
        flex-shrink: 0;
      }

      .embed-chat-tool-header:hover {
        background: #444444;
      }

      .embed-chat-tool-header-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;
      }

      .embed-chat-tool-icon {
        font-size: 16px;
        flex-shrink: 0;
        line-height: 1;
      }

      .embed-chat-tool-name {
        color: #ffffff;
        font-weight: 500;
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 13px;
        flex-shrink: 0;
        white-space: nowrap;
      }

      .embed-chat-tool-status {
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        flex-shrink: 0;
        white-space: nowrap;
      }

      .embed-chat-tool-status.success {
        background: #28a745;
        color: white;
      }

      .embed-chat-tool-status.error {
        background: #dc3545;
        color: white;
      }

      .embed-chat-tool-expand {
        color: #aaaaaa;
        font-size: 12px;
        transition: transform 0.2s;
        flex-shrink: 0;
        line-height: 1;
        margin-left: 8px;
      }

      .embed-chat-tool-details {
        border-top: 1px solid #555555;
        padding: 12px 14px;
        background: #2d2d2d;
      }

      .embed-chat-tool-section {
        margin-bottom: 12px;
      }

      .embed-chat-tool-section:last-child {
        margin-bottom: 0;
      }

      .embed-chat-tool-section-label {
        color: #aaaaaa;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        margin-bottom: 6px;
        letter-spacing: 0.5px;
      }

      .embed-chat-tool-section-content {
        color: #f8f8f2;
      }

      .embed-chat-tool-section-content pre {
        margin: 0;
        background: #1e1e1e;
        border: 1px solid #444444;
      }

      .embed-chat-tool-section-content code {
        color: #f8f8f2;
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
    this.container.style.display = this.isOpen ? "flex" : "none";

    if (this.isOpen) {
      this.input.focus();
    }
  }

  public addMessage(role: "user" | "assistant", content: string): HTMLElement {
    const messageEl = document.createElement("div");
    messageEl.className = `embed-chat-message ${role}`;

    if (role === "assistant") {
      messageEl.innerHTML = this.parseMarkdown(content);
    } else {
      messageEl.textContent = content;
    }

    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
    return messageEl;
  }

  public updateMessage(messageEl: HTMLElement, content: string): void {
    if (messageEl.classList.contains("assistant")) {
      messageEl.innerHTML = this.parseMarkdown(content);
    } else {
      messageEl.textContent = content;
    }
    this.scrollToBottom();
  }

  public addToolCall(toolData: ToolCallData): void {
    const toolContainer = document.createElement("div");
    toolContainer.className = "embed-chat-tool-call";

    const header = document.createElement("div");
    header.className = "embed-chat-tool-header";

    const headerContent = document.createElement("div");
    headerContent.className = "embed-chat-tool-header-content";

    const icon = document.createElement("span");
    icon.className = "embed-chat-tool-icon";
    icon.textContent = "🔧";

    const name = document.createElement("span");
    name.className = "embed-chat-tool-name";
    name.textContent = toolData.name;

    const statusBadge = document.createElement("span");
    statusBadge.className = `embed-chat-tool-status ${toolData.status}`;
    statusBadge.textContent = toolData.status === "success" ? "✓" : "✗";

    const expandIcon = document.createElement("span");
    expandIcon.className = "embed-chat-tool-expand";
    expandIcon.textContent = "▼";

    headerContent.appendChild(icon);
    headerContent.appendChild(name);
    headerContent.appendChild(statusBadge);

    header.appendChild(headerContent);
    header.appendChild(expandIcon);

    const details = document.createElement("div");
    details.className = "embed-chat-tool-details";
    details.style.display = "none";

    // Arguments section
    const argsSection = document.createElement("div");
    argsSection.className = "embed-chat-tool-section";

    const argsLabel = document.createElement("div");
    argsLabel.className = "embed-chat-tool-section-label";
    argsLabel.textContent = "Arguments:";

    const argsContent = document.createElement("div");
    argsContent.className = "embed-chat-tool-section-content";
    const argsCode =
      "```json\n" + JSON.stringify(toolData.arguments, null, 2) + "\n```";
    argsContent.innerHTML = this.parseMarkdown(argsCode);

    argsSection.appendChild(argsLabel);
    argsSection.appendChild(argsContent);

    // Result/Error section
    const resultSection = document.createElement("div");
    resultSection.className = "embed-chat-tool-section";

    const resultLabel = document.createElement("div");
    resultLabel.className = "embed-chat-tool-section-label";
    resultLabel.textContent =
      toolData.status === "error" ? "Error:" : "Result:";

    const resultContent = document.createElement("div");
    resultContent.className = "embed-chat-tool-section-content";

    if (toolData.status === "error") {
      resultContent.innerHTML = this.parseMarkdown(
        "```\n" + toolData.error + "\n```",
      );
    } else {
      const resultStr =
        typeof toolData.result === "string"
          ? toolData.result
          : JSON.stringify(toolData.result, null, 2);
      resultContent.innerHTML = this.parseMarkdown(
        "```json\n" + resultStr + "\n```",
      );
    }

    resultSection.appendChild(resultLabel);
    resultSection.appendChild(resultContent);

    details.appendChild(argsSection);
    details.appendChild(resultSection);

    toolContainer.appendChild(header);
    toolContainer.appendChild(details);

    // Toggle expand/collapse
    header.addEventListener("click", () => {
      const isExpanded = details.style.display !== "none";
      details.style.display = isExpanded ? "none" : "block";
      expandIcon.textContent = isExpanded ? "▼" : "▲";
      expandIcon.style.transform = isExpanded
        ? "rotate(0deg)"
        : "rotate(180deg)";
    });

    this.messagesContainer.appendChild(toolContainer);
    this.scrollToBottom();
  }

  public clearInput(): void {
    this.input.value = "";
    this.input.style.height = "auto";
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
