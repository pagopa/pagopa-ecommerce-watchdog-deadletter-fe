# Build Stage
FROM node:22-alpine AS build
WORKDIR /app

ARG NEXT_PUBLIC_ECOMMERCE_WATCHDOG_SERVICE_API_HOST
ARG NEXT_PUBLIC_ECOMMERCE_WATCHDOG_AUTH_API_HOST

ENV NEXT_PUBLIC_ECOMMERCE_WATCHDOG_SERVICE_API_HOST=$NEXT_PUBLIC_ECOMMERCE_WATCHDOG_SERVICE_API_HOST
ENV NEXT_PUBLIC_ECOMMERCE_WATCHDOG_AUTH_API_HOST=$NEXT_PUBLIC_ECOMMERCE_WATCHDOG_AUTH_API_HOST

COPY package*.json ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Production Stage
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
