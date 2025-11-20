# Order Execution Engine

A robust order execution engine built with TypeScript, implementing a worker-queue pattern for processing cryptocurrency swap orders. The system uses BullMQ for job processing, Fastify for the API server, Prisma for database management, and Redis for pub/sub messaging.

## Features

- **Asynchronous Order Processing**: Queue-based order execution using BullMQ
- **Real-time Updates**: WebSocket support for live order status updates
- **Database Persistence**: PostgreSQL with Prisma ORM
- **Mock DEX Router**: Simulates routing and execution across multiple DEX providers
- **Error Handling**: Comprehensive error handling with retry logic for network failures
- **Slippage Protection**: Built-in slippage detection and error handling

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** 18+ (or 20 LTS recommended)
- **npm** (comes with Node.js)
- **Docker Desktop** (or Docker Engine + Docker Compose)
- **Git** (optional, for version control)

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/order_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
```

> **Note**: These values match the default Docker Compose configuration. Adjust if you're using different credentials.

### 3. Start Docker Services

Start Redis and PostgreSQL using Docker Compose:

```bash
docker compose up -d
```

This will start:
- **Redis** on port `6379`
- **PostgreSQL** on port `5432` with:
  - Username: `user`
  - Password: `password`
  - Database: `order_db`

Verify containers are running:

```bash
docker compose ps
```

### 4. Database Migration

Run Prisma migrations to set up the database schema:

```bash
npx prisma migrate deploy
```

Or for development:

```bash
npx prisma migrate dev
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

## Running the Application

### Development Mode

Start the server and worker in development mode with hot reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

### Production Mode

Build and run the compiled JavaScript:

```bash
npm run build
npm start
```

## Testing the System

### Seed Sample Orders

In a separate terminal, run the seed script to create sample orders and watch them process:

```bash
npm run seed
```

This will:
1. Create 5 sample orders in the database
2. Add them to the processing queue
3. Connect via WebSocket to monitor order status updates
4. Display real-time order processing logs

### Run Tests

```bash
npm test
```

## Project Structure

```
eterna/
├── src/
│   ├── api/
│   │   ├── server.ts          # Fastify server setup
│   │   └── websocket.ts       # WebSocket routes
│   ├── domain/
│   │   └── MockDexRouter.ts   # Mock DEX router implementation
│   ├── infrastructure/
│   │   ├── queue.ts           # BullMQ queue configuration
│   │   └── redis.ts           # Redis connection setup
│   ├── workers/
│   │   └── orderWorker.ts     # Order processing worker
│   └── app.ts                 # Application entry point
├── scripts/
│   └── seed-test.ts           # Seed script for testing
├── tests/
│   └── router.test.ts         # Unit tests
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── docker-compose.yml         # Docker services configuration
└── package.json
```

## API Endpoints

### Health Check

```bash
GET /health
```

Returns: `{ "status": "ok" }`

### WebSocket

Connect to monitor order updates:

```
ws://localhost:3000/orders/:orderId
```

The WebSocket will push order status updates in real-time as the order is processed.

## Order Processing Flow

1. **PENDING**: Order created and queued
2. **ROUTING**: Finding best route across DEX providers
3. **BUILDING**: Building transaction with selected route
4. **SUBMITTED**: Transaction submitted to network
5. **CONFIRMED**: Transaction confirmed (success)
6. **FAILED**: Order failed (slippage or network error)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `PORT` | Server port | `3000` |

## Troubleshooting

### Docker Issues

If Docker containers fail to start:

```bash
# Check Docker is running
docker ps

# View container logs
docker compose logs

# Restart containers
docker compose restart
```

### Database Connection Issues

Verify PostgreSQL is accessible:

```bash
# Using psql (if installed)
psql -h localhost -U user -d order_db

# Or check via Docker
docker compose exec postgres psql -U user -d order_db
```

### Redis Connection Issues

Test Redis connection:

```bash
docker compose exec redis redis-cli ping
```

Should return: `PONG`

### Port Already in Use

If port 3000 is already in use, change it in `.env`:

```env
PORT=3001
```

## Development

### TypeScript Compilation

```bash
npm run build
```

### Watch Mode

The `dev` script uses `nodemon` to automatically restart on file changes.

### Database Schema Changes

After modifying `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name your_migration_name
```

## License

ISC

## Author

Order Execution Engine

