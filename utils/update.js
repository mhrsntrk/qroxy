const { MongoClient } = require("mongodb");
require("dotenv").config();

async function update(uuid, target) {
  const mongoURI = process.env.MONGO_URI;

  const client = new MongoClient(mongoURI);

  try {
    await client.connect();

    await updateQRCode(client, uuid, {
      target: target,
      updatedAt: new Date(),
    });
    return { message: "Target URL successfully updated."}
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

async function updateQRCode(client, uuid, updatedQRCode) {
  await client
    .db("qroxy")
    .collection("qrcode")
    .updateOne({ _id: uuid }, { $set: updatedQRCode });
}

module.exports = update;
