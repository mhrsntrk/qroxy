# OVERVIEW

"qroxy" name is originated from concatenating "qr code" and "proxy" words, it will hopefully give idea of the project overview. In plain English it is a dynamic QR code generator REST API with a connected mongoDB to store routes.

### What is QR Code?

A QR code stands for ‘Quick Response Code’ and it is a 2-dimensional barcode type invented by Denso Wave in 1994.

Today, QR codes are used widely in different business sectors to give a digital dimension to a product, an item, billboards, posters, or flyers that leads to a URL. QR codes have two types: Static QR code and Dynamic QR code.

### What is Dynamic QR Code?

Dynamic QR Code is an editable QR code which enables you to redirect the URL to another URL even after printing. Since you are redirecting the URL you can capture and store precious user data.

# USAGE

## Setup

### 1. Clone the repo and install dependencies
```
git clone https://github.com/mhrsntrk/qroxy.git
cd qroxy
yarn
```

### 2. Setup a mongoDB database
When you generate your first entry it will be under qroxy database and qrcode collection.

### 3. Create the .env file
```
BASE_URL=http://localhost:5050
PORT=5050
MONGO_URI=mongodb://fill-it-with-your-own-uri
```
### 4. Run the project
```
yarn dev
```

## Example Requests

### 1. /generate
```
POST /generate HTTP/1.1
Content-Type: application/json; charset=utf-8
Host: qroxy.dev.mhrsntrk.com

{"generationTarget":"https://mhrsntrk.com/","generationName":"Mahir Senturk","generationEmail":"m@mhrsntrk.com"}
```

### 1. /update
```
POST /update HTTP/1.1
Content-Type: application/json; charset=utf-8
Host: qroxy.dev.mhrsntrk.com

{"target":"https://mhrsntrk.com/","uuid":"d55c3310-35a8-11ec-8f24-33733cb50609"}
```

# DEPLOY

There is a Dockerfile on the repo, you can use it to deploy `qroxy` anywhere you like, I personally use [Caprover](https://caprover.com/).