package handlers

import (
	"log"
	"net/http"
	"net/url"

	"github.com/asqit/github-language-widget/utils"
)

func HealthCheckHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}
}

func GetTopLanguages() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			w.Write([]byte("Method Not Allowed"))
			return
		}

		urlObj, err := url.Parse(r.RequestURI)
		if err != nil {
			log.Printf("error: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("Internal Server Error"))
			return
		}

		query, err := url.ParseQuery(urlObj.RawQuery)
		if err != nil {
			log.Printf("error: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("Internal Server Error"))
			return
		}

		username := query.Get("username")
		if username == "" {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Bad Request"))
			return
		}

		repos, err := utils.FetchGithubRepositories(username)
		if err != nil {
			log.Printf("error: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("Internal Server Error"))
			return
		}

		languages := utils.GenerateTopLanguages(repos, username)
		progresses := make(map[string]string)

		for name, count := range languages {
			progresses[name] = utils.ProgressBar(count, len(repos))
		}

		svg := utils.EditLanguagesSVG(progresses)

		w.Header().Set("Content-Type", "image/svg+xml")
		w.Write(svg)
	}
}
