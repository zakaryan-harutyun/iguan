# IguAN Team Task Manager

## Summary
Collaborative task manager with teams, projects, tasks, comments, and role-based permissions. Backend: Laravel + Sanctum (API). Frontend: React (Vite). Auth via Breeze API. Dockerized with MySQL.

## Quick Start (Docker)
1) Start services
```bash
docker compose up -d --build
```
Services:
- API (Laravel): `http://localhost:8080`
- Frontend (Vite): `http://localhost:3000`

2) Initialize database (first run or when resetting)
```bash
docker compose exec backend php artisan migrate:fresh --seed
```

3) Login with seeded credentials (below) or register a new user.

Troubleshooting:
- If API can’t connect to DB, wait a few seconds and rerun the migrate command.
- Clear caches if config changes: `docker compose exec backend php artisan optimize:clear`

## Seeded Data
- Team: `Acme Team`
- Users:
  - Admin: `admin@example.com` / `password` (role: admin)
  - Member: `member@example.com` / `password` (role: member)
- Projects: `Project Alpha`, `Project Beta`
- Tasks: Two tasks per project, assigned to admin/member

## UI Guide
- Frontend at `http://localhost:3000`
- Login with seeded creds or register. Registration supports create/join team.
- Basic lists for projects and tasks; minimal create actions.

