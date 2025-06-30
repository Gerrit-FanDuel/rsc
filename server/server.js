const path = require("node:path");
const { readFileSync } = require("node:fs");
const Fastify = require("fastify");
const fastifyStaticPlugin = require("@fastify/static");
const React = require("react");
const { renderToPipeableStream } = require("react-server-dom-webpack/server");
const AppImport = require("../src/App.jsx");

const App = AppImport.default;

const MANIFEST = readFileSync(
  path.resolve(__dirname, "../dist/react-client-manifest.json"),
  "utf8"
);

const MODULE_MAP = JSON.parse(MANIFEST);
const PORT = process.env.PORT ? process.env.PORT : 3000;

const fastify = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
    },
  },
});

fastify.register(fastifyStaticPlugin, {
  root: path.join(__dirname, "../dist"),
  prefix: "/assets/",
});

fastify.register(fastifyStaticPlugin, {
  root: path.join(__dirname, "../public"),
  decorateReply: false,
});

fastify.get("/", async function rootHandler(_req, res) {
  return res.sendFile("index.html");
});

fastify.get("/react-flight", function reactFlightHandler(req, res) {
  try {
    res.header("Content-Type", "application/octet-stream");

    const { pipe } = renderToPipeableStream(
      React.createElement(App),
      MODULE_MAP
    );

    pipe(res.raw);
  } catch (err) {
    req.log.error("react-flight err", err);
    throw err;
  }
});

module.exports = async function start() {
  try {
    await fastify.listen({ port: PORT });
    console.log(`Server is running at http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
