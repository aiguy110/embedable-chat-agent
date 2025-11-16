import { Router, Request, Response } from 'express';
import { ChatService } from '../services/chat-service';
import { ChatMessage } from '../llm/client';

export function createChatRouter(chatService: ChatService): Router {
  const router = Router();

  router.post('/chat', async (req: Request, res: Response) => {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required and must be a string' });
      return;
    }

    // Validate history if provided
    const conversationHistory: ChatMessage[] = Array.isArray(history) ? history : [];

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Stream the response
      for await (const chunk of chatService.processMessage(message, conversationHistory)) {
        if (typeof chunk === 'string') {
          // Regular content chunk
          res.write(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`);
        } else if (chunk.type === 'tool') {
          // Tool execution info
          res.write(`data: ${JSON.stringify({ type: 'tool', ...chunk.data })}\n\n`);
        }
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Error processing chat message:', error);

      // Send error event
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: (error as Error).message,
        })}\n\n`
      );
      res.end();
    }
  });

  return router;
}
