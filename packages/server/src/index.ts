import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import { GameRoom } from './ws/game-room.js';
import { registerHistoryRoute } from './routes/history.js';
import { registerVerifyRoute } from './routes/verify.js';

const PORT = 3001;

async function main() {
  const app = Fastify({ logger: true });

  await app.register(fastifyCors, { origin: true });
  await app.register(fastifyWebsocket);

  const gameRoom = new GameRoom();

  // WebSocket route
  app.get('/ws', { websocket: true }, (socket) => {
    gameRoom.addClient(socket);

    socket.on('message', (raw: Buffer | ArrayBuffer | Buffer[]) => {
      gameRoom.handleMessage(socket, raw.toString());
    });

    socket.on('close', () => {
      gameRoom.removeClient(socket);
    });

    socket.on('error', (err: Error) => {
      app.log.error(err, 'WebSocket error');
      gameRoom.removeClient(socket);
    });
  });

  // REST routes
  registerHistoryRoute(app, gameRoom);
  registerVerifyRoute(app, gameRoom);

  // Start game engine after server is ready
  await app.listen({ port: PORT, host: '0.0.0.0' });
  gameRoom.start();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
