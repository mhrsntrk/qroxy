const http = require("node:http");
const openDb = require("./db");
const { createApp } = require("./app");

const port = Number(process.env.PORT) || 5050;
const baseUrl = (process.env.BASE_URL || `http://localhost:${port}`).replace(/\/+$/, "");
const dbPath = process.env.DB_PATH || "./data/qroxy.db";

const db = openDb(dbPath);
const server = http.createServer(createApp({ db, baseUrl }));

server.listen(port, () => {
  console.log(`RESTful API server started on:${port} (db: ${dbPath})`);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  });
}
