FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=server-build /app/server/dist ./dist

WORKDIR /app
COPY --from=client-build /app/client/dist ./client/dist
COPY data ./data
COPY data ./default-data
COPY videos ./videos

WORKDIR /app/server
EXPOSE 3001
CMD ["node", "dist/server.js"]
