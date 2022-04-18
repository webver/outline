import fs from "fs";
import path from "path";
import util from "util";
import Koa, { Context, Next } from "koa";
import Router from "koa-router";
import send from "koa-send";
import serve from "koa-static";
import isUUID from "validator/lib/isUUID";
import { languages } from "@shared/i18n";
import env from "@server/env";
import { NotFoundError } from "@server/errors";
import Share from "@server/models/Share";
import { opensearchResponse } from "@server/utils/opensearch";
import prefetchTags from "@server/utils/prefetchTags";
import { robotsResponse } from "@server/utils/robots";
import apexRedirect from "../middlewares/apexRedirect";
import presentEnv from "../presenters/env";

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";
const koa = new Koa();
const router = new Router();
const readFile = util.promisify(fs.readFile);

const readIndexFile = async (ctx: Context): Promise<Buffer> => {
  if (isProduction) {
    return readFile(path.join(__dirname, "../../app/index.html"));
  }

  if (isTest) {
    return readFile(path.join(__dirname, "../static/index.html"));
  }

  const middleware = ctx.devMiddleware;
  await new Promise((resolve) => middleware.waitUntilValid(resolve));
  return new Promise((resolve, reject) => {
    middleware.fileSystem.readFile(
      `${ctx.webpackConfig.output.path}/index.html`,
      (err: Error, result: Buffer) => {
        if (err) {
          return reject(err);
        }

        resolve(result);
      }
    );
  });
};

const renderApp = async (ctx: Context, next: Next, title = "Outline") => {
  if (ctx.request.path === "/realtime/") {
    return next();
  }

  const { shareId } = ctx.params;
  const page = await readIndexFile(ctx);
  const environment = `
    window.env = ${JSON.stringify(presentEnv(env))};
  `;
  ctx.body = page
    .toString()
    .replace(/\/\/inject-env\/\//g, environment)
    .replace(/\/\/inject-title\/\//g, title)
    .replace(/\/\/inject-prefetch\/\//g, shareId ? "" : prefetchTags)
    .replace(/\/\/inject-slack-app-id\/\//g, process.env.SLACK_APP_ID || "");
};

const renderShare = async (ctx: Context, next: Next) => {
  const { shareId } = ctx.params;
  // Find the share record if publicly published so that the document title
  // can be be returned in the server-rendered HTML. This allows it to appear in
  // unfurls with more reliablity
  let share;

  if (isUUID(shareId)) {
    share = await Share.findOne({
      where: {
        id: shareId,
        published: true,
      },
    });
  }

  // Allow shares to be embedded in iframes on other websites
  ctx.remove("X-Frame-Options");
  return renderApp(ctx, next, share?.document?.title);
};

// serve static assets
koa.use(
  serve(path.resolve(__dirname, "../../../public"), {
    maxage: 60 * 60 * 24 * 30 * 1000,
  })
);

if (process.env.NODE_ENV === "production") {
  router.get("/static/*", async (ctx) => {
    try {
      const pathname = ctx.path.substring(8);
      if (!pathname) {
        throw NotFoundError();
      }

      await send(ctx, pathname, {
        root: path.join(__dirname, "../../app/"),
        setHeaders: (res) => {
          res.setHeader("Service-Worker-Allowed", "/");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cache-Control", `max-age=${365 * 24 * 60 * 60}`);
        },
      });
    } catch (err) {
      if (err.status === 404) {
        // Serve a bad request instead of not found if the file doesn't exist
        // This prevents CDN's from caching the response, allowing them to continue
        // serving old file versions
        ctx.status = 400;
        return;
      }

      throw err;
    }
  });
}

router.get("/locales/:lng.json", async (ctx) => {
  const { lng } = ctx.params;

  if (!languages.includes(lng)) {
    ctx.status = 404;
    return;
  }

  await send(ctx, path.join(lng, "translation.json"), {
    setHeaders: (res) => {
      res.setHeader(
        "Cache-Control",
        process.env.NODE_ENV === "production"
          ? `max-age=${7 * 24 * 60 * 60}`
          : "no-cache"
      );
    },
    root: path.join(__dirname, "../../shared/i18n/locales"),
  });
});

router.get("/robots.txt", (ctx) => {
  ctx.body = robotsResponse();
});

router.get("/opensearch.xml", (ctx) => {
  ctx.type = "text/xml";

  ctx.body = opensearchResponse();
});

router.get("/share/:shareId", renderShare);

router.get("/share/:shareId/*", renderShare);

// catch all for application
router.get("*", renderApp);

// In order to report all possible performance metrics to Sentry this header
// must be provided when serving the application, see:
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Timing-Allow-Origin
const timingOrigins = [env.URL];

if (env.SENTRY_DSN) {
  timingOrigins.push("https://sentry.io");
}

koa.use(async (ctx, next) => {
  ctx.set("Timing-Allow-Origin", timingOrigins.join(", "));
  await next();
});
koa.use(apexRedirect());
koa.use(router.routes());

export default koa;
