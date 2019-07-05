FROM centos:7
LABEL maintainer="riccardobenito.desantis@gmail.com"

# Setting the environment
ENV HOSTNAME centos.rickdesantis.docker.com
ENV USER centos
ENV PASSWORD cent0s
ENV USERHOME /home/centos
ENV GEOMETRY 1440x900

# Update the repos and install all the used packages
RUN yum update -y -q && \
    yum install -y -q epel-release tigervnc-server && \
    yum groupinstall -y -q "X Window system" "Xfce"

RUN useradd -ms /bin/bash --uid 1010 ${USER} && \
    echo ${USER}':'${PASSWORD} | chpasswd && \
    echo 'root:'${PASSWORD} | chpasswd

RUN echo "exec /usr/bin/xfce4-session" > /etc/X11/xinit/xinitrc

# Create some useful folders
USER $USER
WORKDIR ${USERHOME}
RUN echo $PASSWORD > password.txt && \
    cat password.txt password.txt | vncpasswd && \
    rm password.txt && \
    mkdir Desktop && \
    mkdir -p .config/autostart

# Starts the VNC server
EXPOSE 5901
CMD vncserver :1 -desktop XFCE -geometry $GEOMETRY -depth 24 -dpi 100 && tail -F ${USERHOME}/.vnc/*.log

# Build: docker build -t centos ../centos
# Run:   docker run --name=centos centos &
# Bash:  docker exec -it centos bash
# Start: docker start centos
# Stop:  docker stop centos
