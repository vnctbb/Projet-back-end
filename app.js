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
const formatDatabase = require('module-date.js');
const treatmentDatabase = require('module-database.js');

// déclaration de la variable PORT
const PORT = process.env.PORT || 3000;

// déclaration de fichier statique
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/img', express.static(__dirname + '/public/images'));
app.use('/js', express.static(__dirname + '/public/javascript'));

// déclaration du générateur de template
app.set('view engine', 'pug');

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

  allPlayer.forEach(item => {
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
  if(gameIsRunning){
    error = 'gameIsRunning';
  }
  if(allPlayer.length === 8){
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

let dataBase;

treatmentDatabase.find({
  collection : 'events',
  done : (datas) => {
    dataBase = datas;
  }
});

function getRandomNumber (db) {
  return Math.round(Math.random() * (db.length -1));
}

function giveHand (nbOfCardNeeded) {
  const hand = [];
  for(let i = 0; i<nbOfCardNeeded; i++){
    let index = getRandomNumber(dataBase);
    if(dataBase[index].given){
      while(dataBase[index].given){
        index = getRandomNumber(dataBase);
      }
    }
    dataBase[index].given = true;
    allCardGiven.push(dataBase[index]);
    const item = dataBase[index];
    const infoGiven = {
      id : item._id,
      titre : item.titre
    }
    hand.push(infoGiven);
  };
  return hand;
};

function getIndexInAllPlayer (id) {
  let indexAllPlayer;
  allPlayer.forEach((player, index) => {
    if(player.id == id){
      indexAllPlayer = index;
    }
  });
  return indexAllPlayer;
};

function getNextPlayer (id) {
  const index = getIndexInAllPlayer(id);
  if(index == allPlayer.length - 1){
    return allPlayer[0];
  } else {
    return allPlayer[index+1];
  }
}

/**
* Serveur Websocket (avec socket.io)
*/

const allPlayer = [];

const allCardGiven = [];

const game = {
	date: 0,
	duration: 0,
	nbOfPlayers: 0,
	ListOfPlayers: [
		{
		name: '',
		points: 0,		
		},
	],
	winner: {
		name: '',
		points: 0,
	}
}

let gameIsRunning = false;

const socketio = require('socket.io');

const ioServer = socketio(server);

ioServer.on('connection', (socket) => {
  console.log('connexion établie');

  const player = {
    id : socket.id,
    name : ' ',
    hand : giveHand(4),
    nbOfCard : 4,
    streaks : 1,
    points : 0,
  }

  socket.on('saveUsername', (data) => {
    player.name = data.username;
    player.avatar = data.avatar;
    allPlayer.push({
      id : player.id,
      avatar : player.avatar,
      name : player.name,
      hand : player.hand,
      ready : false,
      points : player.points
    });
    socket.broadcast.emit('newPlayer', player);
  });

  socket.on('askForOtherPlayer', () => {
    socket.emit('askForOtherPlayer', allPlayer.slice(0, (allPlayer.length-1)));
  });
  
  socket.emit('giveHand', player);

  ioServer.emit("notReadyToPlay");

  socket.on('playerIsReady', () => {
    allPlayer.forEach(Oneplayer => {
      if(Oneplayer.id == player.id){
        Oneplayer.ready = true;
      }
    });
    let everybodyReady = true;
    allPlayer.forEach(player => {
      if(player.ready === false ){
        everybodyReady = false;
      }
    });
    if(allPlayer.length <= 1){
      everybodyReady = false;
    }
    // return everybodyReady;
    if(everybodyReady === true){
      gameIsRunning = true;
      game.date = new Date();
      game.nbOfPlayers = allPlayer.length;
      ioServer.emit('startGaming', {firstPlayer : allPlayer[0]});
      ioServer.to(allPlayer[0].id).emit("readyToPlay", {firstPlayer : true});
    }
  });

  socket.on('eventPositionned', (datas) => {
    if(datas.position){
      player.nbOfCard -= 1;
      player.points += 100 * player.streaks;
      player.streaks += 0.2;
    }
    if(player.nbOfCard == 0 && player.points > 400){
      ioServer.emit('weHaveAWinner', player);
      game.winner.name = player.name;
      game.winner.points = player.points;
      game.duration = new Date();
      game.listOfPlayers = allPlayer;
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
    const nextPlayer = getNextPlayer(player.id);
    socket.broadcast.emit('eventPositionned', {innerHTML : datas.innerHTML});
    ioServer.emit('renderDate', datas.actualCard);
    ioServer.to(player.id).emit("notReadyToPlay");
    ioServer.to(nextPlayer.id).emit("readyToPlay", {firstPlayer : false});
    allPlayer[getIndexInAllPlayer(player.id)].points = player.points;
    ioServer.emit('whoNeedToPlay', {nextPlayer : nextPlayer, player : player}); //changer nom variable player = ancien player pour les points 
  });

  socket.on('requestServerCheck', (datas) => {
    const order = datas.order;
    const orderFullInformation = [];
    let actualCard;
    order.forEach(card => {
      allCardGiven.forEach(cardFullInfo => {
        if(card == cardFullInfo._id){
          orderFullInformation.push(cardFullInfo);
          if(datas.cardId == cardFullInfo._id)
            actualCard = cardFullInfo;
        }
      });
    });
    let returnValue = true;
    for(let i = 1; i<orderFullInformation.length; i++) {
      if(orderFullInformation[i].date < orderFullInformation[i-1].date){
        returnValue = false;
      }
    };
    //return returnValue;
    const retour = returnValue;
    socket.emit('responseServerCheck', {returnValue : retour, index : datas.index, actualCard : actualCard});
  });

  socket.on('wrongPosition', (innerHTML) => {
    player.streak = 1;
    player.points -= 50;
    socket.broadcast.emit('wrongPosition', innerHTML);
  });

  socket.on('disconnect', (socket) => {
    allPlayer.forEach((playerInArray, index) => {
      if(playerInArray.id == player.id){
        playerInArray.hand.forEach(card => {
          dataBase.forEach(event => {
            if(event.titre === card.titre){
              event.given = false;
            }
          })
        });
        allPlayer.splice(index, 1);
      }
    });
    if(gameIsRunning){
      ioServer.emit('onePlayerIsGone', {name : player.name, running : true});
    } else {
      ioServer.emit('onePlayerIsGone', {id : player.name, running : false, id : player.id});
    }
  });

});
