package utils

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/asqit/github-language-widget/models"
)

func FetchGithubRepositories(username string) ([]models.Repository, error) {
	fetchUrl := fmt.Sprintf("https://api.github.com/users/%s/repos", username)
	client := &http.Client{Timeout: 5 * time.Second}

	req, err := http.NewRequest("GET", fetchUrl, nil)
	if err != nil {
		return nil, err
	}

	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	if res.Body != nil {
		defer res.Body.Close()
	}

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	repositories := []models.Repository{}
	jsonError := json.Unmarshal(body, &repositories)

	if jsonError != nil {
		log.Println(body)
		return nil, jsonError
	}

	return repositories, nil
}

// ASCII Progress Bar
var ASCII_PROGRESS = "▒"
var ASCII_FINISH = "█"

func ProgressBar(progress int, total int) string {
	percentage := (progress * 100) / total
	progressBar := ""

	for i := 0; i < 50; i++ {
		if i < percentage/2 {
			progressBar += ASCII_FINISH
		} else {
			progressBar += ASCII_PROGRESS
		}
	}

	return progressBar
}

func GenerateTopLanguages(repos []models.Repository, username string) map[string]int {
	languages := make(map[string]int)

	for _, repo := range repos {
		if repo.Owner.Login != username {
			continue
		}

		language := repo.Language
		if language == "" {
			continue
		}

		if _, ok := languages[language]; ok {
			languages[language] += 1
		} else {
			languages[language] = 1
		}
	}

	return languages
}

func EditLanguagesSVG(languages map[string]string) []byte {
	svg := `<svg width="400" xmlns="http://www.w3.org/2000/svg">`

	svg += `
	<style>
        text {
            font-family: 'Courier New', Courier, monospace;
            font-size: 16px;
        }
		.title {
            font-family: Arial;
            font-size: 24px;
            font-weight: bold;
        }
    </style>
	<text x="50" y="30" class="title">Top Languages</text>

	`

	multiplier := 1
	for text, bar := range languages {
		multiplier += 1
		svg += fmt.Sprintf(`

		<text x="20" y="%d" font-family="Arial" font-size="16" fill="black">
			<tspan>%s</tspan>: <tspan>%s</tspan>
		</text>
		`, multiplier*32, text, bar) + "\n" // Add a new line character after each text element
	}

	svg += `</svg>`

	return []byte(svg)
}
