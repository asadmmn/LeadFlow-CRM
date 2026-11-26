# LeadFlow CRM

LeadFlow is a self-hostable CRM for small teams to capture leads, manage a sales pipeline, and track sales performance.

## Stack
- **API:** Laravel 12, PHP 8.2+, Laravel Sanctum
- **Web:** React 18, TypeScript, Vite, Bootstrap 5
- **Database:** MySQL 8+ (SQLite supported for local testing)
- **CI:** GitHub Actions (frontend production build + backend feature tests)

## Features
- Email/password registration and login with Sanctum personal access tokens.
- Authenticated API routes and logout/token revocation.
- Roles: **admin**, **sales**, and **viewer**. New registrations receive the least-privileged write-capable sales role; viewer is read-only.
- User-scoped leads: each account can only access its own records.
- Create, list, search, filter, update status, and soft-delete leads.
- Server-side validation and pagination.
- Live pipeline metrics and conversion rate from the database.
- Follow-up task API with due dates, priorities, completion state, and lead ownership checks.
- Lead activity timeline API for notes, calls, emails, meetings, and status events.
- A polished, responsive static showcase hosted separately through GitHub Pages (sample data only).
- Responsive React dashboard connected to the Laravel API.
- Rate-limited authentication endpoints.

## Repository layout
apps/api/ — Laravel JSON API  
apps/web/ — React + TypeScript dashboard  
docs/ — Architecture, product documentation, and the static showcase at `docs/demo/`  
.github/ — CI workflows

## Local setup

### 1. API
~~~bash
cd apps/api
composer install
cp .env.example .env
php artisan key:generate
# Configure DB_* if using MySQL. SQLite is preconfigured for local development.
touch database/database.sqlite
php artisan migrate
php artisan serve
~~~
The API runs at **http://127.0.0.1:8000/api/v1**.

### 2. Web app
In another terminal:
~~~bash
cd apps/web
npm install
npm run dev
~~~
Vite proxies /api to the local Laravel server. For a separately hosted API, set VITE_API_URL to its versioned API base URL (for example, https://api.example.com/api/v1) before building, and set FRONTEND_URL in the API environment to the exact web-app origin so the API CORS policy allows that client.

### 3. Create your account
Open the Vite URL, register with your name, email, and a password of at least 10 characters, then add your first lead. Registration creates a sales account. To promote a trusted workspace owner to admin, update their users.role value through a secure database/admin process. Never expose role assignment in public registration.

### 4. Tests
~~~bash
cd apps/api
php artisan test
~~~
CI runs the frontend TypeScript/Vite production build and Laravel feature tests on pushes and pull requests.

## API overview
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | /api/v1/health | Public | Health check |
| POST | /api/v1/auth/register | Public, rate-limited | Create account |
| POST | /api/v1/auth/login | Public, rate-limited | Issue token |
| GET | /api/v1/auth/me | Authenticated | Current user |
| POST | /api/v1/auth/logout | Authenticated | Revoke current token |
| GET | /api/v1/leads | Authenticated | List/search/filter leads |
| POST | /api/v1/leads | Admin/sales | Create lead |
| GET | /api/v1/leads/{id} | Authenticated | View own lead |
| PATCH | /api/v1/leads/{id} | Admin/sales | Update own lead |
| DELETE | /api/v1/leads/{id} | Admin/sales | Soft-delete own lead |
| GET | /api/v1/dashboard/stats | Authenticated | Live dashboard metrics |\n| GET/POST | /api/v1/tasks | Authenticated / admin-sales for writes | List and create follow-up tasks |\n| PATCH/DELETE | /api/v1/tasks/{id} | Admin/sales | Update or delete a task |\n| GET/POST | /api/v1/leads/{id}/activities | Authenticated / admin-sales for writes | Read and add lead timeline events |

Send the login token as Authorization: Bearer <token>. Search and status filters are supported as query parameters. List responses use Laravel pagination.

## Security notes
- Lead records are isolated by authenticated user; IDs cannot be used to access another account's leads.
- Passwords are hashed; authentication endpoints are rate-limited.
- Do not use debug mode in production. Serve over HTTPS, protect database backups, rotate/revoke tokens when needed, and configure a production-grade database.
- This is a growing MVP, not a fully audited enterprise CRM. Team invitations, email verification, password reset, and production API hosting remain future work. The static Pages showcase is a separate sample-data presentation and does not connect to the live API.

## License
MIT.
\n## Static showcase (GitHub Pages)\n\nThe polished, interactive product preview lives in `docs/demo/index.html`. The `Deploy showcase to GitHub Pages` workflow publishes that folder whenever it changes on `main`. After the first merge, open **Settings → Pages** and ensure the build and deployment source is **GitHub Actions** if GitHub has not enabled it automatically. The preview uses fictional sample data and requires no backend.\n