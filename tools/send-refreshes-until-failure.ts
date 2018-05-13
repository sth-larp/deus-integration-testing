import * as rp from 'request-promise';
import * as commandLineArgs from 'command-line-args';
import ip = require('ip');

console.log(ip.address()); // my ip address


const optionDefinitions = [
  { name: 'id', type: String },
  { name: 'password', type: String}
];

const usernamePrefix = commandLineArgs(optionDefinitions).id;
const password = commandLineArgs(optionDefinitions).password;

console.info('Your ID is ' + usernamePrefix);

let minLatency = 100000;
let maxLatency = 0;
let totalLatency = 0;
let totalRequests = 0;

function suffix(n: number) {
  n = n % 100;
  if (n < 10) return '0' + n.toString();
  return n.toString();
}

async function sendEvent() {
  const tsBefore = new Date().valueOf();
  totalRequests += 1;
  const username = usernamePrefix + suffix(totalRequests);
  const response = await rp.post('http://35.234.75.234:8157/events/' + username,
    {
      resolveWithFullResponse: true, simple: false,
      json: { events: [{ eventType: '_RefreshModel', timestamp: new Date().valueOf() }] },
      auth: { username, password },
    }).promise();
  const tsAfter = new Date().valueOf();
  if (response.statusCode != 200) {
    console.error('Get non-success response: ' + JSON.stringify(response));
    process.exit(1);
  }
  else {
    const latency = tsAfter - tsBefore;
    console.info(`Request took ${latency} ms`);
    maxLatency = Math.max(maxLatency, latency);
    minLatency = Math.min(minLatency, latency);
    totalLatency += latency;
    console.info(`Current latency stats: min = ${minLatency}, max = ${maxLatency}, avg = ${totalLatency / totalRequests}`)
  }
}

setInterval(sendEvent, 500);
