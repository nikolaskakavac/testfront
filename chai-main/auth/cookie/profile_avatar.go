package cookie

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

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

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	repo := repository.New(c.DB)
	userID, err := repo.GetUserIdBySessionId(ctx, sessionID)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var currentImgURL string
	_ = c.DB.QueryRow(ctx, `
		SELECT COALESCE(img_url, '')
		FROM users
		WHERE id = $1
	`, userID).Scan(&currentImgURL)

	var payload avatarUpdateRequest
	if strings.HasPrefix(strings.ToLower(r.Header.Get("Content-Type")), "multipart/form-data") {
		if err := ensureMediaDirs(); err != nil {
			http.Error(w, "Failed to prepare avatar storage", http.StatusInternalServerError)
			return
		}

		if err := r.ParseMultipartForm(6 << 20); err != nil {
			http.Error(w, "Invalid avatar upload", http.StatusBadRequest)
			return
		}

		file, header, err := r.FormFile("avatar")
		if err != nil {
			http.Error(w, "Avatar file is required", http.StatusBadRequest)
			return
		}
		_ = file.Close()

		fileName, err := saveUploadedFile(header, userMediaDir, userID.String())
		if err != nil {
			http.Error(w, "Failed to save avatar", http.StatusInternalServerError)
			return
		}

		payload.ImgURL = "images/users/" + fileName
	} else {
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.ImgURL == "" {
			http.Error(w, "Invalid avatar payload", http.StatusBadRequest)
			return
		}
	}

	_, err = c.DB.Exec(ctx, `
		UPDATE users
		SET img_url = $1, updated_at = now()
		WHERE id = $2
	`, payload.ImgURL, userID)
	if err != nil {
		if strings.HasPrefix(payload.ImgURL, "images/users/") {
			removeMediaFile(userMediaDir, payload.ImgURL)
		}
		http.Error(w, "Failed to update avatar", http.StatusInternalServerError)
		return
	}

	if currentImgURL != "" && currentImgURL != defaultProfileImagePath && currentImgURL != payload.ImgURL {
		removeMediaFile(userMediaDir, currentImgURL)
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

	var currentImgURL string
	_ = c.DB.QueryRow(ctx, `
		SELECT COALESCE(img_url, '')
		FROM users
		WHERE id = $1
	`, userID).Scan(&currentImgURL)

	_, err = c.DB.Exec(ctx, `
		UPDATE users
		SET img_url = $1, updated_at = now()
		WHERE id = $2
	`, defaultProfileImagePath, userID)
	if err != nil {
		http.Error(w, "Failed to delete avatar", http.StatusInternalServerError)
		return
	}

	if currentImgURL != "" && currentImgURL != defaultProfileImagePath {
		removeMediaFile(userMediaDir, currentImgURL)
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"img_url": defaultProfileImagePath,
	})
}
