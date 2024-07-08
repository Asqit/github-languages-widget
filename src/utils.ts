import type { Repository } from "../src/types.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

export const ASCII_PROGRESS = "▒";
export const ASCII_FINISH = "█";

export function countLanguages(
  repos: Repository[],
  username: string
): Map<string, number> {
  const languages = new Map<string, number>();
  const upperCaseUsername = username.toUpperCase();

  repos.forEach((repo) => {
    if (repo.owner.login.toUpperCase() !== upperCaseUsername) return;

    const language = repo.language;
    if (language) {
      languages.set(language, (languages.get(language) || 0) + 1);
    }
  });

  return new Map([...languages.entries()].sort((a, b) => b[1] - a[1]));
}

export async function createConfig() {
  const env = await load();
  return {
    port: env["PORT"],
    githubAccessToken: env["GITHUB_ACCESS_TOKEN"],
  };
}

function createProgressBar(progress: number, total: number): [string, number] {
  const percentage = (progress * 100) / total;
  const progressBar = Array.from({ length: 50 }, (_, i) =>
    i < percentage / 2 ? ASCII_FINISH : ASCII_PROGRESS
  ).join("");

  return [progressBar, percentage];
}

export function createSvg(
  languages: Map<string, number>,
  total: number,
  isDark = false
): string {
  const className = isDark ? "dark" : "light";
  const svgHeight = (languages.size + 2) * 34;

  const languageBars = Array.from(languages)
    .map(([lang, count], i) => {
      const [bar, _percentage] = createProgressBar(count, total);
      const yPos = (i + 2) * 34;

      return `
      <text x="10" y="${yPos}" class="${className}">${lang}</text>
      <text x="10" y="${yPos + 16}" class="${className}">${bar}</text>
    `;
    })
    .join("");

  const svgTemplate = `
    <svg width="400" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <style>
        text {
          font-family: 'Courier New', Courier, monospace;
          font-weight: 400;
          font-style: normal;
          font-size: 16px;
          fill: ${isDark ? "white" : "black"};
        }
        .title {
          font-family: Arial;
          font-style: normal;
          font-size: 24px;
          font-weight: bold;
          fill: ${isDark ? "white" : "black"};
        }
      </style>
      <text x="10" y="30" class="title ${className}">Top Languages</text>
      ${languageBars}
    </svg>
  `;

  return svgTemplate;
}

export async function fetchRepositories(username: string, token: string) {
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (Array.isArray(data) && data.length === 0) {
      return new Response("No Content", { status: 204 });
    }

    return data as Repository[];
  } catch (exception) {
    return new Response(JSON.stringify(exception), { status: 500 });
  }
}
