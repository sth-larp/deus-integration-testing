let PouchDB = require('pouchdb-node');
PouchDB.plugin(require('pouchdb-adapter-memory'));
let Rx = require('rxjs/Rx');
let uuidV1 = require('uuid/v1');
let log = require('loglevel');

log.setLevel(log.levels.DEBUG);

function now() {
  return new Date().valueOf();
}

const characterId = uuidV1();
log.info(`Using charactedId: ${characterId}`);

let dbEvents = new PouchDB(`events-${characterId}`,  {adapter: 'memory'});
let dbViewModel = new PouchDB(`viewmodel-${characterId}`,  {adapter: 'memory'});
//let dbResults = new PouchDB(`results-${characterId}`, {adapter: 'memory'});

let replicationOptions = {
  live: true,
  continuous: true,
  retry: true,
  filter: 'character/by_name',
  query_params: { "character": characterId }
};

let replicationOptions2 = {
  live: true,
  continuous: true,
  retry: true
};

dbEvents.replicate.to('http://10.254.1.130:5984/events-test', replicationOptions2)
.on('change', function (info) {
  log.debug('dbEvents change');// handle change
}).on('paused', function (err) {
  log.debug('dbEvents paused', JSON.stringify(err));// replication paused (e.g. replication up to date, user went offline)
}).on('active', function () {
  log.debug('dbEvents active');// replicate resumed (e.g. new changes replicating, user went back online)
}).on('denied', function (err) {
  log.error('dbEvents denied');// a document failed to replicate (e.g. due to permissions)
}).on('complete', function (info) {
  log.debug('dbEvents complete');// handle complete
}).on('error', function (err) {
  log.error('dbEvents error');// handle error
});

dbViewModel.replicate.from('http://10.254.1.130:5984/viewmodel-test', replicationOptions)
.on('change', function (info) {
  log.debug('dbViewModel change');// handle change
}).on('paused', function (err) {
  log.debug('dbViewModel paused', JSON.stringify(err));// replication paused (e.g. replication up to date, user went offline)
}).on('active', function () {
  log.debug('dbViewModel active');// replicate resumed (e.g. new changes replicating, user went back online)
}).on('denied', function (err) {
  log.error('dbViewModel denied');// a document failed to replicate (e.g. due to permissions)
}).on('complete', function (info) {
  log.debug('dbViewModel complete');// handle complete
}).on('error', function (err) {
  log.error('dbViewModel error');// handle error
});

//dbResults.replicate.to('http://10.254.1.130:5984/results-test', replicationOptions2);

Rx.Observable.timer(10000, 120000).timestamp().subscribe(timestamp => {
  log.debug("Sending event at ", timestamp);
  dbEvents.post({
/*    some_junk_payload_to_increase_size:  `Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
                                         sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                         Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
                                         nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                                         in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                                         nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                                         sunt in culpa qui officia deserunt mollit anim id est laborum`,*/
    value: timestamp.value,
    timestamp: timestamp.timestamp,
    character: characterId
  })
  .then(() => log.debug("Sent event at ", timestamp))
  .catch(err => console.error(JSON.stringify(err)))
}
);

let maxTimestampDifference = -1;

let reportMaxTimestampDifference = (diff) => {
  log.info("Now max diff is ", diff);
  maxTimestampDifference = diff;
  /*dbResults.get(characterId)
    .then(doc => {
      doc.diff = maxTimestampDifference;
      dbResults.put(doc);
    })
    .catch(() => dbResults.put({ _id: characterId, character: characterId, diff: maxTimestampDifference }));*/
};

let lastTimeStamp = now();

let viewModelUpdates = Rx.Observable.create(observer => {
  let changesStream = dbViewModel.changes({ live: true, since: 'now', include_docs: true });
  changesStream.on('change', change => {
    observer.next(change.doc);
  });
  return () => { changesStream.cancel(); }
});

viewModelUpdates.subscribe(doc => {
  if (!doc.timestamp) return;
  log.debug("Received doc:  ", JSON.stringify(doc));
  lastTimeStamp = doc.timestamp;
  let diff = now() - doc.timestamp;
  if (maxTimestampDifference == -1) {
    log.info("Initial diff is ", diff);
    maxTimestampDifference = 0;
  }
  else if (diff > maxTimestampDifference) {
    reportMaxTimestampDifference(diff);
  }
})


const LongNoUpdateDelay = 60000; // 1 minute

Rx.Observable.timer(10000, 10000).timestamp().subscribe(timestamp => {
  let diff = timestamp.timestamp - lastTimeStamp;
  if (diff > LongNoUpdateDelay) {
    log.warn("No updates for more than 1 minute!")
    reportMaxTimestampDifference(diff);
  }
}
);

