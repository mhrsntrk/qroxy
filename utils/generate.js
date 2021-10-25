var QRCode = require("qrcode");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const { v1: uuidv1 } = require("uuid");

async function generate(target) {
  const baseURL = process.env.BASE_URL;
  const mongoURI = process.env.MONGO_URI;
  const uuid = uuidv1();

  const client = new MongoClient(mongoURI);

  var url = baseURL + "/" + uuid;

  var options = {
    errorCorrectionLevel: "H",
    type: "image/png",
    quality: 1,
    margin: 2,
    width: 350,
    color: {
      dark: "#fff",
      light: "#000",
    },
  };

  try {
    var qr = await QRCode.toDataURL(url, options);

    await client.connect();

    await insertQRCode(client, {
      _id: uuid,
      url: url,
      code: qr,
      target: target,
      cratedAt: new Date(),
      updatedAt: new Date(),
    });
    return { qr: qr, url: url};
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

async function insertQRCode(client, qrCode) {
  const result = await client
    .db("qroxy")
    .collection("qrcode")
    .insertOne(qrCode);
  console.log(
    `New QR Code generated with the following ID: ${result.insertedId}`
  );
}

module.exports = generate;
