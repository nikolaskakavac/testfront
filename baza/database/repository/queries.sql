-- name: GetUserProfileByID :one
SELECT
    id,
    username,
    email,
    img_url,
    posts_count,
    followers,
    followings,
    created_at,
    updated_at
FROM users
WHERE id = $1;

-- name: GetUserProfileByUsername :one
SELECT
    id,
    username,
    email,
    img_url,
    posts_count,
    followers,
    followings,
    created_at,
    updated_at
FROM users
WHERE username = $1;

-- name: UpdateUserProfileImage :execrows
UPDATE users
SET img_url = $1
WHERE id = $2;

-- name: IncrementUserPostsCount :execrows
UPDATE users
SET posts_count = posts_count + 1
WHERE id = $1;

-- name: DecrementUserPostsCount :execrows
UPDATE users
SET posts_count = GREATEST(posts_count - 1, 0)
WHERE id = $1;

-- name: CreatePost :one
INSERT INTO posts (
    user_id,
    img_url,
    title,
    description,
    category,
    hashtags
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING id;

-- name: GetPostByID :one
SELECT
    p.id,
    p.user_id,
    p.img_url,
    p.title,
    p.description,
    p.category,
    p.hashtags,
    p.score,
    p.ratings_count,
    p.favorites_count,
    p.created_at,
    p.updated_at,
    u.username,
    u.img_url AS user_img_url
FROM posts p
JOIN users u ON u.id = p.user_id
WHERE p.id = $1;

-- name: ListPosts :many
SELECT
    p.id,
    p.user_id,
    p.img_url,
    p.title,
    p.description,
    p.category,
    p.hashtags,
    p.score,
    p.ratings_count,
    p.favorites_count,
    p.created_at,
    p.updated_at,
    u.username,
    u.img_url AS user_img_url
FROM posts p
JOIN users u ON u.id = p.user_id
ORDER BY p.created_at DESC
LIMIT $1
OFFSET $2;

-- name: ListPostsByUserID :many
SELECT
    id,
    user_id,
    img_url,
    title,
    description,
    category,
    hashtags,
    score,
    ratings_count,
    favorites_count,
    created_at,
    updated_at
FROM posts
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2
OFFSET $3;

-- name: UpdatePost :execrows
UPDATE posts
SET
    img_url = $1,
    title = $2,
    description = $3,
    category = $4,
    hashtags = $5
WHERE id = $6 AND user_id = $7;

-- name: DeletePost :execrows
DELETE FROM posts
WHERE id = $1 AND user_id = $2;

-- name: CreateRating :one
INSERT INTO ratings (
    user_id,
    post_id,
    value
) VALUES (
    $1, $2, $3
)
RETURNING id;

-- name: UpdateRating :execrows
UPDATE ratings
SET value = $1
WHERE user_id = $2 AND post_id = $3;

-- name: DeleteRating :execrows
DELETE FROM ratings
WHERE user_id = $1 AND post_id = $2;

-- name: GetRatingByUserAndPost :one
SELECT
    id,
    user_id,
    post_id,
    value,
    created_at,
    updated_at
FROM ratings
WHERE user_id = $1 AND post_id = $2;

-- name: GetPostRatingsAggregate :one
SELECT
    COALESCE(AVG(value), 0)::numeric(5,2) AS score,
    COUNT(*)::bigint AS ratings_count
FROM ratings
WHERE post_id = $1;

-- name: UpdatePostRatingStats :execrows
UPDATE posts
SET
    score = $1,
    ratings_count = $2
WHERE id = $3;

-- name: CreateFavorite :one
INSERT INTO favorites (
    user_id,
    post_id
) VALUES (
    $1, $2
)
RETURNING id;

-- name: DeleteFavorite :execrows
DELETE FROM favorites
WHERE user_id = $1 AND post_id = $2;

-- name: GetFavoriteByUserAndPost :one
SELECT
    id,
    user_id,
    post_id,
    created_at
FROM favorites
WHERE user_id = $1 AND post_id = $2;

-- name: CountFavoritesByPostID :one
SELECT COUNT(*)::bigint
FROM favorites
WHERE post_id = $1;

-- name: UpdatePostFavoritesCount :execrows
UPDATE posts
SET favorites_count = $1
WHERE id = $2;

-- name: ListFavoritePostsByUserID :many
SELECT
    p.id,
    p.user_id,
    p.img_url,
    p.title,
    p.description,
    p.category,
    p.hashtags,
    p.score,
    p.ratings_count,
    p.favorites_count,
    p.created_at,
    p.updated_at,
    u.username,
    u.img_url AS user_img_url
FROM favorites f
JOIN posts p ON p.id = f.post_id
JOIN users u ON u.id = p.user_id
WHERE f.user_id = $1
ORDER BY f.created_at DESC
LIMIT $2
OFFSET $3;

-- name: CreateReport :one
INSERT INTO reports (
    user_id,
    post_id,
    description
) VALUES (
    $1, $2, $3
)
RETURNING id;

-- name: GetReportByUserAndPost :one
SELECT
    id,
    user_id,
    post_id,
    description,
    created_at
FROM reports
WHERE user_id = $1 AND post_id = $2;

-- name: ListReports :many
SELECT
    id,
    user_id,
    post_id,
    description,
    created_at
FROM reports
ORDER BY created_at DESC
LIMIT $1
OFFSET $2;
