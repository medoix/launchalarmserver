var request = require('request');
var moment = require('moment');
var fs = require('fs');
// Service Settings
var launchname = '';
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
    gateway: 'gateway.push.apple.com', // this URL is different for Apple's Production Servers and changes when you go to production
    errorCallback: callback,
    cert: 'aps-prod-pubcert.pem', // ** NEED TO SET TO YOURS - see this tutorial - http://www.raywenderlich.com/32960/apple-push-notification-services-in-ios-6-tutorial-part-1
    key:  'aps-prod-privkey.pem',  // ** NEED TO SET TO YOURS
    passphrase: 'launchalarm', // ** NEED TO SET TO YOURS
    port: 2195,
    enhanced: true,
    cacheLength: 100,
    interval: 300
}
var apnConnection = new apn.Connection(options);
var apnmessage = new apn.Notification();
apnmessage.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
apnmessage.badge = 1;
apnmessage.sound = "ping.aiff";
apnmessage.payload = {'messageFrom': 'Launch Alarm'};
var callback = function(errorNum, notification){
  console.log('APN Error: %s : %s', errorNum, JSON.stringify(notification));
  runningLog('APN Error: '+erroNum+' : '+JSON.stringify(notification));
}
// APN End Settings

var launchOptions = {
  url: 'https://launchlibrary.net/1.2/launch/next/1',
  headers: {
    'User-Agent': 'javascript' // Needed for this API otherwise 403 returns.
  }
};

var deviceOptions = {
  url: 'https://launchalarm.com/v1/device/devices',
  headers: {
    'User-Agent': 'javascript' // Not really needed for this API.
  }
};

var messageLog = function(file, msg){
  console.log(msg);
  var time = new moment().format('YYYY-MM-DD:hh:mm:ss');
  var logmsg = time+" : "+msg+"\n";
  fs.appendFile(file+".log", logmsg, function (err) {
  });
}

var sendPush = function(launchmsg){
  //log the messaage that is going to be sent as all needed criteria are met now.
  messageLog('running','Launch Message: ' + launchmsg);
  request(deviceOptions, function (error, response, body) {
    //check response was successful
    if (!error && response.statusCode == 200) {
      var obj = JSON.parse(body);
      var device = obj.devicelist;
      // console.log('Device Details: ' + JSON.stringify(device, ['devId', 'type']));
      for(d in device){
        // messageLog('running','Device ' + d + ' Type: ' + JSON.stringify(device[d].type));
        // messageLog('running','Device ' + d + ' ID: ' + JSON.stringify(device[d].devId));
        if(device[d].type == "ios"){
          apnmessage.alert = launchmsg;
          var myDevice = new apn.Device(device[d].devId);
          apnConnection.pushNotification(apnmessage, myDevice);
          messageLog('running','iOS Push Sent To: ' + device[d].devId);
        } else if(device[d].type == "android"){
          gcmmessage.addData('message',launchmsg);
          gcmdevices.push(device[d].devId);
          messageLog('running','Android Push Sent To: ' + device[d].devId);
        }
      }
      apnConnection.on('completed', function(){
        messageLog('running','iOS Notifications Sent Successful - Shutting Down...');
        apnConnection.shutdown();
        // feedback.cancel();
      });
      // outside device loop as GCM can push to an array gcmdevices
      gcmsender.send(gcmmessage, gcmdevices, 4, function (result) {
        if(result == null){ //null is actually success
          messageLog('running','Android Notifications Sent Successful - Shutting Down...');
        } else {
          messageLog('running',result); //not null is something else
        }
      });
    } else {
      messageLog('running','Error retrieving device details - ' + error);
    }
  })
}

// messageLog('running','Starting Launch Push Service...');
request(launchOptions, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var obj = JSON.parse(body);
    var launch = obj.launches;
    // Below var is for testing, can set current time to within 10 mins. Ensure the proper one below that is disabled.
    // var currentiso = '2016-05-29T08:35:00.000Z';
    var currentiso = new moment().toISOString();
    for(l in launch){
      var launchiso = new moment(launch[l].isostart).toISOString();
      // Can do the below to format correctly or just use the toISOString() function above.
      // var launchiso = new moment(launch[l].isostart).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]')
      // messageLog('running','Retruned ISO Time: ' + launch[l].isostart);
      // messageLog('running','Launch ISO Time: ' + launchiso);
      // messageLog('running','Current ISO Time: ' + currentiso);

      var ms = moment(currentiso,"YYYY-MM-DDTHH:mm:ss").diff(moment(launchiso,"YYYY-MM-DDTHH:mm:ss"));
      var d = moment.duration(ms);
      var m = Math.floor(d.asMinutes());
      // messageLog('running','Time to Launch in Minutes: ' + m);
      var launchmsg = launch[l].name + ' Launch T ' + m + ' Minutes';
      // messageLog('running','Launch Message: ' + launchmsg);
      sendPush(launchmsg);
    }
  } else {
    messageLog('running', 'Error retrieving launch details - ' + error);
  }
})
