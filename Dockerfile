FROM node:24-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY *.js ./

ENV NODE_ENV=production \
    PORT=5050 \
    DB_PATH=/data/qroxy.db \
    NODE_NO_WARNINGS=1
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 5050

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:${PORT}/healthz || exit 1

CMD [ "node", "server.js" ]
