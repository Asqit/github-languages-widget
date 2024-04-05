package handlers

import "net/http"

func router(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/health", HealthCheckHandler())
	mux.HandleFunc("/api/v1/top-languages", GetTopLanguages())
}

func NewServer() http.Handler {
	mux := http.NewServeMux()

	router(mux)

	var handler http.Handler = mux
	// bind middlewares here
	// logger(mux), cors(mux)... etc
	return handler
}
