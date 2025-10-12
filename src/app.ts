import { Hono } from "hono";
import { compress } from "hono/compress";
import { logger } from "hono/logger";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  countLanguagesWithPercent,
  createConfig,
  createSvg,
  fetchRepositoriesWithLanguages,
} from "./utils.ts";

const app = new Hono();
const config = await createConfig();

app.use(compress());
app.use(logger());

app.get("/health", (c) =>
  c.json({
    status: "healthy",
  }));

const querySchema = z.object({
  username: z.string().min(1),
  color: z.string().optional(),
});

app.get(
  "/",
  zValidator("query", querySchema),
  async (c) => {
    const { username, color } = c.req.query();

    try {
      const repos = await fetchRepositoriesWithLanguages(
        username,
        config.githubAccessToken,
      );

      if (!repos || repos.length === 0) {
        return new Response("No Content", { status: 204 });
      }

      const topLanguages = countLanguagesWithPercent(repos, username);
      const svg = createSvg(topLanguages, color || "#000000");

      return new Response(svg, {
        headers: { "Content-Type": "image/svg+xml" },
      });
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify(err), { status: 500 });
    }
  },
);

export { app };
