#!/bin/bash

function	check_env_file() {
	if [ -f ".env" ]; then
		read -p "Env file already exist, do you want to erase it ? " -n 1 -r
		echo
		if [[ ${REPLY} =~ ^[Yy]$ ]]; then
			rm -rf .env
		else
			exit 0
		fi
	fi
}

function	check_fortytwo() {
	local home_path=${HOME}
	if [[ ${home_path} == /mnt/nfs/homes/* ]]; then
		return 0
	fi
	return 1
}

function	read_42api_secret() {
	echo "You should register a new app on 42 intra (https://profile.intra.42.fr/oauth/applications/new)"
	echo "If this is already done, you must have client UID and Secret (https://profile.intra.42.fr/oauth/applications)"
	read -p "App UID given by 42: " -r
	UID42=${REPLY}; unset REPLY
	read -p "App Secret given by 42: " -r
	SECRET42=${REPLY}; unset REPLY
}

function	build_fortytwo() {
	echo "FortyTwo iMac detected."
	read -r -d '' "ENV_VAR" <<- EOM
		# DOCKER CONFIG
		DOCKER_SOCK=${DOCKER_HOST:7}

		TZ="Europe/Paris"

		# DB CONFIG
		DB_PATH=${HOME}/goinfre/db
		POSTGRES_USER=${USER}
		POSTGRES_PASSWORD=$(openssl rand -hex 20)
		POSTGRES_DB=${USER}

		# PG ADMIN
		PGADMIN_PATH=${HOME}/goinfre/pgadmin
		PGADMIN_DEFAULT_EMAIL=${USER}@student.42.fr
		PGADMIN_DEFAULT_PASSWORD=password_nul
		GUNICORN_ACCESS_LOGFILE=/dev/null

		# OAUTH42
		API_42_UID=${UID42}
		API_42_SECRET=${SECRET42}
		API_42_CALLBACK=http://localhost:8080/api/auth/42/callback

		# JWT
		JWT_SECRET=$(openssl rand -hex 32)

		# 2FA
		TWO_FACTOR_AUTHENTICATION_APP_NAME=TRANSCENDANCE
	EOM

}

function	build_other() {
	echo "This is not a fortytwo iMac. Enjoy TDM or remote !"
	read -r -d '' "ENV_VAR" <<- EOM
		# DOCKER CONFIG
		DOCKER_SOCK=/var/run/docker.sock

		TZ="Europe/Paris"

		# DB CONFIG
		DB_PATH=./private/db
		POSTGRES_USER=${USER}
		POSTGRES_PASSWORD=$(openssl rand -hex 20)
		POSTGRES_DB=${USER}

		# PG ADMIN
		PGADMIN_PATH=./private/pgadmin
		PGADMIN_DEFAULT_EMAIL=${USER}@mail.fr
		PGADMIN_DEFAULT_PASSWORD=password_nul
		GUNICORN_ACCESS_LOGFILE=/dev/null

		# OAUTH42
		API_42_UID=${UID42}
		API_42_SECRET=${SECRET42}
		API_42_CALLBACK=http://localhost:8080/api/auth/42/callback

		# JWT
		JWT_SECRET=$(openssl rand -hex 32)

		# 2FA
		TWO_FACTOR_AUTHENTICATION_APP_NAME=TRANSCENDANCE
	EOM

}

read_42api_secret

if check_fortytwo; then
	build_fortytwo
else
	build_other
fi

echo "${ENV_VAR}" > .env
