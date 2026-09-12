import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes.js';
import { initDatabase } from './server/db.js';
import { startSelfHeartbeat } from './server/ping.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Auto initialize Database on boot
  await initDatabase();

  // Start keep-alive self heartbeat loop (keeps Render free tier active 24/7)
  startSelfHeartbeat();

  // Mount API router
  app.use('/api', apiRouter);

  // Vite development middleware or static production fallback
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FoodFlow Core Server is live on http://0.0.0.0:${PORT}`);
    console.log(`📡 Ping endpoint: http://0.0.0.0:${PORT}/api/ping (Use in UptimeRobot)`);
    console.log(`🤖 Telegram Webhook endpoints ready: /api/telegram/rider-bot & /api/telegram/vendor-bot`);
  });
}

startServer().catch(err => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
