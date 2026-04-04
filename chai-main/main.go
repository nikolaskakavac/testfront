package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/pfilip04/chai/router"
)

////
//// MAIN
////

func main() {

	//
	// Router initialization

	ctx := context.Background()

	config := "config.json"

	r, dbpool, err := router.NewRouter(ctx, config)

	if err != nil {
		log.Fatalf("Failed: %v", err)
	}

	defer dbpool.Close()

	//
	// Server start

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           r,
		ReadTimeout:       10 * time.Second,
		ReadHeaderTimeout: 5 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
