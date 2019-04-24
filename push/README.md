# Launch Alarm Push

Launch Alarm Push is a service to send push notifications for the Launch Alarm App.

  - Obtains next launch information
  - Checks every X mins as per cron setting at top of server.js
  - If time falls inside of FIRST or SECOND time periods as also set up the top of server.js then pushes one Push for that period

## Deploying ECS Container Updates
When trying to delete a service that already is scaled out and has running tasks you need to scale it down to ZERO before you can delete it
```bash
aws ecs update-service --service launchalarmpush --desired-count 0 --cluster launchalarm --profile personal
```
After making code changes run the following to update the repo in AWS
```bash
aws ecr get-login --profile personal --region ap-southeast-2
```
Run the login command returned
Build docker image
```bash
docker build -t launchalarmpush .
```
Tag image as latest
```bash
docker tag launchalarmpush:latest 559830431227.dkr.ecr.ap-southeast-2.amazonaws.com/launchalarmpush:latest
```
Push up to AWS Repo
```bash
docker push 559830431227.dkr.ecr.ap-southeast-2.amazonaws.com/launchalarmpush:latest
```
Increase desired count back to 1
```bash
aws ecs update-service --service launchalarmpush --desired-count 1 --cluster launchalarm --profile personal
```

From the launchalarm cluster in the AWS Console, select the "Tasks" tab and STOP the launchalarmpush task for a new task to be created with the updates pushed.

**Server Settings**

> var firsttimeafter = -31; //greater than -30+ etc
> var firsttimebefore = -15; //less than -16+ etc
> var secondtimeafter = -16; //greater than -15+ etc
> var secondtimebefore = 0; //less than -1+ etc
> var cronopts = '*/1 * * * *';

There is also GCM and APN settings but these are straight forward to GCM/APN situations.
