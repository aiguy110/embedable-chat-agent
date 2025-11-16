import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ConfigLoader } from './config';
import { LLMClient } from './llm/client';
import { MCPManager } from './mcp/manager';
import { ChatService } from './services/chat-service';
import { createChatRouter } from './routes/chat';
import { createWidgetRouter } from './routes/widget';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Load configuration
    console.log('Loading configuration...');
    const configLoader = new ConfigLoader();
    const config = configLoader.getConfig();

    // Initialize LLM client
    console.log('Initializing LLM client...');
    const llmClient = new LLMClient(config.llm);

    // Initialize MCP manager
    console.log('Initializing MCP servers...');
    const mcpManager = new MCPManager(config.mcpServers || []);
    await mcpManager.initialize();

    // Initialize chat service
    const chatService = new ChatService(llmClient, mcpManager, config.systemPrompt);

    // Create Express app
    const app = express();

    // Configure CORS
    const corsOptions = {
      origin: config.cors?.allowedOrigins || '*',
      credentials: true,
    };
    app.use(cors(corsOptions));

    // Body parser
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Mount routers
    app.use('/api', createChatRouter(chatService));
    app.use('/', createWidgetRouter());

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`\n✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Demo page at http://localhost:${PORT}/demo`);
      console.log(`✓ Widget available at http://localhost:${PORT}/widget.js`);
      console.log(`✓ Chat API at http://localhost:${PORT}/api/chat`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\nShutting down gracefully...');
      server.close(() => {
        console.log('HTTP server closed');
      });
      await mcpManager.cleanup();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('\nShutting down gracefully...');
      server.close(() => {
        console.log('HTTP server closed');
      });
      await mcpManager.cleanup();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
