package cookie

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/pfilip04/chai/database/postgresql/repository"
)

type postFeedUser struct {
	ID        uuid.UUID `json:"id"`
	Username  string    `json:"username"`
	AvatarURL string    `json:"avatarUrl,omitempty"`
}

type postFeedItem struct {
	ID          uuid.UUID    `json:"id"`
	Title       string       `json:"title"`
	ImageURL    string       `json:"imageUrl"`
	Images      []string     `json:"images"`
	Description string       `json:"description"`
	Category    string       `json:"category"`
	Tags        []string     `json:"tags"`
	Score       float64      `json:"score"`
	Votes       int64        `json:"votes"`
	Favorites   int64        `json:"favorites"`
	IsFavorited bool         `json:"isFavorited"`
	UserRating  *int         `json:"userRating,omitempty"`
	User        postFeedUser `json:"user"`
	CreatedAt   time.Time    `json:"createdAt"`
}

type postsResponse struct {
	Posts []postFeedItem `json:"posts"`
}

type postRatingUser struct {
	ID        uuid.UUID `json:"id"`
	Username  string    `json:"username"`
	AvatarURL string    `json:"avatarUrl,omitempty"`
}

type postRatingItem struct {
	ID        uuid.UUID      `json:"id"`
	Value     int            `json:"value"`
	CreatedAt time.Time      `json:"createdAt"`
	User      postRatingUser `json:"user"`
}

type postRatingsResponse struct {
	Ratings []postRatingItem `json:"ratings"`
}

type favoritesResponse struct {
	Posts []postFeedItem `json:"posts"`
}

type createPostRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Tags        []string `json:"tags"`
	Images      []string `json:"images"`
}

type ratePostRequest struct {
	Value int `json:"value"`
}

func parseQueryInt(value string, fallback int, min int, max int) int {
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}

	if parsed < min {
		return min
	}

	if parsed > max {
		return max
	}

	return parsed
}

func (c *CookieAuth) ListPosts(w http.ResponseWriter, r *http.Request) {
	limit := parseQueryInt(r.URL.Query().Get("limit"), 30, 1, 100)
	offset := parseQueryInt(r.URL.Query().Get("offset"), 0, 0, 10000)
	currentUserID := uuid.Nil

	if userID, err := c.SoftAuthorize(r); err == nil {
		currentUserID = userID
	}

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	rows, err := c.DB.Query(ctx, `
		SELECT
			p.id,
			p.title,
			p.img_url,
			p.description,
			p.category,
			p.hashtags,
			COALESCE(p.score, 0)::float8,
			p.ratings_count,
			p.favorites_count,
			CASE WHEN f.id IS NOT NULL THEN true ELSE false END,
			r.value,
			p.created_at,
			u.id,
			u.username,
			COALESCE(u.img_url, '')
		FROM posts p
		JOIN users u ON u.id = p.user_id
		LEFT JOIN favorites f ON f.post_id = p.id AND f.user_id = $3
		LEFT JOIN ratings r ON r.post_id = p.id AND r.user_id = $3
		ORDER BY p.created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset, currentUserID)
	if err != nil {
		http.Error(w, "Failed to load posts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	posts := make([]postFeedItem, 0, limit)

	for rows.Next() {
		var post postFeedItem
		var images []string
		var tags []string
		var userAvatar string
		var userRating *int16

		err := rows.Scan(
			&post.ID,
			&post.Title,
			&images,
			&post.Description,
			&post.Category,
			&tags,
			&post.Score,
			&post.Votes,
			&post.Favorites,
			&post.IsFavorited,
			&userRating,
			&post.CreatedAt,
			&post.User.ID,
			&post.User.Username,
			&userAvatar,
		)
		if err != nil {
			http.Error(w, "Failed to parse posts", http.StatusInternalServerError)
			return
		}

		post.Images = images
		if len(images) > 0 {
			post.ImageURL = images[0]
		}
		post.Tags = tags
		if userAvatar != "" && userAvatar != defaultProfileImagePath {
			post.User.AvatarURL = userAvatar
		}
		if userRating != nil {
			value := int(*userRating)
			post.UserRating = &value
		}

		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to iterate posts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(postsResponse{
		Posts: posts,
	})
}

func (c *CookieAuth) ListFavorites(w http.ResponseWriter, r *http.Request) {
	sessionID, err := c.HardAuthorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	repo := repository.New(c.DB)
	userID, err := repo.GetUserIdBySessionId(ctx, sessionID)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := c.DB.Query(ctx, `
		SELECT
			p.id,
			p.title,
			p.img_url,
			p.description,
			p.category,
			p.hashtags,
			COALESCE(p.score, 0)::float8,
			p.ratings_count,
			p.favorites_count,
			true,
			NULL::smallint,
			p.created_at,
			u.id,
			u.username,
			COALESCE(u.img_url, '')
		FROM favorites fav
		JOIN posts p ON p.id = fav.post_id
		JOIN users u ON u.id = p.user_id
		WHERE fav.user_id = $1
		ORDER BY fav.created_at DESC
	`, userID)
	if err != nil {
		http.Error(w, "Failed to load favorites", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	posts := make([]postFeedItem, 0, 24)

	for rows.Next() {
		var post postFeedItem
		var images []string
		var tags []string
		var userAvatar string
		var userRating *int16

		err := rows.Scan(
			&post.ID,
			&post.Title,
			&images,
			&post.Description,
			&post.Category,
			&tags,
			&post.Score,
			&post.Votes,
			&post.Favorites,
			&post.IsFavorited,
			&userRating,
			&post.CreatedAt,
			&post.User.ID,
			&post.User.Username,
			&userAvatar,
		)
		if err != nil {
			http.Error(w, "Failed to parse favorites", http.StatusInternalServerError)
			return
		}

		post.Images = images
		if len(images) > 0 {
			post.ImageURL = images[0]
		}
		post.Tags = tags
		if userAvatar != "" && userAvatar != defaultProfileImagePath {
			post.User.AvatarURL = userAvatar
		}
		if userRating != nil {
			value := int(*userRating)
			post.UserRating = &value
		}

		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to iterate favorites", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(favoritesResponse{
		Posts: posts,
	})
}

func (c *CookieAuth) ListPostRatings(w http.ResponseWriter, r *http.Request) {
	postIDParam := chi.URLParam(r, "postID")
	postID, err := uuid.Parse(strings.TrimSpace(postIDParam))
	if err != nil {
		http.Error(w, "Invalid post id", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	rows, err := c.DB.Query(ctx, `
		SELECT
			rt.id,
			rt.value,
			rt.created_at,
			u.id,
			u.username,
			COALESCE(u.img_url, '')
		FROM ratings rt
		JOIN users u ON u.id = rt.user_id
		WHERE rt.post_id = $1
		ORDER BY rt.value DESC, rt.created_at DESC
		LIMIT 100
	`, postID)
	if err != nil {
		http.Error(w, "Failed to load ratings", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	ratings := make([]postRatingItem, 0, 24)

	for rows.Next() {
		var rating postRatingItem
		var avatar string

		err := rows.Scan(
			&rating.ID,
			&rating.Value,
			&rating.CreatedAt,
			&rating.User.ID,
			&rating.User.Username,
			&avatar,
		)
		if err != nil {
			http.Error(w, "Failed to parse ratings", http.StatusInternalServerError)
			return
		}

		if avatar != "" && avatar != defaultProfileImagePath {
			rating.User.AvatarURL = avatar
		}

		ratings = append(ratings, rating)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to iterate ratings", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(postRatingsResponse{
		Ratings: ratings,
	})
}

func (c *CookieAuth) CreatePost(w http.ResponseWriter, r *http.Request) {
	sessionID, err := c.HardAuthorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var payload createPostRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid post payload", http.StatusBadRequest)
		return
	}

	payload.Title = strings.TrimSpace(payload.Title)
	payload.Description = strings.TrimSpace(payload.Description)
	payload.Category = strings.TrimSpace(payload.Category)

	filteredImages := make([]string, 0, len(payload.Images))
	for _, image := range payload.Images {
		image = strings.TrimSpace(image)
		if image != "" {
			filteredImages = append(filteredImages, image)
		}
	}

	filteredTags := make([]string, 0, len(payload.Tags))
	for _, tag := range payload.Tags {
		tag = strings.TrimSpace(tag)
		if tag != "" {
			filteredTags = append(filteredTags, tag)
		}
	}

	if payload.Title == "" || len(filteredImages) == 0 {
		http.Error(w, "Title and at least one image are required", http.StatusBadRequest)
		return
	}

	if payload.Category == "" {
		payload.Category = "general"
	}

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	repo := repository.New(c.DB)
	userID, err := repo.GetUserIdBySessionId(ctx, sessionID)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tx, err := c.DB.Begin(ctx)
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	var postID uuid.UUID
	err = tx.QueryRow(ctx, `
		INSERT INTO posts (user_id, img_url, title, description, category, hashtags)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`, userID, filteredImages, payload.Title, payload.Description, payload.Category, filteredTags).Scan(&postID)
	if err != nil {
		http.Error(w, "Failed to create post", http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec(ctx, `
		UPDATE users
		SET posts_count = posts_count + 1, updated_at = now()
		WHERE id = $1
	`, userID)
	if err != nil {
		http.Error(w, "Failed to update user stats", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		http.Error(w, "Failed to save post", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"id":      postID.String(),
		"message": "Post created successfully",
	})
}

func (c *CookieAuth) DeletePost(w http.ResponseWriter, r *http.Request) {
	sessionID, err := c.HardAuthorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	postIDParam := chi.URLParam(r, "postID")
	postID, err := uuid.Parse(strings.TrimSpace(postIDParam))
	if err != nil {
		http.Error(w, "Invalid post id", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	repo := repository.New(c.DB)
	userID, err := repo.GetUserIdBySessionId(ctx, sessionID)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tx, err := c.DB.Begin(ctx)
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	var images []string
	err = tx.QueryRow(ctx, `
		SELECT img_url
		FROM posts
		WHERE id = $1 AND user_id = $2
	`, postID, userID).Scan(&images)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	commandTag, err := tx.Exec(ctx, `
		DELETE FROM posts
		WHERE id = $1 AND user_id = $2
	`, postID, userID)
	if err != nil {
		http.Error(w, "Failed to delete post", http.StatusInternalServerError)
		return
	}

	if commandTag.RowsAffected() == 0 {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	_, err = tx.Exec(ctx, `
		UPDATE users
		SET posts_count = GREATEST(posts_count - 1, 0), updated_at = now()
		WHERE id = $1
	`, userID)
	if err != nil {
		http.Error(w, "Failed to update user stats", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		http.Error(w, "Failed to delete post", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"message": "Post deleted successfully",
		"images":  images,
	})
}

func (c *CookieAuth) RatePost(w http.ResponseWriter, r *http.Request) {
	sessionID, err := c.HardAuthorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	postIDParam := chi.URLParam(r, "postID")
	postID, err := uuid.Parse(strings.TrimSpace(postIDParam))
	if err != nil {
		http.Error(w, "Invalid post id", http.StatusBadRequest)
		return
	}

	var payload ratePostRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid rating payload", http.StatusBadRequest)
		return
	}

	if payload.Value < 0 || payload.Value > 100 {
		http.Error(w, "Rating must be between 0 and 100", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	repo := repository.New(c.DB)
	userID, err := repo.GetUserIdBySessionId(ctx, sessionID)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tx, err := c.DB.Begin(ctx)
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	var existingRatingID uuid.UUID
	err = tx.QueryRow(ctx, `
		SELECT id
		FROM ratings
		WHERE user_id = $1 AND post_id = $2
	`, userID, postID).Scan(&existingRatingID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			_, err = tx.Exec(ctx, `
				INSERT INTO ratings (user_id, post_id, value)
				VALUES ($1, $2, $3)
			`, userID, postID, payload.Value)
			if err != nil {
				http.Error(w, "Failed to create rating", http.StatusInternalServerError)
				return
			}
		} else {
			http.Error(w, "Failed to load rating", http.StatusInternalServerError)
			return
		}
	} else {
		_, err = tx.Exec(ctx, `
			UPDATE ratings
			SET value = $1
			WHERE id = $2
		`, payload.Value, existingRatingID)
		if err != nil {
			http.Error(w, "Failed to update rating", http.StatusInternalServerError)
			return
		}
	}

	var score float64
	var votes int64
	err = tx.QueryRow(ctx, `
		SELECT
			COALESCE(AVG(value), 0)::float8,
			COUNT(*)::bigint
		FROM ratings
		WHERE post_id = $1
	`, postID).Scan(&score, &votes)
	if err != nil {
		http.Error(w, "Failed to aggregate ratings", http.StatusInternalServerError)
		return
	}

	commandTag, err := tx.Exec(ctx, `
		UPDATE posts
		SET score = $1, ratings_count = $2, updated_at = now()
		WHERE id = $3
	`, score, votes, postID)
	if err != nil {
		http.Error(w, "Failed to update post stats", http.StatusInternalServerError)
		return
	}

	if commandTag.RowsAffected() == 0 {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		http.Error(w, "Failed to save rating", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"message":    "Rating saved successfully",
		"score":      score,
		"votes":      votes,
		"userRating": payload.Value,
	})
}

func (c *CookieAuth) CreateFavorite(w http.ResponseWriter, r *http.Request) {
	sessionID, err := c.HardAuthorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	postIDParam := chi.URLParam(r, "postID")
	postID, err := uuid.Parse(strings.TrimSpace(postIDParam))
	if err != nil {
		http.Error(w, "Invalid post id", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	repo := repository.New(c.DB)
	userID, err := repo.GetUserIdBySessionId(ctx, sessionID)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tx, err := c.DB.Begin(ctx)
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO favorites (user_id, post_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, post_id) DO NOTHING
	`, userID, postID)
	if err != nil {
		http.Error(w, "Failed to save favorite", http.StatusInternalServerError)
		return
	}

	var favoritesCount int64
	err = tx.QueryRow(ctx, `
		SELECT COUNT(*)::bigint
		FROM favorites
		WHERE post_id = $1
	`, postID).Scan(&favoritesCount)
	if err != nil {
		http.Error(w, "Failed to count favorites", http.StatusInternalServerError)
		return
	}

	commandTag, err := tx.Exec(ctx, `
		UPDATE posts
		SET favorites_count = $1, updated_at = now()
		WHERE id = $2
	`, favoritesCount, postID)
	if err != nil {
		http.Error(w, "Failed to update post favorites", http.StatusInternalServerError)
		return
	}

	if commandTag.RowsAffected() == 0 {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		http.Error(w, "Failed to save favorite", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"message":   "Favorite saved successfully",
		"favorites": favoritesCount,
		"favorited": true,
	})
}

func (c *CookieAuth) DeleteFavorite(w http.ResponseWriter, r *http.Request) {
	sessionID, err := c.HardAuthorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	postIDParam := chi.URLParam(r, "postID")
	postID, err := uuid.Parse(strings.TrimSpace(postIDParam))
	if err != nil {
		http.Error(w, "Invalid post id", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	repo := repository.New(c.DB)
	userID, err := repo.GetUserIdBySessionId(ctx, sessionID)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tx, err := c.DB.Begin(ctx)
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		DELETE FROM favorites
		WHERE user_id = $1 AND post_id = $2
	`, userID, postID)
	if err != nil {
		http.Error(w, "Failed to remove favorite", http.StatusInternalServerError)
		return
	}

	var favoritesCount int64
	err = tx.QueryRow(ctx, `
		SELECT COUNT(*)::bigint
		FROM favorites
		WHERE post_id = $1
	`, postID).Scan(&favoritesCount)
	if err != nil {
		http.Error(w, "Failed to count favorites", http.StatusInternalServerError)
		return
	}

	commandTag, err := tx.Exec(ctx, `
		UPDATE posts
		SET favorites_count = $1, updated_at = now()
		WHERE id = $2
	`, favoritesCount, postID)
	if err != nil {
		http.Error(w, "Failed to update post favorites", http.StatusInternalServerError)
		return
	}

	if commandTag.RowsAffected() == 0 {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		http.Error(w, "Failed to remove favorite", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"message":   "Favorite removed successfully",
		"favorites": favoritesCount,
		"favorited": false,
	})
}
