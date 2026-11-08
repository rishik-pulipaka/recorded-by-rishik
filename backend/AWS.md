# Moving the backend data layer to AWS (RDS + ElastiCache + S3)

The code already supports all three; each is activated purely by
environment variables on the Render service. Nothing redeploys
differently, and every integration degrades gracefully while unset:

| Piece | Env var | Behavior when unset |
| --- | --- | --- |
| RDS (PostgreSQL) | `DATABASE_URL` | App uses whatever Postgres URL is set today (Render Postgres) |
| ElastiCache (Redis) | `REDIS_URL` | Cache falls back to a per-process in-memory TTL store |
| S3 (deliverables) | `S3_BUCKET` | `POST /api/v1/admin/uploads/presign` returns 503 |

## Cutover checklist

1. **RDS**: create a PostgreSQL instance (same major version as the
   current database), allow inbound from Render's egress IPs, then:
   - Dump the current DB and restore it into RDS
     (`pg_dump` / `pg_restore`), or start empty and re-run
     `python -m app.seed`.
   - Point `DATABASE_URL` at the RDS endpoint (keep `sslmode=require`).
   - Run `alembic upgrade head` once against the new database.
2. **ElastiCache**: create a Redis cluster in the same VPC/region,
   set `REDIS_URL` to its `rediss://` endpoint. The pricing and
   availability caches pick it up on the next request; no restart
   needed beyond the env change Render performs automatically.
3. **S3**: create the bucket (block public access ON; uploads/downloads
   are presigned, nothing is public), create an IAM user/policy scoped
   to `s3:PutObject`/`s3:GetObject` on `deliverables/*` only, and set
   `S3_BUCKET` plus `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` /
   `AWS_DEFAULT_REGION` on the Render service.

## Verify after cutover

- `GET /health` returns ok.
- `GET /api/v1/pricing` returns the rule list (and is cached in Redis).
- As admin, `POST /api/v1/admin/uploads/presign` returns a URL instead
  of 503.
- Run the test suite: `pip install -r requirements-dev.txt && pytest`.
