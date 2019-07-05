FROM rickdesantis/ubuntu-lxde
LABEL maintainer="riccardobenito.desantis@gmail.com"

# Setting the environment
ENV HOSTNAME firefox.rickdesantis.docker.com

# Update the repos and install all the used packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    firefox && \
    apt-get clean && \
    apt-get autoclean && \
    apt-get autoremove && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Create a link to firefox on the desktop and put it in autostart
WORKDIR ${USERHOME}
RUN cp /usr/share/applications/firefox.desktop Desktop/ && \
    sed 's|%u||' </usr/share/applications/firefox.desktop >.config/autostart/firefox.desktop

# Build: docker build -t firefox ../firefox
# Run:   docker run --name=firefox -p 5901:5901 -p 3389:3389 firefox &
# Bash:  docker exec -it firefox bash
# Start: docker start firefox
# Stop:  docker stop firefox
