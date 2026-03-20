package cookie

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

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
	User        postFeedUser `json:"user"`
	CreatedAt   time.Time    `json:"createdAt"`
}

type postsResponse struct {
	Posts []postFeedItem `json:"posts"`
}

type createPostRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Tags        []string `json:"tags"`
	Images      []string `json:"images"`
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
			p.created_at,
			u.id,
			u.username,
			COALESCE(u.img_url, '')
		FROM posts p
		JOIN users u ON u.id = p.user_id
		ORDER BY p.created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
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

		err := rows.Scan(
			&post.ID,
			&post.Title,
			&images,
			&post.Description,
			&post.Category,
			&tags,
			&post.Score,
			&post.Votes,
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
