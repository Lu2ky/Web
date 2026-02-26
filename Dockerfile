FROM node:25-alpine AS builder


WORKDIR /app
COPY . .
RUN touch .env
RUN npm install
RUN npm install -g serve
RUN npm run build

FROM alpine:3.23.3
WORKDIR /app
COPY --from=builder /app/dist /usr/share/nginx/html
CMD ["nginx", "-g" , "daemon off;"]
