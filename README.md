# OVERVIEW

"qroxy" name is originated from concatenating "qr code" and "proxy" words, it will hopefully give idea of the project overview. In plain English, it is a dynamic QR code generator REST API that stores routes in a single SQLite file.

[Live Demo](https://mhrsntrk.com/swissknife/qroxy)

### What is QR Code?

A QR code stands for ‘Quick Response Code’ and it is a 2-dimensional barcode type invented by Denso Wave in 1994.

Today, QR codes are used widely in different business sectors to give a digital dimension to a product, an item, billboards, posters, or flyers that leads to a URL. QR codes have two types: Static QR code and Dynamic QR code.

### What is Dynamic QR Code?

Dynamic QR Code is an editable QR code which enables you to redirect the URL to another URL even after printing. Since you are redirecting the URL you can capture and store precious user data.

# USAGE

## Setup

Requires Node.js 22.13 or newer (it uses the built-in `node:sqlite`). The only dependency is `qrcode`.

### 1. Clone the repo and install dependencies
```
git clone https://github.com/mhrsntrk/qroxy.git
cd qroxy
npm install
```

### 2. Configure (optional)
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5050` | HTTP port |
| `BASE_URL` | `http://localhost:5050` | Public origin used in generated short URLs |
| `DB_PATH` | `./data/qroxy.db` | SQLite file, created on first run |

### 3. Run the project
```
npm run dev     # restarts on change
npm test        # API tests
```

## Example Requests

### 1. /generate
```
POST /generate HTTP/1.1
Content-Type: application/json; charset=utf-8
Host: qroxy.dev.mhrsntrk.com

{"generationTarget":"https://mhrsntrk.com/","generationName":"Mahir Senturk","generationEmail":"m@mhrsntrk.com"}
```

Response `201`: `{"target": "...", "url": "https://qroxy.dev.mhrsntrk.com/<uuid>", "qr": "data:image/png;base64,..."}`

### 2. /update
```
POST /update HTTP/1.1
Content-Type: application/json; charset=utf-8
Host: qroxy.dev.mhrsntrk.com

{"updateTarget":"https://mhrsntrk.com/","updateUUID":"d55c3310-35a8-11ec-8f24-33733cb50609"}
```

Response `200`: `{"message": "Target URL successfully updated."}`. Errors are `400` with `{"message": "Invalid UUID"}` or `{"message": "Not a valid URL"}`.

### 3. /:uuid
`GET /<uuid>` redirects (`302`) to the current target, or returns `404` for an unknown code.

# DEPLOY

There is a Dockerfile on the repo, you can use it to deploy `qroxy` anywhere you like, I personally use [Caprover](https://caprover.com/). Mount a persistent volume at `/data` so the SQLite database survives redeploys.
