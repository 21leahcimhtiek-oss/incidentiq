# Contributing to IncidentIQ

Thank you for considering contributing to IncidentIQ! This document outlines how to contribute.

## Development Setup

See [docs/setup.md](docs/setup.md) for complete setup instructions.

## Development Workflow

### 1. Fork and clone
```bash
git clone https://github.com/YOUR_USERNAME/incidentiq
cd incidentiq
npm install
cp .env.example .env.local
# Fill in .env.local with your credentials
```

### 2. Create a feature branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make your changes

Follow these guidelines:
- **TypeScript strict mode**: No `any` types
- **Zod validation**: All API inputs must be validated
- **Tests**: Add tests for new API routes and utility functions
- **No TODOs**: Finish your implementation before submitting

### 4. Run the full test suite
```bash
npm run lint
npm run typecheck
npm test
npm run build
```

All checks must pass.

### 5. Submit a pull request

- Write a clear PR description explaining what you changed and why
- Reference any related issues
- Ensure CI passes

## Code Style

- **Formatting**: Prettier with default config
- **Linting**: ESLint with Next.js config
- **Imports**: Use `@/` alias for src directory
- **Components**: Named exports only (no default exports for components)
- **API routes**: Follow the existing pattern (auth check -> rate limit -> validation -> business logic -> error capture)

## Adding Database Migrations

1. Create a new file: `supabase/migrations/00N_description.sql`
2. Include both the migration and rollback SQL as comments
3. Update RLS policies if adding new tables
4. Document the schema change in the PR

## Reporting Issues

Use GitHub Issues with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, browser)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.