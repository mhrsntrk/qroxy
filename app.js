const crypto = require("node:crypto");
const QRCode = require("qrcode");

// Same rendering as the original MongoDB version, so new codes look identical.
const QR_OPTIONS = {
  errorCorrectionLevel: "H",
  type: "image/png",
  margin: 2,
  width: 350,
  color: { dark: "#fff", light: "#000" },
};

const MAX_BODY = 100 * 1024; // express.json() default

// Equivalent of valid-url's isUri(): an absolute URI with a scheme.
function isUri(value) {
  return typeof value === "string" && /^[a-z][a-z0-9+.-]*:/i.test(value) && URL.canParse(value);
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
};

function send(res, status, body, headers = {}) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    ...CORS_HEADERS,
    ...(body === undefined ? {} : { "Content-Type": "application/json; charset=utf-8" }),
    ...headers,
  });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error("Payload too large"), { status: 413 }));
        req.destroy();
      } else chunks.push(chunk);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        resolve(parsed && typeof parsed === "object" ? parsed : {});
      } catch {
        reject(Object.assign(new Error("Invalid JSON"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function createApp({ db, baseUrl }) {
  async function generate(body) {
    const target = body.generationTarget;
    if (!isUri(target)) return [400, { message: "Not a valid URL" }];
    const id = crypto.randomUUID();
    const url = `${baseUrl}/${id}`;
    const qr = await QRCode.toDataURL(url, QR_OPTIONS);
    db.insert({ id, url, code: qr, target, name: body.generationName, email: body.generationEmail });
    return [201, { target, url, qr }];
  }

  function update(body) {
    const id = body.updateUUID;
    const target = body.updateTarget;
    if (typeof id !== "string" || db.target(id) === undefined) return [400, { message: "Invalid UUID" }];
    if (!isUri(target)) return [400, { message: "Not a valid URL" }];
    db.update(id, target);
    return [200, { message: "Target URL successfully updated." }];
  }

  return async function handler(req, res) {
    const started = Date.now();
    res.on("finish", () =>
      console.log(`${req.method} ${req.url} ${res.statusCode} - ${Date.now() - started} ms`)
    );
    try {
      const { pathname } = new URL(req.url, "http://localhost");

      if (req.method === "OPTIONS") {
        return send(res, 204, undefined, {
          "Access-Control-Allow-Headers": req.headers["access-control-request-headers"] || "",
          "Content-Length": "0",
        });
      }
      if (req.method === "POST" && pathname === "/generate") {
        const [status, body] = await generate(await readJson(req));
        return send(res, status, body);
      }
      if (req.method === "POST" && pathname === "/update") {
        const [status, body] = update(await readJson(req));
        return send(res, status, body);
      }
      if (req.method === "GET" && pathname === "/healthz") {
        return send(res, 200, { ok: true });
      }
      const match = /^\/([^/]+)$/.exec(pathname);
      if ((req.method === "GET" || req.method === "HEAD") && match) {
        const target = db.target(decodeURIComponent(match[1]));
        if (target === undefined) return send(res, 404, { message: "QR code not found" });
        return send(res, 302, undefined, { Location: target });
      }
      return send(res, 404, { message: "Not found" });
    } catch (err) {
      if (err.status) return send(res, err.status, { message: err.message });
      console.error(err);
      return send(res, 500, { message: "Internal server error" });
    }
  };
}

module.exports = { createApp, isUri };
