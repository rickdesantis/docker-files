FROM centos:7
LABEL maintainer="riccardobenito.desantis@gmail.com"

# Setting the environment
ENV HOSTNAME centos.rickdesantis.docker.com
ENV USER centos
ENV PASSWORD cent0s
ENV USERHOME /home/centos

RUN useradd -ms /bin/bash --uid 1010 ${USER} && \
    echo ${USER}':'${PASSWORD} | chpasswd && \
    echo 'root:'${PASSWORD} | chpasswd
USER $USER
WORKDIR $USERHOME

# Fake command
CMD tail -f /dev/null

# Build: docker build -t centos ../centos
# Run:   docker run --name=centos centos &
# Bash:  docker exec -it centos bash
# Start: docker start centos
# Stop:  docker stop centos
