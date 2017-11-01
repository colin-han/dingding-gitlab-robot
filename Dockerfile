FROM node:8

ADD . /code

WORKDIR /code

RUN yarn

CMD yarn start