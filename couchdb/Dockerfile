FROM couchdb:latest
MAINTAINER Riccardo B. Desantis <riccardobenito.desantis@gmail.com>

# Setting the environment
ENV HOSTNAME couchdb.rickdesantis.docker.com
ENV USERHOME  /root
ENV DEBIAN_FRONTEND noninteractive
ENV USER root
ENV NAME docker
ENV PASSWORD docker

RUN echo $NAME=$PASSWORD >> /usr/local/etc/couchdb/local.ini

# Build: docker build -t couchdb1 ../couchdb
# Run:   docker run --name=couchdb1  -p 5984:5984 couchdb1 &
# Bash:  docker exec -it couchdb1 bash
# Start: docker start couchdb1
# Stop:  docker stop couchdb1
