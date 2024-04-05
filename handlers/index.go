package handlers

import (
	"net/http"

	"github.com/asqit/github-language-widget/middlewares"
)

func router(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/health", HealthCheckHandler())
	mux.HandleFunc("/api/v1/top-languages", GetTopLanguages())
}

func NewServer() http.Handler {
	mux := http.NewServeMux()

	router(mux)

	var handler http.Handler = mux
	handler = middlewares.Logger(handler)
	return handler
}
