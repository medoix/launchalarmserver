# Launch Alarm Server

Launch Alarm Server is the SEO & API for the Launch Alarm App.

  - Allows users to read about the app and find links to download the app
  - Has the entire API under /v1 that the mobile app's use to register/login etc

## Deploying ECS Container Updates
When trying to delete a service that already is scaled out and has running tasks you need to scale it down to ZERO before you can delete it
```bash
aws ecs update-service --service launchalarmserver --desired-count 0 --cluster launchalarm --profile personal
```

After making code changes run the following to update the repo in AWS
```bash
aws ecr get-login --region ap-southeast-2
```
Run the login command returned
Build docker image
```bash
docker build -t launchalarmserver .
```
Tag image as latest
```bash
docker tag launchalarmserver:latest 559830431227.dkr.ecr.ap-southeast-2.amazonaws.com/launchalarmserver:latest
```
Push up to AWS Repo
```bash
docker push 559830431227.dkr.ecr.ap-southeast-2.amazonaws.com/launchalarmserver:latest
```

From the launchalarm cluster in the AWS Console, select the "Tasks" tab and STOP the two launchalarmserver tasks for two new tasks to be created with the updates pushed.

**Server Settings**
