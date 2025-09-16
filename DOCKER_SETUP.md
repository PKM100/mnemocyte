# 🐳 Docker Setup Guide

This guide explains how to run the Mnemocyte Smart NPCs application using Docker with PostgreSQL database.

## 🚀 Quick Start

### 1. Clone and Setup Environment

```bash
git clone https://github.com/prasmurali_microsoft/mnemocyte_hack_25.git
cd mnemocyte_hack_25
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your Azure OpenAI credentials:

```bash
# Required: Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_actual_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name

# Database (automatically configured for Docker)
DATABASE_URL="postgresql://mnemocyte_user:mnemocyte_dev_password@localhost:5433/mnemocyte_dev"
```

### 3. Start Development Environment

```bash
# Start PostgreSQL database
npm run docker:dev

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database with sample characters
npm run db:seed

# Start Next.js development server
npm run dev
```

### 4. Access the Application

- **Web App**: http://localhost:3000
- **Database Admin**: http://localhost:5555 (run `npm run db:studio`)
- **PostgreSQL**: localhost:5433

## 🏭 Production Deployment

### Build and run production containers:

```bash
# Build and start all services
npm run docker:prod
```

This starts:
- **App**: http://localhost:3000
- **PostgreSQL**: Internal Docker network
- **Redis**: Internal Docker network

### Environment for Production:

```bash
# Production Database URL
DATABASE_URL="postgresql://mnemocyte_user:mnemocyte_password@postgres:5432/mnemocyte"

# Your Azure OpenAI credentials
AZURE_OPENAI_API_KEY=your_production_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
```

## 📊 Database Management

### Available Commands:

```bash
# Database operations
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run migrations in development
npm run db:deploy       # Deploy migrations in production
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed database with sample data

# Docker operations  
npm run docker:dev      # Start dev database only
npm run docker:prod     # Start full production stack
npm run docker:down     # Stop all containers
```

### Manual Database Access:

```bash
# Development database
docker exec -it mnemocyte-postgres-dev psql -U mnemocyte_user -d mnemocyte_dev

# Production database
docker exec -it mnemocyte-postgres psql -U mnemocyte_user -d mnemocyte
```

## 🗃️ Database Schema

The application uses PostgreSQL with the following main tables:

- **characters**: NPC definitions with FOXP2 neural patterns
- **conversations**: Grouped chat sessions
- **messages**: Individual chat messages with order
- **sessions**: User session tracking
- **conversation_participants**: Many-to-many character/conversation links

## 🔧 Troubleshooting

### Database Connection Issues:

```bash
# Check if database is running
docker ps | grep postgres

# Check database logs
docker logs mnemocyte-postgres-dev

# Reset database
docker-compose -f docker-compose.dev.yml down -v
npm run docker:dev
```

### Migration Issues:

```bash
# Reset Prisma migrations
rm -rf prisma/migrations
npx prisma migrate dev --name init

# Force recreate database
npx prisma migrate reset
npm run db:seed
```

### Character Data Migration:

The application automatically migrates existing `characters.json` and `sessions.json` files to the database on first run.

## 🚢 Deployment Options

### Option 1: Docker Compose (Recommended)
- Complete stack with database
- Easy local development
- Production-ready

### Option 2: Container Registry
```bash
# Build image
docker build -t mnemocyte-app .

# Run with separate database
docker run -p 3000:3000 -e DATABASE_URL="your_db_url" mnemocyte-app
```

### Option 3: Cloud Platforms
- Vercel/Netlify for app
- Supabase/Railway for PostgreSQL
- Update `DATABASE_URL` accordingly

## 📁 Project Structure

```
├── docker-compose.yml          # Production containers
├── docker-compose.dev.yml      # Development database
├── Dockerfile                  # Next.js app container
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── init.sql               # Database initialization
├── src/
│   ├── lib/
│   │   ├── db.ts              # Prisma client
│   │   └── migrate.ts         # Data migration utilities
│   └── app/api/               # Database-enabled API routes
└── package.json               # Docker scripts included
```

## 🎮 Features Ready

✅ **Multi-Character Conversations** with database persistence  
✅ **Character Library** with PostgreSQL storage  
✅ **Session Management** with proper tracking  
✅ **Message History** with conversation ordering  
✅ **Docker Deployment** with production setup  
✅ **Database Migrations** with Prisma ORM  

The application is now fully dockerized with persistent PostgreSQL storage!
