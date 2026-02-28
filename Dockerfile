# Stage 1: Build Angular app
FROM node:22-alpine AS build

ARG API_BASE_URL=""
ARG WS_BASE_URL=""

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Inject server URLs into production environment before building
RUN sed -i "s|\${API_BASE_URL}|${API_BASE_URL}|g" src/environments/environment.ts && \
    sed -i "s|\${WS_BASE_URL}|${WS_BASE_URL}|g" src/environments/environment.ts

RUN npx ng build --configuration production

# Stage 2: Serve with nginx
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/sales-copilot-fe/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
