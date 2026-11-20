# Small, production-style image
FROM node:20-alpine

WORKDIR /app
COPY app/package.json ./
COPY app/server.js ./
COPY app/public ./public

# Don't run as root inside the container
USER node

ENV PORT=3000
EXPOSE 3000

# Docker checks this every 15s; marks the container "unhealthy" if it fails
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
