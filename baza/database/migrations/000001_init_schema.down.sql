DROP TRIGGER IF EXISTS trg_ratings_updated ON ratings;
DROP TRIGGER IF EXISTS trg_posts_updated ON posts;
DROP TRIGGER IF EXISTS trg_users_updated ON users;

DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS posts;

ALTER TABLE users
DROP COLUMN IF EXISTS followings,
DROP COLUMN IF EXISTS followers,
DROP COLUMN IF EXISTS posts_count,
DROP COLUMN IF EXISTS img_url;
