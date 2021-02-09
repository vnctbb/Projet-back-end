'use strict'

// module express
const express = require('express');
const app = express();

// module bodyParser
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({
  extended : false
}));

// module mongoClient
const MongoClient = require('mongodb').MongoClient;
const nameDb = 'timeline'; // nom de la database
const collectionEvents = 'eventList'; // nom de la collection des évènements
const collectionGames = 'previousGame'; // nom de la collection des parties précédentes
const urlDb = 'mongodb+srv://admin:admin@diwjs14.hyd9w.mongodb.net/timeline?retryWrites=true&w=majority'; // URL de la database

// module personnalisé
const formatDatabase = require('./modules/module-date.js');
const treatmentDatabase = require('./modules/module-database.js');
const toolbox = require('./modules/module-toolbox.js');
const everyPlayer = require('./modules/module-competitor.js');
const distribution = require('./modules/module-distribution.js');
const game = require('./modules/module-game.js');

// déclaration de la variable PORT
const PORT = process.env.PORT || 3000;

// déclaration de fichier statique
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/img', express.static(__dirname + '/public/images'));
app.use('/js', express.static(__dirname + '/public/javascript'));

// déclaration du générateur de template
app.set('view engine', 'pug');

// module
const formatDatabase = require('date');
const treatmentDatabase = require('module-database');
const toolbox = require('module-toolbox');
const everyPlayer = require('module-competitor');
const distribution = require('module-distribution');
const game = require('module-game');

/**
 * Serveur HTTP
 */

// requête GET page d'accueil
// renvoi de la page index
app.get('/', (req, res) => {
  const avatar = ['vladimir', 'monica', 'cesar', 'angelix', 'peter', 'lee'];
  treatmentDatabase.find({
    collection : 'game',
    sort : {date : -1},
    done : (datas) => {
      formatDatabase(datas);
      res.render('index',{previousGame : datas, personnage : avatar});
    }
  });
});

// requête POST réception des données du formulaire de la page index
// renvoi de la page lobby
app.post('/lobby', (req, res) => {
  const personnage = ['vladimir', 'monica', 'cesar', 'angelix', 'peter', 'lee'];
  const player = {
    username : req.body.username,
    avatar : req.body.personnage,
  }
  let error = false;

  everyPlayer.list.forEach(item => {
    if(item.name == player.username){
      error = 'usernameTaken';
    }
  });

  if(player.username == ''){
    error = 'emptyUsername';
  }
  if(personnage.indexOf(player.avatar) < 0){
    error = 'emptyAvatar';
  }
  if(game.running){
    error = 'gameIsRunning';
  }
  if(everyPlayer.list.length === 8){
    error = 'maxPlayer';
  }
  if(player.username.length < 3 || player.username.length > 25){
    error = 'usernameNotOk'
  }
  treatmentDatabase.find({
    collection : 'game',
    done : (datas) => {
      formatDatabase(datas);
      if(error){
        res.render('index', {error : error, previousGame : datas, personnage : personnage});
      } else {
        res.render('lobby', {username : player.username, avatar : player.avatar, previousGame : datas});
      }
    }
  });
});

// gestion erreur d'URL
app.use( (req, res) => {
  res.status(404).render('404');
});

// constante 'server' pour relier le serveur express au serveur websocket
const server = app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});

// appel de la base de donnée pour récupérer le jeu de carte
let dataBase;

treatmentDatabase.find({
  collection : 'events',
  done : (datas) => {
    dataBase = datas;
  }
});

/**
 * Variables diverse
 */

/**
* Serveur Websocket (avec socket.io)
*/

const socketio = require('socket.io');
const ioServer = socketio(server);

ioServer.on('connection', (socket) => {
  console.log('connexion établie');

  const NewPlayer = require('module-player.js');
  let player;

  // socket qui reçoit les informations du nouveau joueur
  // créer le joueur
  // ajoute le joueur au tableau des joueurs
  socket.on('saveUsername', (data) => {
    player = new NewPlayer(socket.id, data.username, dataBase, data.avatar);
    everyPlayer.list.push(player);
    socket.broadcast.emit('newPlayer', player);
    socket.emit('giveHand', {player : player});
  });

  // socket qui renvoi tous les joueurs
  // en enlevant le dernier joueur (qui est celui ayant fait la demande)
  socket.on('askForOtherPlayer', () => {
    socket.emit('askForOtherPlayer', everyPlayer.list.slice(0, (everyPlayer.list.length-1)));
  });

  ioServer.emit("notReadyToPlay");

  socket.on('playerIsReady', () => {
    player.nowReady();
    const playersReady = everyPlayer.ready()
    if(playersReady === true){
      game.start(everyPlayer.list);
      ioServer.emit('startGaming', {firstPlayer : everyPlayer.list[0]});
      ioServer.to(everyPlayer.list[0].id).emit("readyToPlay", {firstPlayer : true});
    }
  });

  socket.on('eventPositionned', (datas) => {
    if(datas.position){
      const index = toolbox.getIndex(player.hand, datas.elementId);
      player.positionOk(index);
    }
    if(player.nbOfCard == 0 && player.points > 400){
      ioServer.emit('weHaveAWinner', player);
      game.win(player);
      MongoClient.connect(urlDb, {useUnifiedTopology : true}, (err, client) => {
        if(err) throw err;
        const collection = client.db(nameDb).collection(collectionGames);
        collection.insertOne(game, (err, res) => {
          if(err) throw err;
          console.log('Game saved in DataBase');
          client.close();
        });
      });
    };
    const nextPlayer = toolbox.getNextPlayer(player.id, everyPlayer.list);
    socket.broadcast.emit('eventPositionned', {innerHTML : datas.innerHTML});
    ioServer.emit('renderDate', datas.actualCard);
    ioServer.to(player.id).emit("notReadyToPlay");
    ioServer.to(nextPlayer.id).emit("readyToPlay", {firstPlayer : false});
    everyPlayer.list[toolbox.getIndex(everyPlayer.list, player.id)].points = player.points;
    ioServer.emit('whoNeedToPlay', {nextPlayer : nextPlayer, player : player}); //changer nom variable player = ancien player pour les points 
  });

  // socket qui reçoit les infos de la carte à vérifier
  socket.on('requestServerCheck', (datas) => {
    const retour = distribution.cardVerification(datas.order, datas.cardId);
    retour.index = datas.index;
    socket.emit('responseServerCheck', retour);
  });

  // traitement sur les cartes lorsque la position est mauvaise
  socket.on('wrongPosition', (datas) => {
    player.streak = 1;
    player.points -= 50;
    const indexCard = toolbox.getIndex(player.hand, datas.elementId);
    const indexPlayer = toolbox.getIndex(everyPlayer.list, player.id);
    player.hand.splice(indexCard, 1);
    player.hand.push(distribution.takeCard(dataBase));
    everyPlayer.list[indexPlayer].hand = player.hand;
    socket.emit('giveHand', {player : player, newCard : true});
    socket.broadcast.emit('wrongPosition', {player : player, innerHTML : datas.innerHTML});
  });

  socket.on('disconnect', () => {
    everyPlayer.list.forEach((playerInArray, index) => {
      if(playerInArray.id == player.id){
        playerInArray.hand.forEach(card => {
          dataBase.forEach(event => {
            if(event.titre === card.titre){
              event.given = false;
            }
          })
        });
        everyPlayer.list.splice(index, 1);
      }
    });
    if(game.running){
      ioServer.emit('onePlayerIsGone', {name : player.name, running : true});
      game.running = false;
      treatmentDatabase.find({
        collection : 'events',
        done : (datas) => {
          dataBase = datas;
        }
      });
    } else {
      ioServer.emit('onePlayerIsGone', {name : player.name, id : player.id, running : false});
    }
  });

});
