#!/bin/bash

set -e

REMOTE_USERNAME="steven"
REMOTE_HOST="h.medoix.com"
IMAGE_REPOSITORY="launchalarmserver"

SERVER_URL="launchalarm.com,www.launchalarm.com"
SERVER_PORT="80"

function upload_image_if_needed {
	if [[ $(ssh $REMOTE_USERNAME@$REMOTE_HOST "docker images $IMAGE_REPOSITORY | grep $1 | tr -s ' ' | cut -d ' ' -f 3") != $(docker images $IMAGE_REPOSITORY | grep $1 | tr -s ' ' | cut -d ' ' -f 3) ]]
	then
		echo "$1 image changed, updating..."
		docker save $IMAGE_REPOSITORY:$1 | bzip2 | pv | ssh $REMOTE_USERNAME@$REMOTE_HOST 'bunzip2 | docker load'
	else
		echo "$1 image did not change"
	fi
}

function build_image {
	docker build -t $IMAGE_REPOSITORY:$1 $2
}

build_image latest .
upload_image_if_needed latest

ssh -tt $REMOTE_USERNAME@$REMOTE_HOST << EOF
docker rm -f ${IMAGE_REPOSITORY} || true
docker run \
-d \
-p 8020:8020 \
--name ${IMAGE_REPOSITORY} \
-e PORT=8020 \
-e VIRTUAL_HOST=${SERVER_URL} \
-e VIRTUAL_PORT=${SERVER_PORT} \
-e PROXY_LOCATION=${IMAGE_REPOSITORY} \
-e MONGODB_URI=mongodb://heroku_5xqvl7l4:rdb6rpdl9nefvcqv5acniihjqa@ds019638.mlab.com:19638/heroku_5xqvl7l4 \
-e NODE_ENV=production \
$IMAGE_REPOSITORY:latest

exit
EOF
