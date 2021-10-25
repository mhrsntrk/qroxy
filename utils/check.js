const { MongoClient } = require("mongodb");
require("dotenv").config();

async function read(uuid) {
  const mongoURI = process.env.MONGO_URI;

  const client = new MongoClient(mongoURI);

  try {
    await client.connect();

    const exist = await findQRCode(client, uuid);

    if (exist) {
        return true
    }
    else{
        return false
    }

  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

async function findQRCode(client, uuid) {
  return await client.db("qroxy").collection("qrcode").find({ _id: uuid }).count()>0;
}

module.exports = read;