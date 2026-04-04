package cookie

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/pfilip04/chai/database/postgresql/repository"
	"github.com/pfilip04/chai/utils"
)

type profileUpdateRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
}

func (c *CookieAuth) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	sessionID, err := c.HardAuthorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var payload profileUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid profile payload", http.StatusBadRequest)
		return
	}

	username := strings.TrimSpace(strings.ToLower(payload.Username))
	email := strings.TrimSpace(strings.ToLower(payload.Email))

	if !utils.IsValidUsername(username) {
		http.Error(w, "Invalid username", http.StatusNotAcceptable)
		return
	}

	if !utils.IsValidEmail(email) {
		http.Error(w, "Invalid email", http.StatusNotAcceptable)
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

	var currentUsername string
	var currentEmail string
	err = c.DB.QueryRow(ctx, `
		SELECT username, email
		FROM users
		WHERE id = $1
	`, userID).Scan(&currentUsername, &currentEmail)
	if err != nil {
		http.Error(w, "Failed to load user", http.StatusInternalServerError)
		return
	}

	if username != currentUsername {
		var usernameTaken bool
		err = c.DB.QueryRow(ctx, `
			SELECT EXISTS (
				SELECT 1
				FROM users
				WHERE username = $1 AND id <> $2
			)
		`, username, userID).Scan(&usernameTaken)
		if err != nil {
			http.Error(w, "Failed to validate username", http.StatusInternalServerError)
			return
		}
		if usernameTaken {
			http.Error(w, "Username already exists", http.StatusConflict)
			return
		}
	}

	if email != currentEmail {
		var emailTaken bool
		err = c.DB.QueryRow(ctx, `
			SELECT EXISTS (
				SELECT 1
				FROM users
				WHERE email = $1 AND id <> $2
			)
		`, email, userID).Scan(&emailTaken)
		if err != nil {
			http.Error(w, "Failed to validate email", http.StatusInternalServerError)
			return
		}
		if emailTaken {
			http.Error(w, "Email already exists", http.StatusConflict)
			return
		}
	}

	_, err = c.DB.Exec(ctx, `
		UPDATE users
		SET username = $1, email = $2, updated_at = now()
		WHERE id = $3
	`, username, email, userID)
	if err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"username": username,
		"email":    email,
	})
}
