FROM node:25-alpine AS builder


WORKDIR /app
COPY . .
RUN npm install
RUN npm install -g serve
RUN npm run build

FROM nginx:alpine
WORKDIR /app
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g" , "daemon off;"]
