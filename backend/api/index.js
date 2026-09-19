// Vercel serverless entry point.
// Boots the compiled Nest app (dist/) on top of an Express instance once per
// lambda and forwards every request to it. Build: `npm run build`.
const express = require('express');
const { createApp } = require('../dist/app.factory');

let ready;

async function getServer() {
  if (!ready) {
    ready = (async () => {
      const server = express();
      const app = await createApp(server);
      await app.init();
      return server;
    })();
  }
  return ready;
}

module.exports = async (req, res) => {
  const server = await getServer();
  return server(req, res);
};
