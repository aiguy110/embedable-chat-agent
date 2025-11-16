# Quick Start Guide

Get your embeddable chat agent running in 5 minutes!

## Step 1: Install Dependencies

```bash
# Install all dependencies for both backend and frontend
npm run install:all
```

Or manually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

## Step 2: Configure

```bash
# Create config and env files from examples
npm run setup
```

This copies:
- `config.example.yaml` → `config.yaml`
- `backend/.env.example` → `backend/.env`

## Step 3: Edit Configuration

### Edit `config.yaml`:

```yaml
llm:
  provider: openai
  model: gpt-4  # or gpt-3.5-turbo for lower cost
  temperature: 0.7

systemPrompt: |
  You are a helpful AI assistant.
```

### Edit `backend/.env`:

```bash
PORT=3000
OPENAI_API_KEY=sk-your-actual-api-key-here
```

## Step 4: Build Frontend

```bash
npm run build:frontend
```

This creates `frontend/dist/widget.js` that the backend will serve.

## Step 5: Start Backend Server

```bash
npm run dev:backend
```

You should see:
```
✓ Server running on http://localhost:3000
✓ Demo page at http://localhost:3000/demo
✓ Widget available at http://localhost:3000/widget.js
✓ Chat API at http://localhost:3000/api/chat
```

## Step 6: Test It!

Simply open your browser and navigate to:

```
http://localhost:3000/demo
```

Or visit the root URL:

```
http://localhost:3000/
```

Click the chat bubble in the bottom-right corner and start chatting!

## Common Issues

### "Widget not found"
- Make sure you ran `npm run build:frontend`
- Check that `frontend/dist/widget.js` exists

### "API Key Error"
- Verify your API key in `backend/.env`
- Make sure the key starts with `sk-`
- Check that `.env` file is in the `backend/` directory

### "CORS Error"
- Check the `cors.allowedOrigins` in `config.yaml`
- For development, you can use `'*'` to allow all origins

### "MCP Server Connection Failed"
- Check the command path in `config.yaml`
- Verify any required API keys in the `env` section
- Look at backend console logs for specific errors

## Next Steps

### Add MCP Servers

Edit `config.yaml` to add capabilities:

```yaml
mcpServers:
  # Filesystem access
  - name: filesystem
    command: npx
    args:
      - -y
      - @modelcontextprotocol/server-filesystem
      - /path/to/allowed/directory

  # Web search
  - name: brave-search
    command: npx
    args:
      - -y
      - @modelcontextprotocol/server-brave-search
    env:
      BRAVE_API_KEY: your_api_key
```

### Embed in Your Website

Add to your HTML:

```html
<script src="http://localhost:3000/widget.js"></script>
<script>
  EmbedChat.init({ baseURL: 'http://localhost:3000' });
</script>
```

### Use a Custom LLM Provider

Edit `config.yaml`:

```yaml
llm:
  provider: custom
  model: your-model-name
  baseURL: https://api.your-provider.com/v1
  apiKey: your_api_key
```

Works with:
- Azure OpenAI
- Together AI
- Anyscale
- Local models (Ollama, LM Studio, etc.)
- Any OpenAI-compatible API

## Production Deployment

1. Build everything:
   ```bash
   npm run build
   ```

2. Use a process manager:
   ```bash
   npm install -g pm2
   pm2 start backend/dist/server.js --name chat-agent
   ```

3. Set up nginx reverse proxy (see README.md)

4. Add HTTPS with Let's Encrypt

5. Configure CORS restrictions in `config.yaml`

## Need Help?

- Check the full [README.md](README.md) for detailed documentation
- Review [demo.html](demo.html) for embedding examples
- Check backend logs for error messages
- Open an issue on GitHub

Happy chatting! 🚀
