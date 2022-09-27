FROM	node:alpine as dev

WORKDIR	/frontend/
COPY	./entrypoint.sh ./entrypoint.sh

CMD		["ash", "/frontend/entrypoint.sh"]

FROM	node:alpine as builder

COPY	. /frontend
WORKDIR	/frontend

RUN		npm ci --omit=dev
RUN 	npm run build

FROM	caddy:alpine as prod

COPY	--from=builder /frontend/build /site
