# PrimeCell API

NestJS backend API for PrimeCell - an AI-powered nutrition and body transformation platform with a deterministic rule engine.

## Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL 15 + Prisma ORM
- **Authentication**: JWT with Passport
- **Background Jobs**: BullMQ + Redis
- **AI Integration**: OpenAI ChatGPT API
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator + Zod (via @primecell/shared-schemas)

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── app.controller.ts       # Health check endpoints
├── app.service.ts          # App-level services
├── prisma/                 # Prisma service and module
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── auth/                   # Authentication module
    ├── auth.module.ts
    ├── auth.controller.ts
    ├── auth.service.ts
    ├── dto/
    ├── guards/
    └── strategies/

prisma/
├── schema.prisma           # Database schema
└── migrations/             # Database migrations

# Modules to be added in Phase 2+:
# - users/                  # User management
# - onboarding/             # 7-step onboarding flow
# - checkin/                # Weekly check-in
# - nutrition/              # Meal plans
# - training/               # Training programs
# - engine/                 # Deterministic rule engine
# - ai/                     # ChatGPT explanation layer
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
```
DATABASE_URL="postgresql://primecell_user:primecell_password@localhost:5432/primecell_dev?schema=public"
JWT_SECRET=your-secret-key-here
OPENAI_API_KEY=your-openai-key-here
```

4. Start PostgreSQL and Redis using Docker:
```bash
cd ../..
docker-compose up -d
```

5. Run Prisma migrations:
```bash
npm run prisma:migrate
```

6. Generate Prisma client:
```bash
npm run prisma:generate
```

7. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## Available Scripts

- `npm run dev` - Start development server with watch mode
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:cov` - Generate test coverage report
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed database with initial data

## API Documentation

Once the server is running, access the Swagger documentation at:
`http://localhost:3000/api/docs`

## Authentication

The API uses JWT-based authentication with Bearer tokens.

### Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh JWT token (requires auth)

### Using authenticated endpoints

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Database

### Schema

The initial schema includes:
- **User**: Basic user authentication data

Additional models will be added in Phase 2:
- OnboardingData
- WeeklyCheckin
- NutritionPlan
- TrainingProgram
- DecisionRecord
- MealTemplate
- And more...

### Migrations

Create a new migration:
```bash
npm run prisma:migrate -- --name migration_name
```

View database in Prisma Studio:
```bash
npm run prisma:studio
```

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:cov
```

Run e2e tests:
```bash
npm run test:e2e
```

## Monorepo Integration

This app is part of a Turborepo monorepo and uses the shared `@primecell/shared-schemas` package for:
- Zod schemas for validation
- Shared type definitions
- Rule pack configuration

## Architecture Principles

### Deterministic Engine
- All nutrition/training decisions made by rule-based engine
- ChatGPT ONLY explains decisions, never makes them
- Append-only decision records for full audit trail
- Reproducible results via versioned rule packs

### Data Flow
1. User completes check-in
2. Engine processes signals using rule pack
3. Engine produces decision record
4. ChatGPT generates explanation
5. User sees explanation + new plan

## Next Steps

- Phase 2: Implement full database schema and core APIs
- Phase 3: Build deterministic rule engine
- Phase 4: Integrate ChatGPT explanation layer
- Phase 6: Add push notifications with BullMQ
- Phase 7: QA and security hardening
