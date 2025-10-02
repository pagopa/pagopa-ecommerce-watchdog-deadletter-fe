# Build Stage
FROM node:22.13.1-alpine@sha256:e2b39f7b64281324929257d0f8004fb6cb4bf0fdfb9aa8cedb235a766aec31da AS build
WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .
RUN yarn build

# Production Stage
FROM nginx:stable-alpine@sha256:8f2bcf97c473dfe311e79a510ee540ee02e28ce1e6a64e1ef89bfad32574ef10 AS production
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]