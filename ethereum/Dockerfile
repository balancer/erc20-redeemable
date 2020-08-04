FROM node:10.16.3-alpine
MAINTAINER Greg Taschuk
WORKDIR /usr/src/app
RUN apk add --no-cache git python make g++

COPY package.json .
COPY yarn.lock .
RUN yarn install

COPY . .

CMD ["npm", "run", "deploy-contracts-from-docker"]
