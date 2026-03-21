package router

import (
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/pfilip04/chai/config"
)

func (app *App) NewChiRouter(routercfg config.RouterConfig) chi.Router {

	router := chi.NewRouter()

	// A good base middleware stack

	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)

	// Set a timeout value on the request context (ctx), that will signal
	// through ctx.Done() that the request has timed out and further
	// processing should be stopped.

	router.Use(middleware.Timeout(time.Duration(routercfg.Timeout)))

	router.Use(middleware.RequestSize(routercfg.RequestSize))

	// Api URLs

	router.Route("/web", func(r chi.Router) {
		r.Post("/register", app.Cookie.Register)

		r.Post("/login", app.Cookie.Login)
		r.Post("/logout", app.Cookie.Logout)
		r.Get("/session", app.Cookie.Session)
		r.Post("/posts", app.Cookie.CreatePost)
		r.Get("/posts", app.Cookie.ListPosts)
		r.Get("/favorites", app.Cookie.ListFavorites)
		r.Get("/notifications", app.Cookie.ListNotifications)
		r.Get("/posts/{postID}/ratings", app.Cookie.ListPostRatings)
		r.Post("/posts/{postID}/rate", app.Cookie.RatePost)
		r.Post("/posts/{postID}/favorite", app.Cookie.CreateFavorite)
		r.Delete("/posts/{postID}/favorite", app.Cookie.DeleteFavorite)
		r.Delete("/posts/{postID}", app.Cookie.DeletePost)
		r.Get("/users/{userID}/follow", app.Cookie.GetFollowStatus)
		r.Get("/users/{userID}/followers", app.Cookie.ListFollowers)
		r.Get("/users/{userID}/following", app.Cookie.ListFollowing)
		r.Post("/users/{userID}/follow", app.Cookie.CreateFollow)
		r.Delete("/users/{userID}/follow", app.Cookie.DeleteFollow)
		r.Get("/users/by-username/{username}", app.Cookie.GetUserByUsername)
		r.Patch("/profile/avatar", app.Cookie.UpdateProfileAvatar)
		r.Delete("/profile/avatar", app.Cookie.DeleteProfileAvatar)

		r.Delete("/delete", app.Cookie.Delete)

		r.Post("/refresh", app.Cookie.Refresh)

		r.Post("/change-password", app.Cookie.ChangePassword)
		r.Post("/forgot-password", app.Cookie.ForgotPassword)
	})

	router.Route("/mobile", func(r chi.Router) {
		r.Post("/register", app.JWT.Register)

		r.Post("/login", app.JWT.Login)
		r.Post("/logout", app.JWT.Logout)

		r.Delete("/delete", app.JWT.Delete)

		r.Post("/refresh", app.JWT.Refresh)

		r.Post("/change-password", app.JWT.ChangePassword)
		r.Post("/forgot-password", app.JWT.ForgotPassword)
	})

	router.Post("/code/{mfa_type}", app.Code.VerifyCode)

	return router
}
