import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketServer } from 'socket.io';
import { initSocketServer } from './lib/socket';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT ?? '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const io = new SocketServer(httpServer, {
    path: '/api/socket',
    transports: ['websocket', 'polling'],
    pingTimeout: 60_000,
    pingInterval: 25_000,
    cors: {
      origin: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    maxHttpBufferSize: 1e7, // 10MB
  });

  initSocketServer(io);

  httpServer.listen(port, hostname, () => {
    const url = `http://localhost:${port}`;
    console.log(`
  ╔══════════════════════════════════════════════╗
  ║       ISA Link v2.0 — Empowered To Succeed   ║
  ╠══════════════════════════════════════════════╣
  ║  Mode:   ${dev ? 'Development                        ' : 'Production                         '}  ║
  ║  URL:    ${url.padEnd(36)}  ║
  ║  Socket: ${(url + '/api/socket').padEnd(36)}  ║
  ╚══════════════════════════════════════════════╝
    `);
  });
});
