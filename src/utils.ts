import type { Repository } from "../src/types.ts";
import { Octokit } from "octokit";
import { load } from "@std/dotenv";

export const ASCII_PROGRESS = "▒";
export const ASCII_FINISH = "█";

export async function createConfig() {
  let githubAccessToken = Deno.env.get("GITHUB_ACCESS_TOKEN");

  if (!githubAccessToken) {
    const env = await load();

    githubAccessToken = env["GITHUB_ACCESS_TOKEN"];
  }

  return {
    githubAccessToken,
  };
}

export function countLanguagesWithPercent(
  repos: (Repository & { languages: Record<string, number> })[],
  username: string,
) {
  const languages = new Map<string, number>();
  const upperCaseUsername = username.toUpperCase();

  repos.forEach((repo) => {
    if (repo.owner.login.toUpperCase() !== upperCaseUsername) return;

    for (const [lang, pct] of Object.entries(repo.languages)) {
      languages.set(lang, (languages.get(lang) || 0) + pct);
    }
  });

  return new Map([...languages.entries()].sort((a, b) => b[1] - a[1]));
}

export function createProgressBar(
  count: number,
  total: number,
  barLength = 40,
): [string, number] {
  if (!total || total <= 0) {
    const empty = ASCII_PROGRESS.repeat(barLength);
    return [empty, 0];
  }

  // whole-number percentage (rounded)
  const percentage = Math.round((count * 100) / total);

  // filled chars based on that whole-number percentage
  const filledChars = Math.round((percentage * barLength) / 100);
  const filledPart = ASCII_FINISH.repeat(Math.max(0, filledChars));
  const emptyPart = ASCII_PROGRESS.repeat(Math.max(0, barLength - filledChars));

  return [filledPart + emptyPart, percentage];
}

export function createSvg(
  languages: Map<string, number>,
  color: string = "#000000",
  barLength = 40,
  backgroundColor: string = "transparent",
  borderRadius: number = 0,
): string {
  const total = Array.from(languages.values()).reduce((a, b) => a + b, 0);
  const charWidth = 10;
  const leftX = 10;
  const lineHeight = 34;
  const titleHeight = 30;
  const svgHeight = (languages.size + 2) * lineHeight;
  const svgWidth = Math.max(500, leftX + barLength * charWidth + 160);

  const languageBars = Array.from(languages)
    .slice(0, 6)
    .map(([lang, count], i) => {
      const [bar, percentage] = createProgressBar(count, total, barLength);
      const yPos = (i + 2) * lineHeight;
      const nameText = `${lang} ${percentage}%`;
      const barX = leftX;
      const barY = yPos + 16;
      const percentRightX = leftX + barLength * charWidth + 8;

      return `
        <text x="${leftX}" y="${yPos}">${nameText}</text>
        <text x="${barX}" y="${barY}">${bar}</text>
        <text x="${percentRightX}" y="${barY}">${percentage}%</text>
      `;
    })
    .join("");

  return `
    <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <style>
        text {
          font-family: monospace;
          font-weight: 400;
          font-style: normal;
          font-size: 16px;
          fill: ${color};
        }
        .title {
          font-family: monospace;
          font-style: normal;
          font-size: 24px;
          font-weight: bold;
          fill: ${color};
        }
      </style>

      <!-- Background -->
      <rect
        x="0"
        y="0"
        width="${svgWidth}"
        height="${svgHeight}"
        rx="${borderRadius}"
        ry="${borderRadius}"
        fill="${backgroundColor}"
      />

      <text x="${leftX}" y="${titleHeight}" class="title">Top Languages</text>
      ${languageBars}
    </svg>
  `;
}

export async function fetchRepositoriesWithLanguages(
  username: string,
  token?: string,
) {
  try {
    const octokit = token ? new Octokit({ auth: token }) : new Octokit();

    const { data: repos } = await octokit.rest.repos.listForUser({
      username,
      per_page: 100,
    });

    if (repos.length === 0) return [];

    const reposWithLanguages = await Promise.all(
      repos.map(async (repo) => {
        const { data: langData } = await octokit.rest.repos.listLanguages({
          owner: repo.owner.login,
          repo: repo.name,
        });

        const totalBytes = Object.values(langData).reduce(
          (sum, b) => sum + b,
          0,
        );

        const languagePercentages = Object.fromEntries(
          Object.entries(langData).map(([lang, bytes]) => [
            lang,
            totalBytes ? (bytes / totalBytes) * 100 : 0,
          ]),
        );

        return { ...repo, languages: languagePercentages };
      }),
    );

    return reposWithLanguages as (Repository & {
      languages: Record<string, number>;
    })[];
  } catch (err) {
    console.error(err);
    return [];
  }
}
