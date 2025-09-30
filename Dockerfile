# Build Stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Production Stage
FROM node:22-alpine AS production
WORKDIR /app

COPY --from=build /app/out ./out
RUN yarn global add serve@14.2.5

EXPOSE 3000

CMD ["serve", "-s", "out"]
