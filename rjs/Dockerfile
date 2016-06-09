FROM ubuntu:16.04
MAINTAINER Riccardo B. Desantis <riccardobenito.desantis@gmail.com>

# Setting the environment
ENV HOSTNAME rjs.rickdesantis.docker.com
ENV USERHOME  /root
ENV DEBIAN_FRONTEND noninteractive
ENV USER root
ENV PORT 80
ENV NAME docker
ENV PASSWORD docker
ENV CRAN_MIRROR http://cran.r-project.org
ENV R_SITE_LIBRARY /usr/local/lib/R/site-library/

# Update the repos and install all the used packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    r-base \
    r-base-dev \
    curl && \
    curl -sL https://deb.nodesource.com/setup_6.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get autoclean && \
    apt-get autoremove && \
    rm -rf /var/lib/apt/lists/*

# Fixes Node.JS on Docker
RUN cd $(npm root -g)/npm  && \
    npm install fs-extra && \
    sed -i -e s/graceful-fs/fs-extra/ -e s/fs.rename/fs.move/ ./lib/utils/rename.js

# Copy the Node.JS application and install the dependencies
COPY node $USERHOME/node
WORKDIR $USERHOME/node
RUN npm install

# Set the default CRAN mirror
RUN printf "%b\n" "local({\n\tr <- getOption(\"repos\")\n\tr[\"CRAN\"] <- \"$CRAN_MIRROR\"\n\toptions(repos = r)\n})" > /etc/R/Rprofile.site

# Starts the Node.JS server
EXPOSE 80
CMD nodejs app.js $NAME $PASSWORD $R_SITE_LIBRARY $CRAN_MIRROR | tee app.log

# Build: docker build -t rjs1 ../rjs
# Run:   docker run --name=rjs1 -p 80:80 rjs1 &
# Bash:  docker exec -it rjs1 bash
# Start: docker start rjs1
# Stop:  docker stop rjs1
