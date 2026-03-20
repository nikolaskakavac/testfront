package cookie

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/pfilip04/chai/database/postgresql/repository"
)

type SessionResponse struct {
	Authenticated bool   `json:"authenticated"`
	Username      string `json:"username,omitempty"`
	Email         string `json:"email,omitempty"`
}

func (c *CookieAuth) Session(w http.ResponseWriter, r *http.Request) {
	userID, err := c.SoftAuthorize(r)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(SessionResponse{
			Authenticated: false,
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancel()

	repo := repository.New(c.DB)
	user, err := repo.GetUsernameEmailPasswordMfaById(ctx, userID)
	if err != nil {
		http.Error(w, "Failed to load session", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(SessionResponse{
		Authenticated: true,
		Username:      user.Username,
		Email:         user.Email,
	})
}
