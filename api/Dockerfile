# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ccommiss <ccommiss@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2022/06/14 15:35:26 by atrouill          #+#    #+#              #
#    Updated: 2022/07/05 10:08:56 by ccommiss         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#
# Dev image
#
FROM	node:current as dev


WORKDIR	/api/
COPY	./entrypoint.sh ./entrypoint.sh

CMD ["sh", "/api/entrypoint.sh"]

FROM	node:alpine as builder

COPY	. /api/
WORKDIR /api/

RUN npm install
RUN npm run build


FROM	node:alpine as prod

COPY	. /api/
COPY	--from=builder /api/dist /api/dist
WORKDIR /api/
RUN		npm ci --omit=dev

CMD		["npm", "run", "start:prod"]
