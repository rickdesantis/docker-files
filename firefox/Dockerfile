FROM ubuntu:14.04
MAINTAINER Riccardo B. Desantis <riccardobenito.desantis@polimi.it>

# Setting the environment
ENV USERHOME  /root
ENV DEBIAN_FRONTEND noninteractive
ENV USER root
ENV GEOMETRY 1440x900

# Update the repos and install all the used packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    xorg \
    lxde-core \
    lxterminal \
    lxde-icon-theme \
    gtk2-engines \
    dmz-cursor-theme \
    tightvncserver \
    default-jdk \
    xrdp \
    firefox && \
    apt-get autoclean && \
    apt-get autoremove && \
    rm -rf /var/lib/apt/lists/*

# Create a link to firefox on the desktop
WORKDIR ${USERHOME}
RUN mkdir Desktop && \
    printf "%b\n" '#!'"`which env` xdg-open\n\n[Desktop Entry]\nExec=/usr/bin/firefox\nIcon=/root/eclipse_palladio/icon.xpm\nTerminal=false\nType=Application\nPath=/root/eclipse_palladio/" > Desktop/Mozilla\ Firefox.desktop

# Set the VNC server
RUN echo "firefox" > password.txt && \
    cat password.txt password.txt | vncpasswd && \
    rm password.txt

# Set the RDP server
RUN sed 's|\[xrdp1\]|\[xrdp1000\]\nname=VNC-Session\nlib=libvnc.so\nip=localhost\nport=5901\nusername=na\npassword=ask\n\n\[xrdp1\]|' </etc/xrdp/xrdp.ini >/etc/xrdp/xrdp-new.ini && \
    mv /etc/xrdp/xrdp-new.ini /etc/xrdp/xrdp.ini

# Starts the VNC server
EXPOSE 5901
EXPOSE 3389
CMD service xrdp start && vncserver :1 -desktop Firefox -geometry $GEOMETRY -depth 24 -dpi 100 && tail -F /root/.vnc/*.log
