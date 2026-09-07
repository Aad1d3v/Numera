# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Fail fast with a clear message if the frontend entry point is missing from
# the build context (the classic cause is building from an incomplete repo or
# upload that lost the src/ directory). Without this, Vite fails later with:
#   Rollup failed to resolve import "/src/main.tsx" from "/app/index.html"
RUN test -f src/main.tsx || (echo 'ERROR: src/main.tsx is missing from the Docker build context. Push/upload the COMPLETE project including the src/ directory, then rebuild.' && exit 1)
RUN npm run build

# ---------- runtime ----------
# The server is bundled to a single ESM file by esbuild, so the
# runtime image needs no node_modules at all.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "dist-server/index.cjs"]
