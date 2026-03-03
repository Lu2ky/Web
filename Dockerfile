FROM node:25-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
RUN touch .env
EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
