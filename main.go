package main

import (
	"net/http"

	"github.com/asqit/github-language-widget/handlers"
)


var server = handlers.NewServer();

var httpServer = &http.Server {
	Addr: ":8080",
	Handler: server,
}

func main() {
	if err := httpServer.ListenAndServe(); err != nil {
		panic(err)
	};
}