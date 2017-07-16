import { expect } from 'chai';
import 'mocha';
import * as rp from 'request-promise';

// tslint:disable-next-line:no-unused
const _a = (_b: Mocha.ISuiteCallbackContext) => { };

describe('Backend', function(this: Mocha.ISuiteCallbackContext) {
  this.timeout(25000);

  describe('/time', () => {
    it('Returns approximately current time', async () => {
      const response = await rp.get('http://dev.alice.digital:8157/time',
        { resolveWithFullResponse: true, json: { events: [] } }).promise();
      expect(response.statusCode).to.eq(200);
      expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
      expect(response.body.serverTime).to.be.approximately(new Date().valueOf(), 30000);
    });
  });

  describe('POST /events', () => {
    it('Returns viewmodel in case if processed in time', async () => {
      const currentTimestamp = new Date().valueOf();
      const events = [
        {
          eventType: '_RefreshModel',
          timestamp: currentTimestamp - 4,
        },
        {
          eventType: '_RefreshModel',
          timestamp: currentTimestamp - 3,
        },
        {
          eventType: '_RefreshModel',
          timestamp: currentTimestamp - 2,
        },
        {
          eventType: '_RefreshModel',
          timestamp: currentTimestamp - 1,
        },
        {
          eventType: '_RefreshModel',
          timestamp: currentTimestamp,
        },
      ];

      const response = await rp.post('http://dev.alice.digital:8157/events/1337',
        {
          resolveWithFullResponse: true, json: { events },
          auth: { username: '1337', password: 'hunter2' },
        }).promise();
      expect(response.statusCode).to.eq(200);
      expect(response.body.viewModel.timestamp).to.equal(currentTimestamp);
      expect(response.body.id).to.equal('1337');
    });
  });
});
