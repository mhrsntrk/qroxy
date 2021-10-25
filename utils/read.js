const { MongoClient } = require("mongodb");
require("dotenv").config();

async function read(uuid) {
  const mongoURI = process.env.MONGO_URI;

  const client = new MongoClient(mongoURI);

  try {
    await client.connect();

    const find = await findQRCode(client, uuid);
    
    return find.target

  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

async function findQRCode(client, uuid) {
  return await client.db("qroxy").collection("qrcode").findOne({ _id: uuid });
}

module.exports = read;
