// @deno-types="npm:@types/express@^4.17"
import express from "npm:express";

import { createConfig } from "./src/utils.ts";
import { fetchRepositories } from "./src/utils.ts";
import { countLanguages } from "./src/utils.ts";
import { createSvg } from "./src/utils.ts";

const { githubAccessToken } = await createConfig();
const app = express();
if (!githubAccessToken) {
  Deno.exit(1);
}

function isValidQueryParams(username: unknown, isDark: unknown): boolean {
  return (
    typeof username === "string" && (isDark === "true" || isDark === "false")
  );
}

app.get("/", async (req, res) => {
  const { isDark, username } = req.query;
  if (!isValidQueryParams(username, isDark)) {
    res.status(400).json({
      status: "bad request",
      detail: "Invalid or missing query parameters",
    });
    return;
  }

  const repositories = await fetchRepositories(
    String(username),
    githubAccessToken
  );
  if (repositories instanceof Response) {
    res.sendStatus(400);
    return;
  }

  const filtered = () => {
    const valid = repositories.filter((repo) => {
      if (repo.language) return repo;
    });
    return valid;
  };

  const languages = countLanguages(filtered(), String(username));
  const svg = createSvg(languages, filtered().length, Boolean(isDark));

  res.setHeader("Content-Type", "image/svg+xml");
  res.status(201).send(svg);
});

app.listen(8000, () => {
  console.log(`http://localhost:8000`);
});
