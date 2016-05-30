FROM ubuntu:16.04
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
    xrdp \
    firefox && \
    apt-get autoclean && \
    apt-get autoremove && \
    rm -rf /var/lib/apt/lists/*

# Create a link to firefox on the desktop and put it in autostart
WORKDIR ${USERHOME}
RUN mkdir Desktop && \
    mkdir -p .config/autostart && \
    cp /usr/share/applications/firefox.desktop Desktop/ && \
    cp /usr/share/applications/firefox.desktop .config/autostart/

# Set the VNC server
RUN echo "docker" > password.txt && \
    cat password.txt password.txt | vncpasswd && \
    rm password.txt

# Set the RDP server
RUN sed 's|\[xrdp1\]|\[xrdp1000\]\nname=VNC-Session\nlib=libvnc.so\nip=localhost\nport=5901\nusername=na\npassword=ask\n\n\[xrdp1\]|' </etc/xrdp/xrdp.ini >/etc/xrdp/xrdp-new.ini && \
    mv /etc/xrdp/xrdp-new.ini /etc/xrdp/xrdp.ini

# Starts the VNC server
EXPOSE 5901
EXPOSE 3389
CMD service xrdp start && vncserver :1 -desktop Firefox -geometry $GEOMETRY -depth 24 -dpi 100 && tail -F /root/.vnc/*.log
