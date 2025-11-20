import { Job } from 'bullmq';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { createWorker } from '../infrastructure/queue';
import { MockDexRouter, SlippageError } from '../domain/MockDexRouter';
import { redisPublisher } from '../infrastructure/redis';

const prisma = new PrismaClient();
const router = new MockDexRouter();

interface OrderJobData {
    orderId: string;
}

const processOrder = async (job: Job<OrderJobData>) => {
    const { orderId } = job.data;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
        throw new Error(`Order ${orderId} not found`);
    }

    if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.FAILED) {
        console.log(`Order ${orderId} already processed`);
        return;
    }

    const log = async (status: OrderStatus, message: string) => {
        const entry = { status, timestamp: new Date().toISOString(), message };
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                execution_logs: {
                    push: entry,
                },
            },
        });

        // Publish event
        await redisPublisher.publish('order-updates', JSON.stringify({ orderId, ...entry }));
    };

    try {
        // 1. Routing
        await log(OrderStatus.ROUTING, 'Finding best route...');
        const quote = await router.getQuote(Number(order.amount));

        // 2. Building
        await log(OrderStatus.BUILDING, `Quote received: ${quote.provider} @ ${quote.price}`);

        // Simulate building tx
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 3. Submitted
        await log(OrderStatus.SUBMITTED, 'Transaction submitted to network');

        // 4. Execute Swap
        const result = await router.executeSwap(quote);

        // 5. Confirmed
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.CONFIRMED,
                tx_hash: result.txHash,
                execution_logs: {
                    push: { status: OrderStatus.CONFIRMED, timestamp: new Date().toISOString(), message: `Swap confirmed. Final Price: ${result.finalPrice}` },
                },
            },
        });
        await redisPublisher.publish('order-updates', JSON.stringify({
            orderId,
            status: OrderStatus.CONFIRMED,
            txHash: result.txHash,
            message: 'Swap confirmed'
        }));

    } catch (error: any) {
        if (error instanceof SlippageError) {
            await log(OrderStatus.FAILED, `Slippage error: ${error.message}`);
            // Do not rethrow, so BullMQ doesn't retry
        } else {
            // Network or other errors
            await log(OrderStatus.FAILED, `Network/System error: ${error.message}. Retrying...`);
            throw error; // Rethrow to trigger BullMQ retry
        }
    }
};

export const startWorker = () => {
    const worker = createWorker(processOrder);

    worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        console.log(`Job ${job?.id} failed: ${err.message}`);
    });

    console.log('Worker started');
};
