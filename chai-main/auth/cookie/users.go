package cookie

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type userProfileResponse struct {
	ID         string `json:"id"`
	Username   string `json:"username"`
	Email      string `json:"email,omitempty"`
	ImgURL     string `json:"img_url,omitempty"`
	Posts      int64  `json:"posts"`
	Followers  int64  `json:"followers"`
	Followings int64  `json:"followings"`
	IsSelf     bool   `json:"isSelf"`
	Following  bool   `json:"following"`
}

func (c *CookieAuth) GetUserByUsername(w http.ResponseWriter, r *http.Request) {
	username := strings.TrimSpace(chi.URLParam(r, "username"))
	if username == "" {
		http.Error(w, "Invalid username", http.StatusBadRequest)
		return
	}

	currentUserID, _ := c.SoftAuthorize(r)

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	var profile userProfileResponse
	var targetUserID uuid.UUID
	err := c.DB.QueryRow(ctx, `
		SELECT
			id,
			username,
			COALESCE(img_url, ''),
			posts_count,
			followers,
			followings
		FROM users
		WHERE username = $1
	`, username).Scan(
		&targetUserID,
		&profile.Username,
		&profile.ImgURL,
		&profile.Posts,
		&profile.Followers,
		&profile.Followings,
	)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	profile.ID = targetUserID.String()
	profile.IsSelf = currentUserID == targetUserID

	if profile.ImgURL == defaultProfileImagePath {
		profile.ImgURL = ""
	}

	if currentUserID != uuid.Nil && !profile.IsSelf {
		_ = c.DB.QueryRow(ctx, `
			SELECT EXISTS (
				SELECT 1
				FROM user_follows
				WHERE follower_id = $1 AND following_id = $2
			)
		`, currentUserID, targetUserID).Scan(&profile.Following)
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(profile)
}
