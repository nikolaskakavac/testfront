package cookie

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/pfilip04/chai/database/postgresql/repository"
)

type notificationActor struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	AvatarURL string `json:"avatarUrl,omitempty"`
}

type notificationItem struct {
	ID        string            `json:"id"`
	Type      string            `json:"type"`
	CreatedAt string            `json:"createdAt"`
	Actor     notificationActor `json:"actor"`
}

type notificationsResponse struct {
	Notifications []notificationItem `json:"notifications"`
}

func (c *CookieAuth) ListNotifications(w http.ResponseWriter, r *http.Request) {
	sessionID, err := c.HardAuthorize(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
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

	rows, err := c.DB.Query(ctx, `
		SELECT
			n.id,
			n.type,
			n.created_at,
			u.id,
			u.username,
			COALESCE(u.img_url, '')
		FROM notifications n
		JOIN users u ON u.id = n.actor_id
		WHERE n.recipient_id = $1
		ORDER BY n.created_at DESC
		LIMIT 100
	`, currentUserID)
	if err != nil {
		http.Error(w, "Failed to load notifications", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	notifications := make([]notificationItem, 0, 24)
	for rows.Next() {
		var item notificationItem
		var actorID string
		var actorAvatar string
		var createdAt time.Time

		if err := rows.Scan(&item.ID, &item.Type, &createdAt, &actorID, &item.Actor.Username, &actorAvatar); err != nil {
			http.Error(w, "Failed to parse notifications", http.StatusInternalServerError)
			return
		}

		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		item.Actor.ID = actorID
		if actorAvatar != "" && actorAvatar != defaultProfileImagePath {
			item.Actor.AvatarURL = actorAvatar
		}

		notifications = append(notifications, item)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to iterate notifications", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(notificationsResponse{
		Notifications: notifications,
	})
}
