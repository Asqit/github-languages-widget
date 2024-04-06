package utils

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sort"
	"time"

	"github.com/asqit/github-language-widget/models"
	"github.com/joho/godotenv"
)

func GetEnv(key string) string {
	godotenv.Load(".env")
	value := os.Getenv(key)

	return value
}

func FetchGithubRepositories(username string) ([]models.Repository, error) {
	fetchUrl := fmt.Sprintf("https://api.github.com/users/%s/repos", username)
	client := &http.Client{Timeout: 5 * time.Second}

	req, err := http.NewRequest("GET", fetchUrl, nil)
	req.Header.Set("Authorization", "Bearer "+GetEnv("GITHUB_ACCESS_TOKEN"))
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

type Pair struct {
	Key   string
	Value int
}

func sortMapByValue(m map[string]int) []Pair {
	// Create a slice of pairs to hold the key-value pairs
	var pairs []Pair
	// Populate the slice with the key-value pairs from the map
	for k, v := range m {
		pairs = append(pairs, Pair{k, v})
	}
	// Sort the slice by values
	sort.Slice(pairs, func(i, j int) bool {
		return pairs[i].Value > pairs[j].Value // Change to '<' for ascending order
	})
	return pairs
}

func GenerateTopLanguages(repos []models.Repository, username string) []Pair {
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

	return sortMapByValue(languages)
}

func EditLanguagesSVG(languages map[string]string, isDark bool) []byte {
	svg := `<svg width="400" height="%d" xmlns="http://www.w3.org/2000/svg">`

	svg += `
	<style>
        text {
            font-family: 'Courier New', Courier, monospace;
            font-size: 16px;
            fill: black; /* Set default text color */
        }
		.title {
            font-family: Arial;
            font-size: 24px;
            font-weight: bold;
            fill: black; /* Set default text color for title */
        }

		.lightMode { fill: white; } /* Set text color for light mode */
		.darkMode { fill: black; } /* Set text color for dark mode */
    </style>
	<text x="50" y="30" class="title">Top Languages</text>
	`

	svg = fmt.Sprintf(svg, len(languages)*32+64)

	// Determine the color class based on isDark
	colorClass := "lightMode"
	if isDark {
		colorClass = "darkMode"
	}

	multiplier := 1
	for text, bar := range languages {
		multiplier += 1
		svg += fmt.Sprintf(`
		<text x="20" y="%d" font-family="Arial" font-size="16" class="%s">
			<tspan>%s</tspan>: <tspan>%s</tspan>
		</text>
		`, multiplier*32, colorClass, text, bar) + "\n" // Add a new line character after each text element
	}

	svg += `</svg>`

	return []byte(svg)
}
