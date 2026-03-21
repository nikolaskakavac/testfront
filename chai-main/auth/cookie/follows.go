package cookie

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/pfilip04/chai/database/postgresql/repository"
)

type followUserItem struct {
	ID        uuid.UUID `json:"id"`
	Username  string    `json:"username"`
	AvatarURL string    `json:"avatarUrl,omitempty"`
}

type followListResponse struct {
	Users []followUserItem `json:"users"`
}

func (c *CookieAuth) CreateFollow(w http.ResponseWriter, r *http.Request) {
	sessionID, err := c.HardAuthorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	targetUserIDParam := chi.URLParam(r, "userID")
	targetUserID, err := uuid.Parse(strings.TrimSpace(targetUserIDParam))
	if err != nil {
		http.Error(w, "Invalid user id", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	repo := repository.New(c.DB)
	currentUserID, err := repo.GetUserIdBySessionId(ctx, sessionID)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if currentUserID == targetUserID {
		http.Error(w, "You cannot follow yourself", http.StatusBadRequest)
		return
	}

	tx, err := c.DB.Begin(ctx)
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	var targetExists bool
	err = tx.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM users WHERE id = $1
		)
	`, targetUserID).Scan(&targetExists)
	if err != nil {
		http.Error(w, "Failed to load user", http.StatusInternalServerError)
		return
	}
	if !targetExists {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	commandTag, err := tx.Exec(ctx, `
		INSERT INTO user_follows (follower_id, following_id)
		VALUES ($1, $2)
		ON CONFLICT (follower_id, following_id) DO NOTHING
	`, currentUserID, targetUserID)
	if err != nil {
		http.Error(w, "Failed to follow user", http.StatusInternalServerError)
		return
	}

	if commandTag.RowsAffected() > 0 {
		_, err = tx.Exec(ctx, `
			UPDATE users
			SET followings = followings + 1, updated_at = now()
			WHERE id = $1
		`, currentUserID)
		if err != nil {
			http.Error(w, "Failed to update following count", http.StatusInternalServerError)
			return
		}

		_, err = tx.Exec(ctx, `
			UPDATE users
			SET followers = followers + 1, updated_at = now()
			WHERE id = $1
		`, targetUserID)
		if err != nil {
			http.Error(w, "Failed to update follower count", http.StatusInternalServerError)
			return
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO notifications (recipient_id, actor_id, type)
			VALUES ($1, $2, 'follow')
			ON CONFLICT (recipient_id, actor_id, type) DO NOTHING
		`, targetUserID, currentUserID)
		if err != nil {
			http.Error(w, "Failed to create follow notification", http.StatusInternalServerError)
			return
		}
	}

	var followersCount int64
	err = tx.QueryRow(ctx, `
		SELECT followers
		FROM users
		WHERE id = $1
	`, targetUserID).Scan(&followersCount)
	if err != nil {
		http.Error(w, "Failed to load follower count", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		http.Error(w, "Failed to follow user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"message":   "User followed successfully",
		"following": true,
		"followers": followersCount,
	})
}

func (c *CookieAuth) DeleteFollow(w http.ResponseWriter, r *http.Request) {
	sessionID, err := c.HardAuthorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	targetUserIDParam := chi.URLParam(r, "userID")
	targetUserID, err := uuid.Parse(strings.TrimSpace(targetUserIDParam))
	if err != nil {
		http.Error(w, "Invalid user id", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	repo := repository.New(c.DB)
	currentUserID, err := repo.GetUserIdBySessionId(ctx, sessionID)
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

	commandTag, err := tx.Exec(ctx, `
		DELETE FROM user_follows
		WHERE follower_id = $1 AND following_id = $2
	`, currentUserID, targetUserID)
	if err != nil {
		http.Error(w, "Failed to unfollow user", http.StatusInternalServerError)
		return
	}

	if commandTag.RowsAffected() > 0 {
		_, err = tx.Exec(ctx, `
			UPDATE users
			SET followings = GREATEST(followings - 1, 0), updated_at = now()
			WHERE id = $1
		`, currentUserID)
		if err != nil {
			http.Error(w, "Failed to update following count", http.StatusInternalServerError)
			return
		}

		_, err = tx.Exec(ctx, `
			UPDATE users
			SET followers = GREATEST(followers - 1, 0), updated_at = now()
			WHERE id = $1
		`, targetUserID)
		if err != nil {
			http.Error(w, "Failed to update follower count", http.StatusInternalServerError)
			return
		}

		_, err = tx.Exec(ctx, `
			DELETE FROM notifications
			WHERE recipient_id = $1 AND actor_id = $2 AND type = 'follow'
		`, targetUserID, currentUserID)
		if err != nil {
			http.Error(w, "Failed to remove follow notification", http.StatusInternalServerError)
			return
		}
	}

	var followersCount int64
	err = tx.QueryRow(ctx, `
		SELECT followers
		FROM users
		WHERE id = $1
	`, targetUserID).Scan(&followersCount)
	if err != nil {
		http.Error(w, "Failed to load follower count", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		http.Error(w, "Failed to unfollow user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"message":   "User unfollowed successfully",
		"following": false,
		"followers": followersCount,
	})
}

func (c *CookieAuth) ListFollowers(w http.ResponseWriter, r *http.Request) {
	targetUserIDParam := chi.URLParam(r, "userID")
	targetUserID, err := uuid.Parse(strings.TrimSpace(targetUserIDParam))
	if err != nil {
		http.Error(w, "Invalid user id", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	rows, err := c.DB.Query(ctx, `
		SELECT
			u.id,
			u.username,
			COALESCE(u.img_url, '')
		FROM user_follows uf
		JOIN users u ON u.id = uf.follower_id
		WHERE uf.following_id = $1
		ORDER BY uf.created_at DESC
		LIMIT 100
	`, targetUserID)
	if err != nil {
		http.Error(w, "Failed to load followers", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	users := make([]followUserItem, 0, 24)
	for rows.Next() {
		var user followUserItem
		var avatar string

		err := rows.Scan(&user.ID, &user.Username, &avatar)
		if err != nil {
			http.Error(w, "Failed to parse followers", http.StatusInternalServerError)
			return
		}

		if avatar != "" && avatar != defaultProfileImagePath {
			user.AvatarURL = avatar
		}

		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to iterate followers", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(followListResponse{Users: users})
}

func (c *CookieAuth) ListFollowing(w http.ResponseWriter, r *http.Request) {
	targetUserIDParam := chi.URLParam(r, "userID")
	targetUserID, err := uuid.Parse(strings.TrimSpace(targetUserIDParam))
	if err != nil {
		http.Error(w, "Invalid user id", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	rows, err := c.DB.Query(ctx, `
		SELECT
			u.id,
			u.username,
			COALESCE(u.img_url, '')
		FROM user_follows uf
		JOIN users u ON u.id = uf.following_id
		WHERE uf.follower_id = $1
		ORDER BY uf.created_at DESC
		LIMIT 100
	`, targetUserID)
	if err != nil {
		http.Error(w, "Failed to load following", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	users := make([]followUserItem, 0, 24)
	for rows.Next() {
		var user followUserItem
		var avatar string

		err := rows.Scan(&user.ID, &user.Username, &avatar)
		if err != nil {
			http.Error(w, "Failed to parse following", http.StatusInternalServerError)
			return
		}

		if avatar != "" && avatar != defaultProfileImagePath {
			user.AvatarURL = avatar
		}

		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to iterate following", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(followListResponse{Users: users})
}

func (c *CookieAuth) GetFollowStatus(w http.ResponseWriter, r *http.Request) {
	currentUserID, err := c.SoftAuthorize(r)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"following": false,
		})
		return
	}

	targetUserIDParam := chi.URLParam(r, "userID")
	targetUserID, err := uuid.Parse(strings.TrimSpace(targetUserIDParam))
	if err != nil {
		http.Error(w, "Invalid user id", http.StatusBadRequest)
		return
	}

	if currentUserID == targetUserID {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"following": false,
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	var following bool
	err = c.DB.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM user_follows
			WHERE follower_id = $1 AND following_id = $2
		)
	`, currentUserID, targetUserID).Scan(&following)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Failed to load follow status", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"following": following,
	})
}
