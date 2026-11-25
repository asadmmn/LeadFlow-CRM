# LeadFlow CRM

A modern, self-hostable CRM for small teams to capture leads, manage a sales pipeline, schedule follow-ups, and understand sales performance.

> **Status:** Initial application foundation committed. Authentication, activity/task workflows, and API-to-UI integration remain on the roadmap.

## Stack
- **Backend:** Laravel 11, PHP 8.2+, Laravel Sanctum
- **Frontend:** React 18, TypeScript, Vite, Bootstrap 5
- **Database:** MySQL 8+ (SQLite is suitable for local tests)
- **Automation:** GitHub Actions

## Current foundation
- Responsive CRM dashboard with pipeline metrics and recent leads.
- Search and status filtering in the lead table.
- Add-lead interaction with client-side state.
- Laravel REST endpoints for lead listing, creation, viewing, updating, and deletion.
- Server-side validation, pagination, soft deletes, and feature tests.
- Architecture notes and CI workflow.

## Repository layout
```
apps/api/   Laravel JSON API
apps/web/   React + TypeScript dashboard
docs/       Architecture and product documentation
.github/    CI workflows
```

## Run the frontend
```bash
cd apps/web
npm install
npm run dev
```

## Run the API
```bash
cd apps/api
composer install
cp .env.example .env
php artisan key:generate
# Configure DB_* in .env, then:
php artisan migrate
php artisan test
php artisan serve
```

The API is available at `http://127.0.0.1:8000/api/v1`.

## Security note
This is an early development foundation. Authentication and authorization are not yet wired into the API; do not expose it to the public internet or use it with real customer data until those controls are implemented.

## License
MIT.
