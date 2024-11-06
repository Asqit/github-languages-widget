// @deno-types="npm:@types/express@^4.17"
import express from "npm:express";

import {
  fetchRepositories,
  createConfig,
  countLanguages,
} from "./src/utils.ts";
import { createSvg } from "./src/utils.ts";

const { githubAccessToken } = await createConfig();
const app = express();
if (!githubAccessToken) {
  Deno.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.disable("x-powered-by");

app.use((req, res, next) => {
  const { method, url, socket } = req;
  const data = `METHOD - [${method}];URL - [${url}];IP - [${socket.remoteAddress}]`;
  console.log(data);

  res.on("finish", () => {
    console.log(`${data};STATUS_CODE - [${res.statusCode}]`);
  });
  next();
});

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
      if (
        repo.language &&
        repo.owner.login.toUpperCase() === String(username).toUpperCase()
      )
        return repo;
    });
    return valid;
  };

  const languages = countLanguages(filtered(), String(username));
  const svg = createSvg(
    languages,
    filtered().length,
    isDark === "true" ? true : false
  );
  res.setHeader("Content-Type", "image/svg+xml");
  res.status(200).send(svg);
});

app.use((err, _req, res, _next) => {
  const message = err?.message ?? "Internal Server Error";
  const status = err?.statusCode ?? 500;
  res.status(status).json({
    status,
    message,
  });
});

app.listen(8000, () => {
  console.log(`http://localhost:8000`);
});
