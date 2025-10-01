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

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
