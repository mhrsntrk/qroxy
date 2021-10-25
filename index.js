const express = require("express");
var cors = require("cors");
const morgan = require("morgan");
const validate = require("valid-url");

const read = require("./utils/read");
const generate = require("./utils/generate");
const update = require("./utils/update");
const check = require("./utils/check");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

app.get("/:uuid", async function (req, res) {
  const uuid = req.params.uuid;
  const url = await read(uuid);
  return res.redirect(url);
});

app.post("/generate", async function (req, res) {
  const target = req.body.target;
  if (validate.isUri(target)) {
    const generated = await generate(target);
    return res
      .status(201)
      .json({ target: target, url: generated.url, qr: generated.qr });
  } else {
    return res.status(400).json({ message: "Not a valid URL" });
  }
});

app.post("/update", async function (req, res) {
  const uuid = req.body.uuid;
  const target = req.body.target;
  if (await check(uuid)) {
    if (validate.isUri(target)) {
      const updated = await update(uuid, target);
      return res.status(200).json({ message: updated.message });
    } else {
      return res.status(400).json({ message: "Not a valid URL" });
    }
  } else {
    return res.status(400).json({ message: "Invalid UUID" });
  }
});

module.exports = app;
