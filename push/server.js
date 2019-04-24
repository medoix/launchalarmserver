var express = require('express');
var log = require('ecs-logs-js');
var schedule = require('node-schedule');
var request = require('request');
var moment = require('moment');
var fs = require('fs');
var path = require('path');
// Service Settings
var firsttimeafter = -31; //greater than -30+ etc
var firsttimebefore = -15; //less than -16+ etc
var secondtimeafter = -16; //greater than -15+ etc
var secondtimebefore = 0; //less than -1+ etc
var cronopts = '*/1 * * * *'; //# PROD
var launchname = '';
var firstpushsent;
var secondpushsent;
// GCM Settings
var gcm = require('node-gcm');
var gcmmessage = new gcm.Message();
var gcmsender = new gcm.Sender('AIzaSyCQToa1DqldnNH7Lm0RKJl51Yvuj5P-c-w');
var gcmdevices = [];
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
var apnConnection = new apn.Provider(options);
var apnmessage = new apn.Notification();
var apndevices = [];
apnmessage.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
apnmessage.badge = 1;
apnmessage.sound = "ping.aiff";
apnmessage.payload = {'messageFrom': 'Launch Alarm'};
apnmessage.topic = "com.launchalarm.app";
// APN End Settings

var launchOptions = {
  url: 'https://launchlibrary.net/1.2/launch/next/1', //# PROD
  headers: {
    'User-Agent': 'javascript' // Needed for this API otherwise 403 returns.
  }
};

var deviceOptions = {
  url: 'https://launchalarm.com/v1/device/devices', //# PROD`
  headers: {
    'User-Agent': 'javascript' // Not really needed for this API.
  }
};

// var messageLog = function(file, msg){
//   console.log(msg);
//   var time = new moment().format('YYYY-MM-DD:hh:mm:ss');
//   var logmsg = time+" : "+msg+"\n";
//   fs.appendFile(file+".log", logmsg, function (err) {
//   });
// }

var sendPush = function(launchmsg){
  //log the messaage that is going to be sent as all needed criteria are met now.
  var pushnumber = '';
  if(!firstpushsent){
    pushnumber = 'First';
  } else if(!secondpushsent){
    pushnumber = 'Second';
  }
  log.info(pushnumber+' Push - Launch Message: ' + launchmsg);
  request(deviceOptions, function (error, response, body) { //# PROD
  // request('http://localhost:8080/test-device', function (error, response, body) { //# TEST
    //check response was successful
    if (!error && response.statusCode == 200) {
      var obj = JSON.parse(body);
      var device = obj.devicelist;
      // console.log('Device Details: ' + JSON.stringify(device, ['devId', 'type']));
      for(d in device){
        //log.debug('Device ' + d + ' Type: ' + JSON.stringify(device[d].type));
        //log.debug('Device ' + d + ' ID: ' + JSON.stringify(device[d].devId));
        apnmessage.alert = launchmsg;
        gcmmessage.addData('message',launchmsg);
        if(device[d].type == "ios"){
          // apnmessage.alert = launchmsg;
          apndevices.push(device[d].devId);
          log.info('iOS Queued: ' + device[d].devId);
        } else if(device[d].type == "android"){
          // gcmmessage.addData('message',launchmsg);
          gcmdevices.push(device[d].devId);
          log.info('Android Queued: ' + device[d].devId);
        }
      }
      // outside device loop as APN can push to an array apndevices
      if(apndevices.length > 0){
        log.info(`iOS Sending: ${apnmessage.compile()} to ${apndevices}`);
        apnConnection.send(apnmessage, apndevices).then( result => {
            log.info('iOS Sent: ' + result.sent.length);
            log.info('iOS Failed: '+ result.failed.length);
            if(result.failed.length > 0){
              log.info(result.failed);
            }
            log.info('iOS Notifications - Shutting Down');
            apnConnection.shutdown();
            log.info('Clearing iOS Message');
            apnmessage.alert = '';
        });
      }
      // outside device loop as GCM can push to an array gcmdevices
      if(gcmdevices.length > 0){
        log.info('Android Sending: '+gcmmessage+' to '+gcmdevices);
        gcmsender.send(gcmmessage, { registrationTokens: gcmdevices }, function (err, response) {
          if (err) log.info(err);
          else log.info(response);
          log.info('Clearing Android Message');
          gcmmessage.addData('message','');
        });
      }
    } else {
      log.info('Error retrieving device details - ' + error);
    }
  })
}

var LaunchAlarmPush = function() {

    //  Scope.
    var self = this;

    // Set up server IP address and port # using env variables/defaults.
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.port = process.env.PORT || 8080;
    };

    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    // self.terminator = function(sig){
    //     if (typeof sig === "string") {
    //       // messageLog('running',Date(Date.now())+': Received '+sig+' - terminating Launch Alarm Push server...');
    //       log.info(Date(Date.now())+': Received '+sig+' - terminating Launch Alarm Push server...');
    //       process.exit(1);
    //     }
    //     // messageLog('running',Date(Date.now())+': Launch Alarm Push server stopped.');
    //     log.info(Date(Date.now())+': Launch Alarm Push server stopped.');
    // };

    // Setup termination handlers (for exit and a list of signals).
    // self.setupTerminationHandlers = function(){
    //     //  Process on exit and signals.
    //     process.on('exit', function() { self.terminator(); });
    //
    //     // Removed 'SIGPIPE' from the list - bugz 852598.
    //     ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
    //      'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
    //     ].forEach(function(element, index, array) {
    //         process.on(element, function() { self.terminator(element); });
    //     });
    // };

    // Create the routing table entries + handlers for the application.
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send("<html><head><title>Launch Alarm Push</title></head><body><p><h2>Launch Alarm Push</h2></p><p>yup, i am running...</p></body></html>");
        };
        // self.routes['/log'] = function(req, res) {
        //     res.setHeader('Content-Type', 'text/plain');
        //     res.setHeader('Refresh', '60');
        //     // res.send("<h2>Running Log</h2>");
        //     res.sendFile(path.join(__dirname + '/running.log'));
        // };
        // self.routes['/test-device'] = function(req, res) { // TEST
        //     res.setHeader('Content-Type', 'text/plain');
        //     res.sendFile(path.join(__dirname + '/test-device.json'));
        // };
        // self.routes['/test-launch'] = function(req, res) { // TEST
        //     res.setHeader('Content-Type', 'text/plain');
        //     res.sendFile(path.join(__dirname + '/test-launch.json'));
        // };
    };

    // Initialize the server (express) and create the routes and register the handlers.
    self.initializeServer = function() {
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
        // self.setupTerminationHandlers();
        // Create the express server and routes.
        self.initializeServer();
    };


    // Start the server
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, function() {
          log.info('Launch Alarm Push server started on port ' + self.port + '...');
          // sendPush('Notice: I am aware of some issues with push notifications not being sent and a fix is in progress.')
        });
    };

};

log.info('#### LAUNCH PUSH CHECK SERVER ####')
log.info('Starting Push Check Service...');
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
      var launch = obj.launches;
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
          log.info('New launch '+launch[l].name+' to count down, tracking this one...');
          launchname = launch[l].name;
          //unset pushsent as its now a new launch to countdown
          firstpushsent = false;
          secondpushsent = false;
          gcmdevices = [];
          apndevices = [];
        } else {
          var launchiso = new moment(launch[l].isostart).toISOString();
          // Can do the below to format correctly or just use the toISOString() function above.
          // var launchiso = new moment(launch[l].isostart).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]')
          // log.debug('Retruned ISO Time: ' + launch[l].isostart);
          // log.debug('Launch ISO Time: ' + launchiso);
          // log.debug('Current ISO Time: ' + currentiso);

          var ms = moment(currentiso,"YYYY-MM-DDTHH:mm:ss").diff(moment(launchiso,"YYYY-MM-DDTHH:mm:ss"));
          var d = moment.duration(ms);
          var m = Math.floor(d.asMinutes());
          // log.debug('Time to Launch in Minutes: ' + m);
          var launchmsg = launch[l].name + ' Launch T ' + m + ' Minutes';
          // log.debug('Launch Message: ' + launchmsg);

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
      log.info('Error retrieving launch details - ' + error);
    }
  })
});
