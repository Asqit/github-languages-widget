import {
  countLanguages,
  createConfig,
  createSvg,
  fetchRepositories,
} from "./src/utils.ts";

async function getTopLanguages(req: Request): Promise<Response> {
  const { githubAccessToken } = await createConfig();
  if (req.method !== "GET") {
    console.log("Method not allowed:", req.method);
    return new Response("Method Not Allowed", { status: 405 });
  }

  const parsedUrl = new URL(req.url, "http://localhost");
  const isDark = parsedUrl.searchParams.get("dark");
  const username = parsedUrl.searchParams.get("username");

  if (!username || username === null) {
    console.log("Username is missing");
    return new Response("Bad Request", { status: 400 });
  }

  console.log(`Fetching repos for user: ${username}`);

  if (!githubAccessToken) {
    console.log("GitHub access token is missing");
    return new Response("Internal Server Error", { status: 500 });
  }

  const response = await fetchRepositories(username, githubAccessToken);

  if (response instanceof Response) {
    return response;
  }

  const languages = countLanguages(response, username);
  const svg = createSvg(languages, response.length, isDark === "true");

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
    },
  });
}

async function router(req: Request) {
  console.log(`Method - [${req.method.toUpperCase()}], Url - [${req.url}]`);

  return await getTopLanguages(req);
}

Deno.serve({ port: 3000 }, router);
