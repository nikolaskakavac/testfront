package cookie

import (
	"net/http"
	"os"
	"strings"
	"time"
)

func isSecureCookieEnv() bool {
	env := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	return env == "prod" || env == "production"
}

func sameSiteMode() http.SameSite {
	if isSecureCookieEnv() {
		return http.SameSiteStrictMode
	}

	return http.SameSiteLaxMode
}

func buildCookie(name string, value string, expires time.Time, httpOnly bool) *http.Cookie {
	return &http.Cookie{
		Name:     name,
		Value:    value,
		Expires:  expires,
		HttpOnly: httpOnly,
		Secure:   isSecureCookieEnv(),
		SameSite: sameSiteMode(),
		Path:     "/",
	}
}
