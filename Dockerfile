# Build Stage
FROM node:22.13.1-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .
RUN yarn build

# Production Stage
FROM nginx:stable-alpine AS production
COPY --from=build /app/out /usr/share/nginx/html
USER root
RUN sed -i 's/listen\s\+80;/listen 8080;/g' /etc/nginx/conf.d/default.conf
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    mkdir -p /var/run && \
    chown -R nginx:nginx /var/run
USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]



