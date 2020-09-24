FROM node:12.18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY dist/. /usr/src/app/dist

EXPOSE 8080

CMD npm run-script start:prod