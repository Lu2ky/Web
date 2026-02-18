FROM node:latest

WORKDIR /webserver
COPY . .
RUN touch .env
RUN npm install
RUN npm install -g serve
RUN npm run build
CMD ["serve", "-s", "dist", "-l", "5173"]
