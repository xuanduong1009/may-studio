# MÂY Studio: production image (Next.js 16 on Node 22).
#
#   BETTER_AUTH_SECRET=… SEED_ADMIN_PASSWORD=… docker compose up --build    →  http://localhost:3000
#
# Data lives in a SQLite file on the /data volume, created and filled with the sample catalogue on the
# first start (docker/start.sh). For a hosted Turso database, set DATABASE_URL (libsql://…) and
# DATABASE_AUTH_TOKEN instead.

FROM node:22-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The build pre-renders a few pages that read the catalogue, so it gets a throwaway seeded database.
RUN DATABASE_URL=file:/tmp/build.db \
    BETTER_AUTH_SECRET=build-only-secret-never-used-at-runtime \
    SEED_ADMIN_PASSWORD=build-only-password \
    sh -c "npm run setup && npm run build" \
 && rm -f /tmp/build.db

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    DATABASE_URL=file:/data/may.db
# dev dependencies stay: the first start runs drizzle-kit and the seed script
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 3000
CMD ["sh", "docker/start.sh"]
