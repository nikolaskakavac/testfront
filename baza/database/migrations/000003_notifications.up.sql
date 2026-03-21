CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ NULL,

    CONSTRAINT notifications_type_check CHECK (type IN ('follow')),
    CONSTRAINT notifications_actor_recipient_check CHECK (recipient_id <> actor_id),
    CONSTRAINT notifications_unique_follow UNIQUE (recipient_id, actor_id, type)
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
    ON notifications(recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_actor
    ON notifications(actor_id);
