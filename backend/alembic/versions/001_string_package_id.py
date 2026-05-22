"""change package_id columns from UUID to string slugs

Revision ID: 001_string_package_id
Revises:
Create Date: 2026-05-21
"""
from alembic import op

revision = "001_string_package_id"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Wrapped in DO blocks so it's safe to run on a fresh DB
    # (tables may not exist yet — create_all() handles fresh installs)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings'
            ) THEN
                ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_package_id_fkey;
                ALTER TABLE bookings
                    ALTER COLUMN package_id TYPE VARCHAR USING package_id::text;
            END IF;
        END
        $$;
    """)

    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes'
            ) THEN
                ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_package_id_fkey;
                ALTER TABLE quotes
                    ALTER COLUMN package_id TYPE VARCHAR USING package_id::text;
            END IF;
        END
        $$;
    """)


def downgrade() -> None:
    pass
