import * as PouchDB from 'pouchdb';
import * as PouchDBUpsert from 'pouchdb-upsert';
PouchDB.plugin(PouchDBUpsert);
// tslint:disable-next-line:no-var-requires
const config = require('../../configs/deus-tools');

async function main() {
  try {
    const authOptions = { auth: { username: config.username, password: config.password } };

    const accountsDb = new PouchDB(config.dbs.accounts, authOptions);
    const modelsDb = new PouchDB(config.dbs.models, authOptions);
    const viewModelsDb = new PouchDB(config.dbs.viewModels, authOptions);

    const accountDoc: any = await accountsDb.get(config.accountToClone);
    const modelDoc: any = await modelsDb.get(config.accountToClone);
    const viewModelDoc: any = await viewModelsDb.get(config.accountToClone);

    delete accountDoc._rev;
    delete accountDoc.login;
    delete modelDoc._rev;
    delete viewModelDoc._rev;

    for (let i = 0; i < 98; ++i) {
      const newId = (90002 + i).toString();
      accountDoc._id = newId;
      modelDoc._id = newId;
      modelDoc.characterId = newId;
      viewModelDoc._id = newId;
      await Promise.all([
        accountsDb.put(accountDoc),
        modelsDb.put(modelDoc),
        viewModelsDb.put(viewModelDoc),
      ]);
    }

  } catch (e) {
    console.error(e);
  }
}

main();
