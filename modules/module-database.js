'use strict'

/**
 * Module pour les opérations avec la base de donnée
 */

// module mongoClient
const MongoClient = require('mongodb').MongoClient;
const nameDb = 'timeline'; // nom de la database
const collectionEvents = 'eventList'; // nom de la collection des évènements
const collectionGames = 'previousGame'; // nom de la collection des parties précédentes
const urlDb = 'mongodb+srv://admin:admin@diwjs14.hyd9w.mongodb.net/timeline?retryWrites=true&w=majority'; // URL de la database

// fonction pour se connecter au client MongoDb
const connect = callback => {
  MongoClient.connect(urlDb, {useUnifiedTopology : true}, (err, client) => {
    const database = client.db(nameDb);
    callback(database, client);
  });
};

// fonction find
const find = settings => {

  // détermine la collection sur laquelle faire la requête
  if(settings.collection === 'events') {settings.collection = collectionEvents};
  if(settings.collection === 'game') {settings.collection = collectionGames};

  // si aucun filtre n'est transmis alors on lui passe un objet vide
  if (!settings.filter) {
    settings.filter = {};
  }
  // si aucune erreur n'est transmis alors on lui passe une erreur
  if (!settings.error) {
    settings.error = () => {
        res.status('500');
        next();
    };
  }

  // appel de la fonction connect, passage en callback d'une fonction qui applique la méthode find
  connect((database, client) => {
    // déclaration de la collection
    const collection = database.collection(settings.collection);
    // appel de la méthode
    collection.find(settings.filter).sort(settings.sort).toArray((err, datas) => {
      if (err) settings.error();
      // fermeture du client
      client.close();
      // application des instructions donné dans settings
      settings.done(datas);
    });
  });
};

// fonction insert
const insert = settings => {
  // si aucune erreur n'est transmis alors on lui passe une erreur
  if (!settings.error) {
    settings.error = () => {
        res.status('500');
        next();
    };
  }

  // appel de la fonction connect, passage en callback d'une fonction qui applique la méthode insert
  connect((database, client) => {
    // déclaration de la collection
    const collection = database.collection(collectionGames);
    // appel de la méthode insertOne
    collection.insertOne(settings.datas, (err, res) => {
      if (err) settings.error();
      // fermeture du client
      client.close();
      console.log('Game saved in DataBase');
    });
  });
};

// export du module
module.exports = {
  find : find,
  insert : insert
};