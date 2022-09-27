# FT_TRANSCENDENCE

## First run

You can use `env_conf.sh` for automatic setup

For the first startup, you need to set up :
- An `.env` file:

```
# DOCKER CONFIG
DOCKER_SOCK=(/var/run/docker.sock) (for 42Linux use : ${DOCKET_HOST:7})

TZ="Europe/Paris"

# DB CONFIG
DB_PATH=<path> (./private/db) (for 42Linux use: ${HOME}/goinfre/db)
POSTGRES_USER=<user>
POSTGRES_PASSWORD=<db_password>
POSTGRES_DB=<user> // Should be the same as user


# PGADMIN
PGADMIN_PATH=(./private/pgadmin) (for 42Linux use: ${HOME}/goinfre/pgadmin)
PGADMIN_DEFAULT_EMAIL=<mail>
PGADMIN_DEFAULT_PASSWORD=<password>
GUNICORN_ACCESS_LOGFILE=/dev/null

# OAuth42
API_42_UID=<client_id>
API_42_SECRET=<client_secret>
API_42_CALLBACK=http://localhost:8080/api/auth/42/callback

# JWT
JWT_SECRET=<WhatEverYouWant>

# 2FA
TWO_FACTOR_AUTHENTICATION_APP_NAME=TRANSCENDANCE
```

And give right to pgadmin :
```
chown 5050:5050 (./private/pgadmin) (for 42Linux use: ${HOME}/goinfre/pgadmin)
```

## Drop the DB at 42
```
docker run -it -v /goinfre/${USER}:/data ubuntu
rm -rf data/db
exit
```

## Launch project
```
docker-compose up --build
```

You can build in debug, it will add some containers like pgadmin :

```
docker-compose --profile debug up --build
```
