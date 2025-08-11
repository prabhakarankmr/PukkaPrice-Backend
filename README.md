# PukkaPrice Backend

A modern backend API built with NestJS, Fastify, and Prisma ORM for product management with search functionality.

## Features

- 🚀 **NestJS Framework** - Scalable Node.js server-side application
- ⚡ **Fastify** - Fast and low overhead web framework
- 🗄️ **Prisma ORM** - Type-safe database client
- 🔍 **Advanced Search** - Full-text search with filters
- 📝 **Validation** - Request validation with class-validator
- 🛡️ **Security** - Rate limiting and CORS protection
- 📊 **Pagination** - Efficient data pagination
- 🏷️ **Categories** - Product categorization support

## Tech Stack

- **Framework**: NestJS with Fastify
- **Database**: MySQL with Prisma ORM
- **Validation**: class-validator & class-transformer
- **Security**: Helmet, CORS, Rate limiting
- **Language**: TypeScript

## Prerequisites

- Node.js (v18 or higher)
- MySQL database
- npm or yarn

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `.env.example` to `.env` and update the values:
   ```env
   DATABASE_URL="mysql://root:@localhost:3306/affiliate_admin"
   PORT=3001
   NODE_ENV=development
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001
   THROTTLE_TTL=60
   THROTTLE_LIMIT=100
   ```

3. **Set up the database**:
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Push database schema
   npm run prisma:push
   
   # Seed the database with sample data
   npm run prisma:seed
   ```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The server will start on `http://localhost:3001`

## API Endpoints

### Products

- `GET /products` - Get all products with optional filters
  - Query parameters:
    - `search` - Search in name, description, tags
    - `category` - Filter by category
    - `minPrice` & `maxPrice` - Price range filter
    - `sortBy` - Sort field (name, price, createdAt, etc.)
    - `sortOrder` - ASC or DESC
    - `page` - Page number (default: 1)
    - `limit` - Items per page (default: 20, max: 100)

- `GET /products/:id` - Get single product by ID
- `GET /products/categories` - Get all categories with counts
- `GET /products/search/suggestions` - Get search suggestions

### Health Check

- `GET /health` - Application health status

## Example API Calls

```bash
# Get all products
curl "http://localhost:3001/products"

# Search products
curl "http://localhost:3001/products?search=bluetooth&category=Electronics&minPrice=50&maxPrice=200"

# Get product by ID
curl "http://localhost:3001/products/1"

# Get categories
curl "http://localhost:3001/products/categories"

# Get search suggestions
curl "http://localhost:3001/products/search/suggestions?q=bluetooth"

# Health check
curl "http://localhost:3001/health"
```

## Database Schema

The main `Product` model includes:

- `id` - Primary key
- `name` - Product name
- `description` - Product description
- `price` - Product price (decimal)
- `imageUrl` - Product image URL
- `category` - Product category
- `affiliateLink` - Affiliate/purchase link
- `tags` - Search tags
- `status` - Product status (ACTIVE, INACTIVE, DRAFT, ARCHIVED)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Development

```bash
# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run test coverage
npm run test:cov
```

## Database Management

```bash
# View database in Prisma Studio
npm run prisma:studio

# Create and apply migrations
npm run prisma:migrate

# Reset database and reseed
npm run prisma:push && npm run prisma:seed
```

## Project Structure

```
src/
├── health/           # Health check module
├── prisma/           # Prisma service and module
├── products/         # Products module
│   ├── dto/         # Data transfer objects
│   ├── products.controller.ts
│   ├── products.service.ts
│   └── products.module.ts
├── app.module.ts     # Root application module
└── main.ts          # Application entry point
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | Required |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment mode | development |
| `CORS_ORIGINS` | Allowed CORS origins | http://localhost:3000 |
| `THROTTLE_TTL` | Rate limit window (seconds) | 60 |
| `THROTTLE_LIMIT` | Max requests per window | 100 |

## License

MIT
