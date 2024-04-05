package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"time"

	"github.com/asqit/github-language-widget/handlers"
)

func run(ctx context.Context) error {
	ctx, cancel := signal.NotifyContext(ctx, os.Interrupt)
	defer cancel()

	server := handlers.NewServer()
	httpServer := &http.Server{
		Addr:    ":8080",
		Handler: server,
	}

	go func() {
		log.Printf("Server started at http://localhost:8080")
		if err := httpServer.ListenAndServe(); err != nil {
			log.Fatalf("could not start server: %v", err)
		}
	}()

	var wg sync.WaitGroup
	wg.Add(1)

	go func() {
		defer wg.Done()
		<-ctx.Done()

		shutdownCtx := context.Background()
		shutdownCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
		defer cancel()

		if err := httpServer.Shutdown(shutdownCtx); err != nil {
			log.Fatalf("could not gracefully shutdown the server: %v", err)
		}
	}()

	wg.Wait()
	return nil
}

func main() {
	ctx := context.Background()
	if err := run(ctx); err != nil {
		log.Fatalf("error: %v", err)
	}
}
