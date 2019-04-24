#!/bin/bash

set -e

REMOTE_USERNAME="steven"
REMOTE_HOST="h.medoix.com"
IMAGE_REPOSITORY="launchalarmpush"

#SERVER_URL="launchalarm.com,www.launchalarm.com"
#SERVER_PORT="80"

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
--name ${IMAGE_REPOSITORY} \
-e NODE_ENV=production \
$IMAGE_REPOSITORY:latest

exit
EOF
