let PouchDB = require('pouchdb-node');
let Rx = require('rxjs/Rx');


let dbEvents = new PouchDB(`http://dev.alice.digital:5984/events-test`);
let dbViewModel = new PouchDB(`http://dev.alice.digital:5984/viewmodel-test`);
let dbResults = new PouchDB(`http://dev.alice.digital:5984/results-test`);

function cleanDB(db) {
  return db.allDocs().then(function (result) {
    return Promise.all(result.rows.map(row => {
      if (!row.id.startsWith("_design"))
        return db.remove(row.id, row.value.rev);
    })
    )
  }).then(db.compact())
}

cleanDB(dbEvents)
  .then(() => { return cleanDB(dbViewModel); })
  .then(() => { return cleanDB(dbResults); })
  .then(() => {
    console.log("cleaned old stuff, waiting for new events");
    let eventsUpdates = Rx.Observable.create(observer => {
      let changesStream = dbEvents.changes({ live: true, since: 'now', include_docs: true });
      changesStream.on('change', change => {
        observer.next(change.doc);
      });
      return () => { changesStream.cancel(); }
    });

    eventsUpdates.subscribe(doc => {
      if (doc._deleted) {
        console.log("skipping deleted doc");
        return []
      };
      console.log("Received event: ", JSON.stringify(doc));
      return dbViewModel.get(doc.character)
        .then(viewdoc => {
          console.log("Existing viewdoc: ", JSON.stringify(viewdoc));
          viewdoc.timestamp = doc.timestamp;
          dbViewModel.put(viewdoc);
          dbEvents.remove(doc._id, doc._rev);
        })
        .catch(() => {
          console.log("Initializing viewdoc: ", JSON.stringify(doc));
          return dbViewModel.put({ _id: doc.character, character: doc.character, timestamp: doc.timestamp });
        })
        .catch(err => {console.error("error:", JSON.stringify(err))});
    });

  });