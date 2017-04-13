let PouchDB = require('pouchdb-node');
let Rx = require('rxjs/Rx');
let uuidV1 = require('uuid/v1');

const characterId = uuidV1();
console.log(`Using charactedId: ${characterId}`);

let dbEvents = new PouchDB(`events-${characterId}`);
let dbViewModel = new PouchDB(`viewmodel-${characterId}`);
let dbResults = new PouchDB(`results-${characterId}`);

let replicationOptions = {
  live: true,
  continuous: true,
  retry: true,
  filter: 'character/by_name',
  query_params: { "character": characterId }
};

dbEvents.sync('http://dev.alice.digital:5984/events-test', replicationOptions)
dbViewModel.sync('http://dev.alice.digital:5984/viewmodel-test', replicationOptions);
dbResults.sync('http://dev.alice.digital:5984/results-test', replicationOptions);

Rx.Observable.timer(5000, 5000).timestamp().subscribe(timestamp => {
  console.log("Sending event at ", timestamp);
  dbEvents.post({
/*    some_junk_payload_to_increase_size:  `Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
                                         sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                         Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
                                         nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                                         in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                                         nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                                         sunt in culpa qui officia deserunt mollit anim id est laborum`,*/
    timestamp: timestamp.timestamp,
    character: characterId
  })
  .then(() => console.log("Sent event at ", timestamp))
  .catch(err => console.error(JSON.stringify(err)))
}
);

let maxTimestampDifference = -1;

let viewModelUpdates = Rx.Observable.create(observer => {
  let changesStream = dbViewModel.changes({ live: true, since: 'now', include_docs: true });
  changesStream.on('change', change => {
    observer.next(change.doc);
  });
  return () => { changesStream.cancel(); }
});

viewModelUpdates.subscribe(doc => {
  if (!doc.timestamp) return;
  console.log("Received doc:  ", JSON.stringify(doc));
  let now = new Date().valueOf();
  let diff = now - doc.timestamp;
  if (maxTimestampDifference == -1) {
    console.log("Initial diff is ", diff);
    maxTimestampDifference = 0;
  }
  else if (diff > maxTimestampDifference) {
    console.log("Now max diff is ", diff);
    maxTimestampDifference = diff;
    dbResults.get(characterId)
      .then(doc => {
        doc.diff = maxTimestampDifference;
        dbResults.put(doc);
      })
      .catch(() => dbResults.put({ _id: characterId, character: characterId, diff: maxTimestampDifference }));
  }
})


