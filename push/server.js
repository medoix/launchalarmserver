var express = require('express');
var schedule = require('node-schedule');
var request = require('request');
var moment = require('moment');
var path = require('path');

var sendPush = function(launchmsg){
  //log the messaage that is going to be sent as all needed criteria are met now.
  var pushnumber = '';
  if(!firstpushsent){
    pushnumber = 'First';
  } else if(!secondpushsent){
    pushnumber = 'Second';
  }
  console.log(pushnumber+' Push - Launch Message: ' + launchmsg);
  request(deviceOptions, function (error, response, body) { //# PROD
  // request('http://localhost:8080/test-device', function (error, response, body) { //# TEST
    //check response was successful
    if (!error && response.statusCode == 200) {
      var obj = JSON.parse(body);
      var device = obj.devicelist;
      // console.log('Device Details: ' + JSON.stringify(device, ['devId', 'type']));
      for(d in device){
        //console.log('Device ' + d + ' Type: ' + JSON.stringify(device[d].type));
        //console.log('Device ' + d + ' ID: ' + JSON.stringify(device[d].devId));
        apnmessage.alert = launchmsg;
        gcmmessage.addData('message',launchmsg);
        if(device[d].type == "ios"){
          // apnmessage.alert = launchmsg;
          apndevices.push(device[d].devId);
          console.log('iOS Queued: ' + device[d].devId);
        } else if(device[d].type == "android"){
          // gcmmessage.addData('message',launchmsg);
          gcmdevices.push(device[d].devId);
          console.log('Android Queued: ' + device[d].devId);
        }
      }
      // outside device loop as APN can push to an array apndevices
      if(apndevices.length > 0){
        console.log(`iOS Sending: ${apnmessage.compile()} to ${apndevices}`);
        apnConnection.send(apnmessage, apndevices).then( result => {
          console.log('iOS Sent: ' + result.sent.length);
          console.log('iOS Failed: '+ result.failed.length);
            if(result.failed.length > 0){
              console.log(result.failed);
            }
            console.log('iOS Notifications - Shutting Down');
            apnConnection.shutdown();
            console.log('Clearing iOS Message');
            apnmessage.alert = '';
        });
      }
      // outside device loop as GCM can push to an array gcmdevices
      if(gcmdevices.length > 0){
        console.log('Android Sending: '+gcmmessage+' to '+gcmdevices);
        gcmsender.send(gcmmessage, { registrationTokens: gcmdevices }, function (err, response) {
          if (err) console.log(err);
          else console.log(response);
          console.log('Clearing Android Message');
          gcmmessage.addData('message','');
        });
      }
    } else {
      console.log('Error retrieving device details - ' + error);
    }
  })
}

var LaunchAlarmPush = function() {

    //  Scope.
    var self = this;

    // Set up server IP address and port # using env variables/defaults.
    self.setupVariables = function() {
      console.log('Setting up variables..')
      //  Set the environment variables we need.
      self.port = process.env.PORT || 8080;

      // Service Settings
      firsttimeafter = -31; //greater than -30+ etc
      firsttimebefore = -15; //less than -16+ etc
      secondtimeafter = -16; //greater than -15+ etc
      secondtimebefore = 0; //less than -1+ etc
      cronopts = '*/1 * * * *'; //# PROD
      launchname = '';
      self.firstpushsent;
      self.secondpushsent;

      // GCM Settings
      var gcm = require('node-gcm');
      gcmmessage = new gcm.Message();
      gcmsender = new gcm.Sender('AIzaSyCQToa1DqldnNH7Lm0RKJl51Yvuj5P-c-w');
      gcmdevices = [];
      gcmmessage.addData('title','Launch Alarm');
      gcmmessage.addData('msgcnt','1'); // Shows up in the notification in the status bar when you drag it down by the time
      gcmmessage.timeToLive = 900; // 15 Mins - Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.
      //gcmmessage.addData('content-available', '1');
      //gcmmessage.addData('soundname','beep.wav'); //Sound to play upon notification receipt - put in the www folder in app - may not work
      //gcmmessage.collapseKey = 'demo';
      //gcmmessage.delayWhileIdle = true; //Default is false
      // GCM End Settings

      // APN Settings
      var apn = require('apn');
      var options = {
        token: {
          key: "AuthKey_VE47L9KB2N.p8",
          keyId: "VE47L9KB2N",
          teamId: "H37Y55BC9J"
        },
        // set to false for DEV Gateway
        production: true
      };
      apnConnection = new apn.Provider(options);
      apnmessage = new apn.Notification();
      apndevices = [];
      apnmessage.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
      apnmessage.badge = 1;
      apnmessage.sound = "ping.aiff";
      apnmessage.payload = {'messageFrom': 'Launch Alarm'};
      apnmessage.topic = "com.launchalarm.app";
      // APN End Settings

      launchOptions = {
        url: 'https://ll.thespacedevs.com/2.0.0/launch/upcoming/?format=json&status=1&limit=1', //# PROD
        headers: {
          'User-Agent': 'javascript' // Needed for this API otherwise 403 returns.
        }
      };
      
      deviceOptions = {
        url: 'https://launchalarm.com/v1/device/devices', //# PROD`
        headers: {
          'User-Agent': 'javascript' // Not really needed for this API.
        }
      };
    };

    // Create the routing table entries + handlers for the application.
    self.createRoutes = function() {
      console.log('Setting up routes..')
      self.routes = { };

      self.routes['/'] = function(req, res) {
          res.setHeader('Content-Type', 'text/html');
          res.send("<html><head><title>Launch Alarm Push</title></head><body><p><h2>Launch Alarm Push</h2></p><p>yup, i am running...</p></body></html>");
      };
      self.routes['/test-device'] = function(req, res) { // TEST
          res.setHeader('Content-Type', 'text/plain');
          res.sendFile(path.join(__dirname + '/test-device.json'));
      };
      self.routes['/test-launch'] = function(req, res) { // TEST
          res.setHeader('Content-Type', 'text/plain');
          res.sendFile(path.join(__dirname + '/test-launch.json'));
      };
    };

    // Initialize the server (express) and create the routes and register the handlers.
    self.initializeServer = function() {
      console.log('Starting Launch Alarm Push..')
      self.createRoutes();
      self.app = express();
      //  Add handlers for the app (from the routes).
      for (var r in self.routes) {
          self.app.get(r, self.routes[r]);
      }
    };

    // Initializes the application.
    self.initialize = function() {
        self.setupVariables();
        // Create the express server and routes.
        self.initializeServer();
    };

    // Start the server
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, function() {
          console.log('Launch Alarm Push server started on port ' + self.port + '...');
          // sendPush('Notice: I am aware of some issues with push notifications not being sent and a fix is in progress.')
        });
    };

};

var lapp = new LaunchAlarmPush();
lapp.initialize();
lapp.start();

// Run the below every X mins, as set above.
var j = schedule.scheduleJob(cronopts, function(){
  request(launchOptions, function (error, response, body) { //# PROD
  // request('http://localhost:8080/test-launch', function (error, response, body) { //# TEST
    if (!error && response.statusCode == 200) { //# PROD
    //if (!error) { //# TEST
      var obj = JSON.parse(body);
      var launch = obj.results;
      // Below var is for testing, can set current time to within 10 mins. Ensure the proper one below that is disabled.
      var currentiso = new moment().toISOString(); //# PROD
      // var currentiso = '2017-03-23T20:00:00.000Z'; //# TEST COUNT DOWN
      // var currentiso = '2017-03-23T20:21:00.000Z'; //# TEST
      for(l in launch){
        // on first run there will be no launchname set so use the one returned.
        // if(!launchname){
        //   launchname = launch[l].name;
        // }
        // on subsequent runs this will also check if the launch name is a new one and update it.
        if(launch[l].name != launchname) {
          //set launchname the new name
          console.log('New launch '+launch[l].name+' to count down, tracking this one...');
          launchname = launch[l].name;
          //unset pushsent as its now a new launch to countdown
          firstpushsent = false;
          secondpushsent = false;
          gcmdevices = [];
          apndevices = [];
        } else {
          var launchiso = new moment(launch[l].window_start).toISOString();
          // Can do the below to format correctly or just use the toISOString() function above.
          // var launchiso = new moment(launch[l].isostart).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]')
          // console.log('Retruned ISO Time: ' + launch[l].isostart);
          // console.log('Launch ISO Time: ' + launchiso);
          // console.log('Current ISO Time: ' + currentiso);

          var ms = moment(currentiso,"YYYY-MM-DDTHH:mm:ss").diff(moment(launchiso,"YYYY-MM-DDTHH:mm:ss"));
          var d = moment.duration(ms);
          var m = Math.floor(d.asMinutes());
          // console.log('Time to Launch in Minutes: ' + m);
          var launchmsg = launch[l].name + ' Launch T ' + m + ' Minutes';
          // console.log('Launch Message: ' + launchmsg);

          if(m > firsttimeafter && m < firsttimebefore && !firstpushsent){
            sendPush(launchmsg);
            firstpushsent = true;
          }
          if(m > secondtimeafter && m < secondtimebefore && !secondpushsent){
            sendPush(launchmsg);
            secondpushsent = true;
          }
        }
      }
    } else {
      console.log('Error retrieving launch details - ' + error);
    }
  })
});
