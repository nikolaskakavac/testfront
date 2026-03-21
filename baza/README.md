### rateR

This schema is intended to be applied after the auth migrations in
`chai-main/database/postgresql/migrations`.

Order:
1. Apply the `chai-main` auth migrations.
2. Apply `baza/database/migrations/000001_init_schema.up.sql`.
3. Apply `baza/database/migrations/000002_user_follows.up.sql`.
4. Apply `baza/database/migrations/000003_notifications.up.sql`.

This migration extends the existing `users` table instead of recreating it.
