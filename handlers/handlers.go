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
		isDark := query.Get("dark")
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

		for key, value := range languages {
			progresses[key] = utils.ProgressBar(value, len(repos))
		}

		svg := utils.EditLanguagesSVG(utils.SortMapByValue(progresses), isDark == "true")

		w.Header().Set("Content-Type", "image/svg+xml")
		w.Write(svg)
	}
}
