import { Elysia, file } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { staticPlugin } from "@elysiajs/static";

import { auth } from "./auth.js";
import { server } from "./server.js";
import { assetsServer } from "./assets.js";
import { capServer } from "./cap.js";

new Elysia()
  .use(
    swagger({
      scalarConfig: {
        customCss: `.section-header-wrapper .section-header.tight { margin-top: 10px; }`,
      },
      exclude: ["/", "/auth/login"],
      documentation: {
        tags: [
          {
            name: "Keys",
            description:
              "Managing, creating and viewing keys. Requires API or session token",
          },
          {
            name: "Settings",
            description:
              "Managing sessions, API keys, and other settings. Requires API or session token",
          },
          {
            name: "Challenges",
            description: "Creating and managing challenges and tokens",
          },
          {
            name: "Assets",
            description: "Reading static assets from the assets server",
          },
        ],
        info: {
          title: "Cap Standalone",
          version: "2.0.0",
          description:
            "API endpoints for Cap Standalone. Both Keys and Settings endpoints require an API key or session token.\n\n[Learn more](https://capjs.js.org)",
        },
        securitySchemes: {
          apiKey: {
            type: "http",
          },
        },
      },
    })
  )
  .use(staticPlugin())
  .get("/", async ({ cookie }) => {
    return file(
      cookie.cap_authed?.value === "yes"
        ? "./public/index.html"
        : "./public/login.html"
    );
  })
  .use(auth)
  .use(server)
  .use(assetsServer)
  .use(capServer)
  .listen(3000);

console.log(`🧢 Cap running on http://localhost:3000`);
