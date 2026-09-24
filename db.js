const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

function open(file) {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS qrcode (
      id         TEXT PRIMARY KEY,
      url        TEXT NOT NULL,
      code       TEXT NOT NULL,
      target     TEXT NOT NULL,
      name       TEXT,
      email      TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const insertStmt = db.prepare(
    "INSERT INTO qrcode (id, url, code, target, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const targetStmt = db.prepare("SELECT target FROM qrcode WHERE id = ?");
  const updateStmt = db.prepare("UPDATE qrcode SET target = ?, updated_at = ? WHERE id = ?");

  return {
    insert({ id, url, code, target, name, email }) {
      const now = new Date().toISOString();
      insertStmt.run(id, url, code, target, name ?? null, email ?? null, now, now);
    },
    target(id) {
      return targetStmt.get(id)?.target;
    },
    // Returns false when the id does not exist.
    update(id, target) {
      return updateStmt.run(target, new Date().toISOString(), id).changes > 0;
    },
    close() {
      db.close();
    },
  };
}

module.exports = open;
