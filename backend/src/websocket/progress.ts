import { WebSocketServer, WebSocket } from 'ws';
import { JobProgress, JobResult } from '../services/converter.js';

let wss: WebSocketServer | null = null;

export function setupWebSocket(server: WebSocketServer): void {
  wss = server;

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
}

function broadcast(event: string, data: unknown): void {
  if (!wss) return;

  const message = JSON.stringify({ event, data });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function emitProgress(progress: JobProgress): void {
  broadcast('progress', progress);
}

export function emitFileComplete(file: string, success: boolean, error?: string): void {
  broadcast('file-complete', { file, success, error });
}

export function emitJobComplete(result: JobResult): void {
  broadcast('job-complete', result);
}

export function emitError(message: string, file?: string): void {
  broadcast('error', { message, file });
}
