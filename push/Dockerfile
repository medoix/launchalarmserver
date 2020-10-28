FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy APN Auth Key
COPY AuthKey_VE47L9KB2N.p8 /usr/src/app/

# Install app deps
COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 8080
CMD [ "node", "/usr/src/app/server.js" ]
