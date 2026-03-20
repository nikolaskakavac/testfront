package cookie

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/pfilip04/chai/database/postgresql/repository"
	"github.com/pfilip04/chai/global/errs"
)

func (c *CookieAuth) Logout(w http.ResponseWriter, r *http.Request) {

	//
	// Validating the user authorization tokens

	sessionID, err := c.HardAuthorize(r)

	if err != nil {

		http.Error(w, errs.AuthError.Error(), http.StatusUnauthorized)
		return
	}

	//
	// Clearing the session and CSRF tokens in the database

	ctxA, cancelA := context.WithTimeout(r.Context(), c.queryTimeout)
	defer cancelA()

	tx, err := c.DB.Begin(ctxA)

	if err != nil {

		http.Error(w, errs.DatabaseError.Error(), http.StatusInternalServerError)
		return
	}

	defer tx.Rollback(ctxA)

	repo := repository.New(tx)

	rows, err := repo.DeleteRefreshToken(ctxA, sessionID)

	if err != nil {

		http.Error(w, errs.DatabaseError.Error(), http.StatusInternalServerError)
		return
	}

	if rows == 0 {

		http.Error(w, "No refresh token found/expired", http.StatusUnauthorized)
		return
	}

	_, err = repo.DeleteCookieSession(ctxA, sessionID)

	if err != nil {

		http.Error(w, errs.DatabaseError.Error(), http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(ctxA); err != nil {

		http.Error(w, errs.DatabaseError.Error(), http.StatusInternalServerError)
		return
	}

	expiredAt := time.Now().UTC().Add(-time.Hour)

	http.SetCookie(w, buildCookie("session_token", "", expiredAt, true))
	http.SetCookie(w, buildCookie("csrf_token", "", expiredAt, false))
	http.SetCookie(w, buildCookie("refresh_token", "", expiredAt, true))

	fmt.Fprintln(w, "User logout successful")
}
