# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an embeddable LLM chat widget system with a Node.js/TypeScript backend and vanilla TypeScript frontend. The widget can be injected into any webpage via a script tag and provides streaming chat responses with MCP (Model Context Protocol) tool support.

## Build & Development Commands

From project root:
- `npm run install:all` - Install dependencies for both backend and frontend
- `npm run setup` - Copy example config files (config.yaml and .env)
- `npm run build` - Build both frontend and backend
- `npm run dev:backend` - Start backend dev server (auto-reload with ts-node)
- `npm run dev:frontend` - Start frontend watch mode (webpack)

From `backend/`:
- `npm run dev` - Development server with auto-reload
- `npm run build` - Compile TypeScript to dist/
- `npm start` - Run production build from dist/

From `frontend/`:
- `npm run build` - Bundle widget with webpack (outputs to dist/widget.js)
- `npm run dev` - Watch mode for development

The backend must be restarted after backend/.env or config.yaml changes, but not for code changes (ts-node handles that).

## Architecture

### Request Flow

1. Browser loads widget.js from backend
2. Widget initializes with baseURL, creates floating chat button
3. User sends message → frontend sends POST to /api/chat
4. Backend streams response via SSE (Server-Sent Events)
5. If LLM requests tool use, backend executes MCP tool and yields special event
6. Frontend receives stream and updates UI in real-time

### Backend Architecture

**Entry point:** `backend/src/server.ts`
- Initializes Express app
- Loads config from `config.yaml` (via ConfigLoader)
- Creates singleton instances: LLMClient, MCPManager, ChatService
- Mounts routers: /api/chat (streaming), / and /demo (serves demo.html), /widget.js

**Key components:**
- `config.ts` - Loads/validates YAML config, provides typed access
- `llm/client.ts` - OpenAI-compatible API client with streaming
- `mcp/manager.ts` - Manages MCP server lifecycle via stdio transport
- `services/chat-service.ts` - **Core orchestration layer**
- `routes/chat.ts` - SSE streaming endpoint
- `routes/widget.ts` - Static file serving (widget.js, demo.html)

**ChatService message flow:**
1. Accepts user message + conversation history
2. Yields async generator with strings (content) or `{type: 'tool', data: {...}}` objects
3. Loops: streams LLM response → detects tool calls → executes via MCPManager → sends tool results back to LLM → streams continued response
4. Router converts generator items to SSE events

**SSE Event Types:**
- `{type: 'content', content: string}` - Text chunk
- `{type: 'tool', name, arguments, result/error, status}` - Tool execution info
- `{type: 'done'}` - Stream complete
- `{type: 'error', error: string}` - Error occurred

### Frontend Architecture

**Entry point:** `frontend/src/widget.ts`
- Exports singleton `EmbedChatWidget` as global `window.EmbedChat`
- Bundled via webpack to single dist/widget.js

**Key components:**
- `widget.ts` - Main controller, manages conversation history and state
- `ui.ts` - DOM manipulation and styling (all CSS injected via JS)
- `api-client.ts` - SSE client for /api/chat endpoint

**Message Rendering:**
- Uses `marked` library for markdown parsing
- Uses `DOMPurify` to sanitize HTML output
- Assistant messages support full GFM (GitHub Flavored Markdown)
- User messages rendered as plain text

**Tool Call UI:**
- Tool executions appear as expandable dark grey containers between message bubbles
- Header shows: 🔧 icon, tool name, success/error badge
- Click to expand: shows arguments (JSON) and result (JSON) in code blocks
- Important: `flex-shrink: 0` and `min-height` prevent collapsing in flexbox

**Critical UI detail:** When tool is executed, widget resets `assistantMessageEl = null` and `currentSegmentContent = ''`. This creates a NEW message bubble after the tool container, preventing the tool from appearing "inside" a message bubble.

### Configuration

**config.yaml structure:**
```yaml
llm:
  provider: 'openai' | 'custom'
  model: string
  apiKey: string (optional, uses OPENAI_API_KEY env var)
  baseURL: string (for custom providers)
  temperature: number
  maxTokens: number

systemPrompt: string

mcpServers:
  - name: string (unique ID, prefixed to tool names as "name__toolName")
    command: string (e.g., "npx")
    args: string[] (e.g., ["-y", "@modelcontextprotocol/server-filesystem", "/path"])
    env: Record<string, string>

cors:
  allowedOrigins: string[] (default: '*')
```

**MCP Integration:**
- Each MCP server runs as separate process via StdioClientTransport
- Tools are prefixed with server name to avoid conflicts: `filesystem__read_file`
- Tool results are JSON stringified and sent back to LLM as tool messages
- MCPManager converts MCP tool schemas to OpenAI function calling format

### Message Type Handling

**Backend message formatting (`llm/client.ts`):**
- OpenAI API requires strict message type separation
- Must check `msg.role` and build properly typed objects:
  - `role: 'system'` → `{ role: 'system', content }`
  - `role: 'user'` → `{ role: 'user', content }`
  - `role: 'assistant'` with tool_calls → `{ role: 'assistant', content, tool_calls }`
  - `role: 'tool'` → `{ role: 'tool', content, tool_call_id }`
- Cannot use spread operators with optional fields - causes TS errors
- Tool call messages MUST include `tool_calls` array in assistant message or API returns 400 error

### TypeScript Considerations

- Backend uses `commonjs` module system, frontend uses `ES2020`
- `process.env` values can be undefined - must filter before passing to MCP (see `mcp/manager.ts`)
- Marked library v11+ changed API - use `renderer.link = (token) => ...` not `(href, title, text) => ...`
- When streaming tool results, need to declare `let args: any = {}` outside try block to be accessible in catch for error reporting

## Common Modifications

### Adding new SSE event types:
1. Update `ChatService.processMessage()` return type
2. Yield new event type from service
3. Handle in `routes/chat.ts`
4. Add to `StreamCallbacks` interface in `frontend/src/api-client.ts`
5. Update SSE parsing in `api-client.ts`
6. Handle in `widget.ts` callback

### Adding new routes:
1. Create router function in `backend/src/routes/`
2. Import and mount in `server.ts` with `app.use()`

### Changing widget styling:
- All styles are in `frontend/src/ui.ts` in the `setupStyles()` method
- Styles are injected dynamically as `<style>` tag
- Use `embed-chat-*` class prefix for all widget elements to avoid conflicts

### MCP tool debugging:
- Check backend console for "Connected to MCP server: X (N tools)" message
- MCP server stderr goes to backend stdout
- Tool execution errors are caught and sent as tool messages with error content
- Use `mcpManager.hasTools()` to check if any tools loaded

## Testing

To test widget on any webpage:
```javascript
(function() {
    const script = document.createElement('script');
    script.src = 'http://localhost:3000/widget.js';
    script.onload = function() {
        EmbedChat.init({ baseURL: 'http://localhost:3000' });
        console.log('Chat widget loaded! Click the bubble in the bottom-right.');
    };
    script.onerror = function() {
        console.error('Failed to load chat widget. Is the server running?');
    };
    document.head.appendChild(script);
})();
```

Paste this into browser DevTools console on any page.

## Important Gotchas

1. **Frontend must be built before backend can serve it** - Run `npm run build:frontend` first
2. **SSE requires `proxy_buffering off` in nginx** - Otherwise responses won't stream
3. **Tool calls create visual gaps** - This is intentional, tool containers appear between message bubbles
4. **Config changes require server restart** - Even in dev mode with ts-node
5. **Widget initialization is async** - Script must load before calling EmbedChat.init()
6. **Markdown in tool results** - Arguments and results are formatted as code blocks automatically
7. **Process.env type issues** - MCP SDK expects `Record<string, string>` but process.env has `string | undefined`
