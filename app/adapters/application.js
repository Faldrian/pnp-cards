import PouchDB from 'pouchdb';
import { Adapter } from 'ember-pouch';

var db = new PouchDB('local_pouch');

// compact on a new visit... so it does not get too big.
// tomnstones (deleted entry markers) are kept, as PouchDB has no purge method
db.compact();

export default Adapter.extend({
  db: db
});
