# LeadFlow CRM

A modern, self-hostable CRM for small teams to capture leads, manage a sales pipeline, schedule follow-ups, and understand sales performance.

> **Project status:** Foundation in progress. The repository is being built as a production-minded portfolio project, not a screenshot-only demo.

## Product goals

- Centralize contacts, companies, and lead activity.
- Move opportunities through a configurable sales pipeline.
- Record calls, notes, meetings, and follow-up tasks.
- Provide a clear dashboard for pipeline health and team activity.
- Expose a documented REST API with validation, authorization, and automated tests.

## Planned stack

- **Backend:** Laravel, PHP 8.3+, Laravel Sanctum
- **Frontend:** React, TypeScript, Vite, Bootstrap
- **Database:** MySQL 8+
- **Quality:** PHPUnit/Pest, ESLint, TypeScript checks, GitHub Actions

## Planned modules

1. Authentication and user profiles
2. Leads, contacts, and companies
3. Pipeline stages and opportunity tracking
4. Activities, notes, and follow-up tasks
5. Dashboard metrics and reporting
6. API documentation and deployment guide

## Repository layout

```
apps/
  api/       Laravel application
  web/       React + TypeScript application
docs/        Architecture and product documentation
.github/     CI workflows and contribution templates
```

## Development

The application setup instructions will be added alongside the backend and frontend scaffolds. See [docs/architecture.md](docs/architecture.md) for the initial design.

## Security

Never commit credentials, API keys, production data, or real customer information. Use environment variables and the provided example environment files.

## License

MIT. See [LICENSE](LICENSE).
