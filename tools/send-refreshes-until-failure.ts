import * as rp from 'request-promise';
// tslint:disable-next-line:no-var-requires
const config = require('../../configs/deus-tools');

import * as commandLineArgs from 'command-line-args';

const optionDefinitions = [
  { name: 'id', type: String },
];

const id = commandLineArgs(optionDefinitions).id;

console.info('Your ID is ' + id);

async function sendEvent() {
  const tsBefore = new Date().valueOf();
  const response = await rp.post('http://dev.alice.digital:8157/events/' + id,
    {
      resolveWithFullResponse: true,
      json: { events: [{ eventType: '_RefreshModel', timestamp: new Date().valueOf() }] },
      auth: { username: id, password: config.accountPassword },
    }).promise();
  const tsAfter = new Date().valueOf();
  if (response.statusCode != 200)
    console.error('Get non-success response: ' + JSON.stringify(response));
  else
    console.info(`Request took ${tsAfter - tsBefore} ms`);
}

setInterval(sendEvent, 5000);
