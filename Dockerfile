FROM node:12.18-alpine
WORKDIR /app
COPY ./package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:12.18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY --from=0 /app/dist/. /usr/src/app/dist

EXPOSE 8080

CMD npm run-script start:prod