var apn = require('apn');

/* The registration id returned upon the call to register in the app - this would be retrieved from a db where originally stored */
var iPhone6 = "10d0f7b78b7f0e6873684ec5be4601bcb470d7d4c8a05ba0d13c8416f91db3a0";

// var myDevice = new apn.Device(terencePhone);
// var myDevice = new apn.Device(iPhone6);
var myDevice = iPhone6;

var note = new apn.Notification();
note.badge = 1;
note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
// note.sound = "ping.aiff";
note.topic = "com.launchalarm.app";

// You could specify this way
//note.alert = "Jennifer L commented on your photo:\n Congratulations!! \u270C\u2764\u263A ";

// Or this way below to set a certain phrase on the button if the user has alert set for the notifications on the app and not just banner
// and a custom image to show upon launch from the notification.
note.alert = { "body" : "SpaceX Falcon 9 Full Thrust launch attempt T minus 10 minutes", "action-loc-key" : "Stream Launch" , "launch-image" : "mysplash.png"};

/* payload property is custom internal use data - use for alert title in my sample app when in the foreground
Providers can specify custom payload values outside the Apple-reserved aps namespace. Custom values
must use the JSON structured and primitive types: dictionary (object), array, string, number, and Boolean.
You should not include customer information (or any sensitive data) as custom payload data. Instead, use it
for such purposes as setting context (for the user interface) or internal metrics. For example, a custom payload
value might be a conversation identifier for use by an instant-message client app or a timestamp identifying
when the provider sent the notification. */

note.payload = {'messageFrom': 'Launch Alarm'}; // additional payload

// note.device = myDevice;

var callback = function(errorNum, notification){
    console.log('Error is: %s', errorNum);
    console.log("Note " + JSON.stringify(notification));
}
var options = {
  token: {
    key: "../APNsAuthKey_6T863SH28Z.p8",
    keyId: "6T863SH28Z",
    teamId: "H37Y55BC9J"
  },
  // set to false for DEV Gateway
  production: false
};

// var apnsConnection = new apn.Provider(options);
var apnsConnection = new apn.Provider(options);
// console.log("Note " + JSON.stringify(note));
apnsConnection.send(note, myDevice).then( (result) => {
  console.log('iOS Notifications Sent Successful - Shutting Down...');
  apnsConnection.shutdown();
  // feedback.cancel();
});
