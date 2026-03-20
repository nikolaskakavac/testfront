package cookie

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/pfilip04/chai/database/postgresql/repository"
)

const defaultProfileImagePath = "images/users/DEFAULT.png"

type avatarUpdateRequest struct {
	ImgURL string `json:"img_url"`
}

func (c *CookieAuth) UpdateProfileAvatar(w http.ResponseWriter, r *http.Request) {
	sessionID, err := c.HardAuthorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var payload avatarUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.ImgURL == "" {
		http.Error(w, "Invalid avatar payload", http.StatusBadRequest)
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

	_, err = c.DB.Exec(ctx, `
		UPDATE users
		SET img_url = $1, updated_at = now()
		WHERE id = $2
	`, payload.ImgURL, userID)
	if err != nil {
		http.Error(w, "Failed to update avatar", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"img_url": payload.ImgURL,
	})
}

func (c *CookieAuth) DeleteProfileAvatar(w http.ResponseWriter, r *http.Request) {
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

	_, err = c.DB.Exec(ctx, `
		UPDATE users
		SET img_url = $1, updated_at = now()
		WHERE id = $2
	`, defaultProfileImagePath, userID)
	if err != nil {
		http.Error(w, "Failed to delete avatar", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"img_url": defaultProfileImagePath,
	})
}
