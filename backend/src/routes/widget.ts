import { Router, Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

export function createWidgetRouter(): Router {
  const router = Router();

  // Serve the widget JavaScript file
  router.get('/widget.js', (req: Request, res: Response) => {
    const widgetPath = path.join(__dirname, '../../../frontend/dist/widget.js');

    if (fs.existsSync(widgetPath)) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(widgetPath);
    } else {
      res.status(404).send('Widget not found. Please build the frontend first.');
    }
  });

  // Serve the widget CSS file
  router.get('/widget.css', (req: Request, res: Response) => {
    const cssPath = path.join(__dirname, '../../../frontend/dist/widget.css');

    if (fs.existsSync(cssPath)) {
      res.setHeader('Content-Type', 'text/css');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(cssPath);
    } else {
      res.status(404).send('Widget CSS not found. Please build the frontend first.');
    }
  });

  // Serve the demo HTML page
  router.get('/demo', (req: Request, res: Response) => {
    const demoPath = path.join(__dirname, '../../../demo.html');

    if (fs.existsSync(demoPath)) {
      res.setHeader('Content-Type', 'text/html');
      res.sendFile(demoPath);
    } else {
      res.status(404).send('Demo page not found.');
    }
  });

  // Serve demo.html at root path
  router.get('/', (req: Request, res: Response) => {
    const demoPath = path.join(__dirname, '../../../demo.html');

    if (fs.existsSync(demoPath)) {
      res.setHeader('Content-Type', 'text/html');
      res.sendFile(demoPath);
    } else {
      res.status(404).send('<h1>Embeddable Chat Agent</h1><p>Demo page not found. Make sure demo.html exists in the project root.</p>');
    }
  });

  return router;
}
