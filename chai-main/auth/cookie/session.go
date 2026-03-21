package cookie

import (
	"context"
	"encoding/json"
	"net/http"
)

type SessionResponse struct {
	Authenticated bool   `json:"authenticated"`
	ID            string `json:"id,omitempty"`
	Username      string `json:"username,omitempty"`
	Email         string `json:"email,omitempty"`
	ImgURL        string `json:"img_url,omitempty"`
	Followers     int64  `json:"followers,omitempty"`
	Followings    int64  `json:"followings,omitempty"`
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

	var username string
	var email string
	var imgURL string
	var followers int64
	var followings int64

	err = c.DB.QueryRow(ctx, `
		SELECT username, email, COALESCE(img_url, ''), followers, followings
		FROM users
		WHERE id = $1
	`, userID).Scan(&username, &email, &imgURL, &followers, &followings)
	if err != nil {
		http.Error(w, "Failed to load session", http.StatusInternalServerError)
		return
	}

	if imgURL == defaultProfileImagePath {
		imgURL = ""
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(SessionResponse{
		Authenticated: true,
		ID:            userID.String(),
		Username:      username,
		Email:         email,
		ImgURL:        imgURL,
		Followers:     followers,
		Followings:    followings,
	})
}
