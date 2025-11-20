import Fastify, { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { websocketRoutes } from './websocket';

export const buildServer = (): FastifyInstance => {
    const server = Fastify({
        logger: true,
    });

    server.register(websocket);
    server.register(websocketRoutes);

    server.get('/health', async () => {
        return { status: 'ok' };
    });

    return server;
};

