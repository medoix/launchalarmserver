var moment = require('moment');

var launch = '2016-05-26T21:35:00.000Z';
var lastRunTime = '2016-05-25T21:35:00.000Z';
var leftBracket, rightBracket;
var nowTime = new moment().toISOString();
leftBracket = lastRunTime ? Math.max(lastRunTime + 10, nowTime) : nowTime;
console.log('Left Bracket: ' + leftBracket);
rightBracket = nowTime + 10;
console.log('Right Bracket: ' + rightBracket);
console.log(launch);

if( launch > leftBracket && launch < rightBracket ){
  console.log('launch push true!');
  return true;
} else {
  console.log('launch push false!');
  return false;
}
lastRunTime = new moment().toISOString();
