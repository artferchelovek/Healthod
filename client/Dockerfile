# Шаг 1: Сборка фронтенда
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Прописываем относительный путь для API, чтобы запросы шли на тот же домен в /api
RUN echo "VITE_API_URL=/api" > .env
RUN npm run build

# Шаг 2: Раздача статики через Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Копируем конфиг с поддержкой роутинга React (try_files)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
