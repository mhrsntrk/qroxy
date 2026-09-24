const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const openDb = require("../db");
const { createApp, isUri } = require("../app");

const BASE_URL = "https://qroxy.example.test";
let server, origin, db;

before(async () => {
  db = openDb(":memory:");
  server = http.createServer(createApp({ db, baseUrl: BASE_URL }));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  db.close();
});

const post = (path, body) =>
  fetch(origin + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

test("POST /generate returns target, url and a PNG data URL, and the url redirects", async () => {
  const res = await post("/generate", {
    generationName: "Mahir Senturk",
    generationEmail: "m@mhrsntrk.com",
    generationTarget: "https://mhrsntrk.com/",
  });
  assert.equal(res.status, 201);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  const body = await res.json();
  assert.deepEqual(Object.keys(body).sort(), ["qr", "target", "url"]);
  assert.equal(body.target, "https://mhrsntrk.com/");
  assert.match(body.url, /^https:\/\/qroxy\.example\.test\/[0-9a-f-]{36}$/);
  assert.match(body.qr, /^data:image\/png;base64,/);

  const uuid = body.url.slice(BASE_URL.length + 1);
  const redirect = await fetch(`${origin}/${uuid}`, { redirect: "manual" });
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get("location"), "https://mhrsntrk.com/");
});

test("POST /generate rejects an invalid target with the original message", async () => {
  for (const generationTarget of ["not a url", "", undefined, 42]) {
    const res = await post("/generate", { generationName: "x", generationEmail: "x@y.z", generationTarget });
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { message: "Not a valid URL" });
  }
});

test("POST /update changes where the code redirects", async () => {
  const { url } = await (await post("/generate", { generationTarget: "https://a.example/" })).json();
  const updateUUID = url.slice(BASE_URL.length + 1);

  const res = await post("/update", { updateUUID, updateTarget: "https://b.example/path?q=1" });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { message: "Target URL successfully updated." });

  const redirect = await fetch(`${origin}/${updateUUID}`, { redirect: "manual" });
  assert.equal(redirect.headers.get("location"), "https://b.example/path?q=1");
});

test("POST /update validates the UUID before the URL, like the original", async () => {
  let res = await post("/update", { updateUUID: "does-not-exist", updateTarget: "https://b.example/" });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { message: "Invalid UUID" });

  res = await post("/update", { updateUUID: "does-not-exist", updateTarget: "nope" });
  assert.deepEqual(await res.json(), { message: "Invalid UUID" });

  const { url } = await (await post("/generate", { generationTarget: "https://a.example/" })).json();
  res = await post("/update", { updateUUID: url.slice(BASE_URL.length + 1), updateTarget: "nope" });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { message: "Not a valid URL" });
});

test("unknown code returns 404 instead of crashing", async () => {
  const res = await fetch(`${origin}/00000000-0000-0000-0000-000000000000`, { redirect: "manual" });
  assert.equal(res.status, 404);
});

test("CORS preflight from the website succeeds", async () => {
  const res = await fetch(`${origin}/generate`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://mhrsntrk.com",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  assert.match(res.headers.get("access-control-allow-methods"), /POST/);
  assert.equal(res.headers.get("access-control-allow-headers"), "content-type");
});

test("malformed JSON gets a 400, not a crash", async () => {
  const res = await fetch(`${origin}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not json",
  });
  assert.equal(res.status, 400);
});

test("isUri matches valid-url semantics for common cases", () => {
  assert.ok(isUri("https://mhrsntrk.com"));
  assert.ok(isUri("mailto:m@mhrsntrk.com"));
  assert.ok(!isUri("mhrsntrk.com"));
  assert.ok(!isUri("/relative"));
});
