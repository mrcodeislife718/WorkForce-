# Persistent Workforce API + employee job runner. The database and secrets are external.
FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --chown=node:node backend/ ./
USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>{if(!r.ok) process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
