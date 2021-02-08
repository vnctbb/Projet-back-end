'use strict'

// module mongoClient
const MongoClient = require('mongodb').MongoClient;
const nameDb = 'timeline'; // nom de la database
const collectionEvents = 'eventList'; // nom de la collection des évènements
const collectionGames = 'previousGame'; // nom de la collection des parties précédentes
const urlDb = 'mongodb+srv://admin:admin@diwjs14.hyd9w.mongodb.net/timeline?retryWrites=true&w=majority'; // URL de la database

const connect = callback => {
  MongoClient.connect(urlDb, {useUnifiedTopology : true}, (err, client) => {
    const database = client.db(nameDb);
    callback(database, client);
  });
};

const find = settings => {

  if(settings.collection === 'events') {settings.collection = collectionEvents;}
  if(settings.collection === 'game') {settings.collection = collectionGames}

  if (!settings.filter) {
    settings.filter = {};
  }
  if (!settings.error) {
    settings.error = () => {
        next();
    }
  }
  connect((database, client) => {
    const collection = database.collection(settings.collection);
    collection.find(settings.filter).sort(settings.sort).toArray((err, datas) => {
      if (err) settings.error();
      client.close();
      settings.done(datas);
    });
  })
};

module.exports = {
  find : find,
}