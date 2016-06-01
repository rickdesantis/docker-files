FROM rickdesantis/lxde
MAINTAINER Riccardo B. Desantis <riccardobenito.desantis@gmail.com>

# Update the repos and install all the used packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    firefox && \
    apt-get autoclean && \
    apt-get autoremove && \
    rm -rf /var/lib/apt/lists/*

# Create a link to firefox on the desktop and put it in autostart
WORKDIR ${USERHOME}
RUN cp /usr/share/applications/firefox.desktop Desktop/ && \
    sed 's|%u||' </usr/share/applications/firefox.desktop >.config/autostart/firefox.desktop

# Starts the VNC server
EXPOSE 5901
EXPOSE 3389
CMD service xrdp start && vncserver :1 -desktop Firefox -geometry $GEOMETRY -depth 24 -dpi 100 && tail -F /root/.vnc/*.log

# Build: docker build -t firefox1 ../firefox
# Run:   docker run --name=firefox1 firefox1 &
# Bash:  docker exec -it firefox1 bash
# Start: docker start firefox1
# Stop:  docker stop firefox1
