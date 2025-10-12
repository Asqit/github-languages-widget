# GitHub Languages Widget

A Deno web service that generates a dynamic SVG widget showing the top programming languages used in a GitHub user's public repositories. Perfect for embedding in your GitHub README or personal website to showcase your coding profile.

---

## Features

- **SVG Widget Generation:** Returns an SVG image visualizing the top languages for any GitHub username.
- **Customizable Appearance:** Change the text color via query parameters.
- **Live Data:** Fetches language statistics directly from the GitHub API.
- **Health Endpoint:** `/health` route for service status checks.
- **Modern Stack:** Built with [Deno](https://deno.com/) and [Hono](https://hono.dev/) for fast, serverless deployment.

---

## Usage

Embed the widget in your README or website using an image tag:

```markdown
<img src="https://github-language-widget.deno.dev?username=YOUR_GITHUB_USERNAME&color=YOUR_COLOR_HEX" alt="GitHub Languages Widget" />
```

- Replace `YOUR_GITHUB_USERNAME` with your GitHub username.
- Optionally, set `color` to customize the text color (e.g., `color=%23000000` for black).

### Example

```markdown
<img src="https://github-language-widget.deno.dev?username=asqit&color=%23000000" alt="GitHub Languages Widget" />
```

---

## API Endpoints

- `/`
  **GET**: Returns the SVG widget.
  **Query Parameters:**
  - `username` (required): GitHub username
  - `color` (optional): Text color (hex or named)

- `/health`
  **GET**: Returns service health status.

---

## How It Works

1. Receives a request with a GitHub username.
2. Fetches public repositories and their language stats from the GitHub API.
3. Calculates the top languages by percentage.
4. Generates and returns an SVG image visualizing the results.

---

## Tech Stack

- **Deno**: Secure runtime for JavaScript and TypeScript.
- **Hono**: Lightweight web framework for building APIs.
- **GitHub REST API**: For fetching repository and language data.

---

## License

MIT

---

## Author

[asqit](https://github.com/asqit)
