# Architecture

LeadFlow is a single-organization CRM for small teams. The first release focuses on lead capture, qualification, pipeline visibility, and follow-up discipline.

## System shape
- React + TypeScript SPA in `apps/web`.
- Laravel JSON API in `apps/api`.
- MySQL is the primary persistence layer.
- Laravel Sanctum will provide authentication.
- All records must be organization-scoped before production use.

## Core domain
- **Lead:** person or business being evaluated, with source, status, owner, and estimated value.
- **Activity:** call, email, meeting, or note attached to a lead.
- **Task:** dated follow-up with completion state and assignee.
- **Pipeline stage:** ordered stage used to group opportunities.

## API conventions
- Prefix: `/api/v1`
- JSON responses use Laravel API resources.
- Validation failures return HTTP 422.
- Missing resources return HTTP 404.
- Lists are paginated.

## Initial endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/health` | Liveness check |
| GET | `/api/v1/leads` | List leads |
| POST | `/api/v1/leads` | Create lead |
| GET | `/api/v1/leads/{lead}` | View lead |
| PATCH | `/api/v1/leads/{lead}` | Update lead |
| DELETE | `/api/v1/leads/{lead}` | Delete lead |

## Security and quality
Validate writes server-side, use mass-assignment allowlists, keep secrets in environment variables, and enforce authentication/policies before exposing customer data. Cover domain rules and endpoint behavior with automated tests.
