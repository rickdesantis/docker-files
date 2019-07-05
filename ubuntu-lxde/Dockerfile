FROM ubuntu:18.04
LABEL maintainer="riccardobenito.desantis@gmail.com"

# Setting the environment
ENV HOSTNAME ubuntu.rickdesantis.docker.com
ENV USER ubuntu
ENV PASSWORD ubuntu
ENV USERHOME  /home/ubuntu
ENV GEOMETRY 1440x900
ENV DEBIAN_FRONTEND noninteractive

# Update the repos and install all the used packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    xorg \
    lxde-core \
    lxde-common \
    lxsession \
    lxsession-logout \
    openbox \
    xterm \
    lxterminal \
    lxde-icon-theme \
    gtk2-engines \
    dmz-cursor-theme \
    lxappearance \
    lxappearance-obconf \
    tightvncserver \
    xrdp && \
    apt-get clean && \
    apt-get autoclean && \
    apt-get autoremove && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN useradd -ms /bin/bash --uid 1010 ${USER} && \
    echo ${USER}':'${PASSWORD} | chpasswd && \
    echo 'root:'${PASSWORD} | chpasswd

# Set the RDP server
RUN sed 's|\[xrdp1\]|\[xrdp1000\]\nname=VNC-Session\nlib=libvnc.so\nip=localhost\nport=5901\nusername=na\npassword=ask\n\n\[xrdp1\]|' </etc/xrdp/xrdp.ini >/etc/xrdp/xrdp-new.ini && \
    mv /etc/xrdp/xrdp-new.ini /etc/xrdp/xrdp.ini && \
    service xrdp start

# Create some useful folders
USER $USER
WORKDIR ${USERHOME}
RUN echo $PASSWORD > password.txt && \
    cat password.txt password.txt | vncpasswd && \
    rm password.txt && \
    touch .Xresources && \
    touch .Xauthority && \
    mkdir Desktop && \
    mkdir -p .config/autostart

# Starts the VNC server
EXPOSE 5901
EXPOSE 3389
# CMD service xrdp start && vncserver :1 -desktop LXDE -geometry $GEOMETRY -depth 24 -dpi 100 && tail -F $USERHOME/.vnc/*.log
CMD vncserver :1 -desktop LXDE -geometry $GEOMETRY -depth 24 -dpi 100 && tail -F $USERHOME/.vnc/*.log

# Build: docker build -t lxde ../ubuntu-lxde
# Run:   docker run --name=lxde -p 5901:5901 -p 3389:3389 lxde &
# Bash:  docker exec -it lxde bash
# Start: docker start lxde
# Stop:  docker stop lxde
