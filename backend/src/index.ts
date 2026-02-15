import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { checkFfmpeg } from './utils/ffmpeg.js';
import { apiRouter } from './routes/api.js';
import { setupWebSocket } from './websocket/progress.js';

const PORT = process.env.PORT || 3001;

async function main() {
  // Check ffmpeg availability
  const ffmpegAvailable = await checkFfmpeg();
  if (!ffmpegAvailable) {
    console.error('❌ ffmpeg not found! Please install ffmpeg and ensure it is in your PATH.');
    console.error('   Windows: winget install ffmpeg');
    console.error('   macOS: brew install ffmpeg');
    console.error('   Linux: apt install ffmpeg');
    process.exit(1);
  }
  console.log('✓ ffmpeg found');

  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API routes
  app.use('/api', apiRouter);

  // WebSocket setup
  const wss = new WebSocketServer({ server });
  setupWebSocket(wss);

  server.listen(PORT, () => {
    console.log(`🎵 Audio Converter backend running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
