# Embeddable LLM Chat Agent

A lightweight, embeddable chat widget that connects to any OpenAI-compatible LLM API with support for MCP (Model Context Protocol) servers. Perfect for adding AI chat functionality to your web applications.

## Features

- **Easy Embedding**: Simple script tag injection into any web page
- **Streaming Responses**: Real-time response streaming using Server-Sent Events (SSE)
- **OpenAI-Compatible**: Works with OpenAI API or any compatible endpoint
- **MCP Support**: Integrate Model Context Protocol servers for enhanced capabilities
- **Customizable**: Configure system prompts, models, and behavior
- **No Auth Required**: Simple first implementation (add authentication as needed)
- **Nginx-Ready**: Designed to work behind nginx reverse proxy

## Architecture

```
┌─────────────────┐
│   Web Browser   │
│   (Your Site)   │
│                 │
│  <script>       │
│  EmbedChat.init │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ Nginx  │ (Optional reverse proxy)
    └────┬───┘
         │
         ▼
┌────────────────────┐
│  Backend Server    │
│  (Node.js/TS)      │
│                    │
│  • Serves widget   │
│  • Chat API (SSE)  │
│  • MCP Integration │
└─────────┬──────────┘
          │
          ├─────────────► LLM Provider (OpenAI-compatible API)
          │
          └─────────────► MCP Servers (filesystem, GitHub, etc.)
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- An API key for your LLM provider (OpenAI or compatible)

### Installation

1. **Clone and install dependencies:**

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

2. **Configure your agent:**

```bash
# Copy example config
cp config.example.yaml config.yaml

# Edit config.yaml with your settings
```

3. **Set up environment variables:**

```bash
cd backend
cp .env.example .env

# Edit .env and add your API key
# OPENAI_API_KEY=sk-...
```

4. **Build the frontend widget:**

```bash
cd frontend
npm run build
```

5. **Start the backend server:**

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3000` by default.

6. **Test the widget:**

Open your browser and navigate to:
```
http://localhost:3000/demo
```

Click the chat bubble in the bottom-right corner to start chatting!

## Configuration

Edit `config.yaml` to customize your agent:

```yaml
llm:
  provider: openai
  model: gpt-4
  temperature: 0.7
  # For custom providers:
  # baseURL: https://api.your-provider.com/v1

systemPrompt: |
  You are a helpful AI assistant...

mcpServers:
  - name: filesystem
    command: npx
    args:
      - -y
      - @modelcontextprotocol/server-filesystem
      - /allowed/path

cors:
  allowedOrigins:
    - https://your-domain.com
```

### Configuration Options

#### LLM Configuration

- `provider`: `'openai'` or `'custom'`
- `model`: Model identifier (e.g., `'gpt-4'`, `'gpt-3.5-turbo'`)
- `apiKey`: API key (or use `OPENAI_API_KEY` env var)
- `baseURL`: Base URL for custom OpenAI-compatible APIs
- `temperature`: Response randomness (0.0-2.0, default: 0.7)
- `maxTokens`: Maximum response length

#### MCP Servers

Add any MCP server with:
- `name`: Unique identifier
- `command`: Executable command
- `args`: Command arguments (optional)
- `env`: Environment variables (optional)

Popular MCP servers:
- `@modelcontextprotocol/server-filesystem` - File system access
- `@modelcontextprotocol/server-github` - GitHub integration
- `@modelcontextprotocol/server-brave-search` - Web search

## Embedding the Widget

### Basic Usage

Add this to your HTML page:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My App</title>
</head>
<body>
    <!-- Your page content -->

    <!-- Embed the chat widget -->
    <script src="http://localhost:3000/widget.js"></script>
    <script>
        // Initialize the widget
        EmbedChat.init({
            baseURL: 'http://localhost:3000'
        });
    </script>
</body>
</html>
```

### Behind Nginx

If you're using nginx as a reverse proxy:

```nginx
# nginx.conf
location /chat/ {
    proxy_pass http://backend:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;

    # Important for SSE
    proxy_buffering off;
    proxy_read_timeout 24h;
}
```

Then in your HTML:

```html
<script src="/chat/widget.js"></script>
<script>
    EmbedChat.init({
        baseURL: '/chat'  // Relative to your domain
    });
</script>
```

### Widget API

```javascript
// Initialize (required)
EmbedChat.init({ baseURL: 'https://your-domain.com' });

// Programmatically open/close
EmbedChat.open();
EmbedChat.close();
```

## Development

### Backend Development

```bash
cd backend

# Development with auto-reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

### Frontend Development

```bash
cd frontend

# Development with watch mode
npm run dev

# Production build
npm run build
```

## API Reference

### POST /api/chat

Send a message and receive streaming response.

**Request:**
```json
{
  "message": "Hello, how are you?",
  "history": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ]
}
```

**Response:** Server-Sent Events (SSE) stream

```
data: {"type":"content","content":"Hello"}
data: {"type":"content","content":"!"}
data: {"type":"done"}
```

### GET /widget.js

Serves the embeddable widget JavaScript.

### GET /widget.css

Serves the widget CSS styles (if needed separately).

### GET /demo

Serves the demo HTML page for testing the widget.

### GET /

Serves the demo HTML page at the root path.

### GET /health

Health check endpoint.

## Using Custom LLM Providers

This agent works with any OpenAI-compatible API:

```yaml
llm:
  provider: custom
  model: your-model-name
  baseURL: https://api.your-provider.com/v1
  apiKey: your_api_key
```

Compatible providers include:
- OpenAI
- Azure OpenAI
- Anthropic (via compatibility layer)
- Together AI
- Anyscale
- Local models via llama.cpp, Ollama, LM Studio, etc.

## MCP Server Integration

MCP servers extend your agent's capabilities. They run as separate processes and provide tools the LLM can call.

### Example: Adding Filesystem Access

```yaml
mcpServers:
  - name: filesystem
    command: npx
    args:
      - -y
      - @modelcontextprotocol/server-filesystem
      - /path/to/allowed/directory
```

Now your agent can read/write files in the specified directory!

### Example: Adding GitHub Integration

```yaml
mcpServers:
  - name: github
    command: npx
    args:
      - -y
      - @modelcontextprotocol/server-github
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: ghp_your_token
```

Your agent can now interact with GitHub repositories.

## Production Deployment

1. **Build both frontend and backend:**

```bash
cd frontend && npm run build
cd ../backend && npm run build
```

2. **Set environment variables:**

```bash
export PORT=3000
export OPENAI_API_KEY=sk-...
export CONFIG_PATH=/path/to/config.yaml
```

3. **Start the server:**

```bash
cd backend
npm start
```

4. **Consider using:**
   - Process manager (PM2, systemd)
   - Reverse proxy (nginx, Caddy)
   - HTTPS/TLS certificates
   - Rate limiting
   - Authentication middleware

## Security Considerations

⚠️ **Important**: This first version has no authentication!

For production, consider adding:
- API key authentication
- Rate limiting
- CORS restrictions (configure in `config.yaml`)
- Input validation
- MCP server sandboxing
- Content filtering

## Troubleshooting

### Widget not appearing

- Check browser console for errors
- Verify `baseURL` is correct
- Ensure backend server is running
- Check CORS configuration

### Streaming not working

- Verify nginx isn't buffering (set `proxy_buffering off`)
- Check browser SSE support
- Look for network errors in dev tools

### MCP servers not connecting

- Verify command paths are correct
- Check environment variables
- Look at backend logs for connection errors
- Ensure MCP packages are available (`npx` will auto-install)

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
