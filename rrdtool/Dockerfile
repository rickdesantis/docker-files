FROM ubuntu:latest
MAINTAINER Riccardo B. Desantis <riccardobenito.desantis@gmail.com>

# Setting the environment
ENV HOSTNAME rrdtool.rickdesantis.docker.com
ENV USERHOME  /root
ENV DEBIAN_FRONTEND noninteractive
ENV USER root
ENV NAME docker
ENV PASSWORD docker

# Update the repos and install all the used packages
RUN apt-get update && \
    (apt-get install -y --no-install-recommends curl build-essential libglib2.0-dev libxml2-dev libpango1.0-dev openssh-server groff; \
    while [ $? -ne 0 ]; do apt-get install -y --no-install-recommends curl build-essential libglib2.0-dev libxml2-dev libpango1.0-dev openssh-server groff; done) && \
    apt-get autoclean && \
    apt-get autoremove && \
    rm -rf /var/lib/apt/lists/*

# Download and install RDDTool
WORKDIR $USERHOME
RUN mkdir .ssh && \
    mkdir /var/run/sshd && \
    echo 'root:'${PASSWORD} | chpasswd && \
    sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    curl http://oss.oetiker.ch/rrdtool/pub/rrdtool-1.6.0.tar.gz -OL && \
    tar zxf rrdtool-1.6.0.tar.gz && \
    mkdir -p /opt/rrdtool && \
    cd rrdtool-1.6.0 && ./configure --prefix=/opt/rrdtool && make && make install

WORKDIR /opt/rrdtool

# Starts the SSH server
EXPOSE 22
CMD /usr/sbin/sshd -D

# Build: docker build -t rrdtool ../rrdtool
# Run:   docker run --name=rrdtool -p 22:22 rrdtool &
# Bash:  docker exec -it rrdtool bash
# Start: docker start rrdtool
# Stop:  docker stop rrdtool
