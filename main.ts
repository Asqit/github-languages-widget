import { app } from "./src/app.ts";

function main() {
  Deno.serve(app.fetch);
}

if (import.meta.main) {
  main();
}
