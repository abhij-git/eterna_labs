import { FastifyInstance } from 'fastify';
import { redisSubscriber } from '../infrastructure/redis';
import { WebSocket } from 'ws';

export const websocketRoutes = async (fastify: FastifyInstance) => {
    fastify.get('/orders/:orderId', { websocket: true }, (socket: WebSocket, req: any) => {
        const { orderId } = req.params;
        console.log(`Client connected for order ${orderId}`);

        const handler = (channel: string, message: string) => {
            if (channel === 'order-updates') {
                const data = JSON.parse(message);
                if (data.orderId === orderId) {
                    socket.send(JSON.stringify(data));
                }
            }
        };

        redisSubscriber.subscribe('order-updates');
        redisSubscriber.on('message', handler);

        socket.on('close', () => {
            console.log(`Client disconnected for order ${orderId}`);
            redisSubscriber.removeListener('message', handler);
        });
    });
};
