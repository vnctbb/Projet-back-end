'use strict'

const express = require('express');
const path = require('path');
const app = express();

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({
  extended : false
}));

const PORT = process.env.PORT || 3000;

app.use('/css', express.static(__dirname + '/public/css'));
app.use('/js', express.static(__dirname + '/public/javascript'));
app.use('/img', express.static(__dirname + '/public/img'));

app.set('view engine', 'pug');

/**
 * Serveur HTTP
 */

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/lobby', (req, res) => {
  const username = req.body.username;
  let error = false;
  allPlayer.forEach(player => {
    if(player.name == req.body.username){
      error = 'taken';
    }
  });
  if(req.body.username == ''){
    res.render('index', {error : 'empty'})
  }
  if(error){
    res.render('index', {error : error});
  } else {
    res.render('lobby', {username : username});
  }
});

app.use( (req, res) => {
  res.status(404).send('error404');
});

const server = app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});

/**
 * Fake bdd
 */

const dataBase = [
  {
    titre : 'Apparition des abeilles',
    date : -1000000,
    given : false
  },
  {
    titre : 'Premier village',
    date : -10000,
    given : false
  }
  ,
  {
    titre : 'Création de la NBA',
    date : 1946,
    given : false
  }
  ,
  {
    titre : 'Création de Facebook',
    date : 2004,
    given : false
  }
  ,
  {
    titre : 'Sortie du premier Star Wars',
    date : 1981,
    given : false
  }
  ,
  {
    titre : 'Apparition de la fourchette',
    date : 972,
    given : false
  }
  ,
  {
    titre : 'Invention de la boite de conserve',
    date : 1810,
    given : false
  }
  ,
  {
    titre : 'Invention du vin',
    date : -6000,
    given : false
  }
  ,
  {
    titre : 'Naissance du Hip-Hop',
    date : 1974,
    given : false
  }
  ,
  {
    titre : 'Domestication du chat',
    date : -4500,
    given : false
  }
  ,
  {
    titre : 'Apparition du croissant',
    date : 1683,
    given : false
  }
  ,
  {
    titre : 'Découverte du mouvement des planètes',
    date : 1513,
    given : false
  }
];

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
    const item = dataBase[index];
    hand.push(item);
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
    allPlayer.push({
      id : player.id,
      name : player.name,
      hand : player.hand,
      ready : false
    });
    socket.broadcast.emit('newPlayer', player);
  });

  socket.on('askForOtherPlayer', () => {
    socket.emit('askForOtherPlayer', allPlayer.slice(0, (allPlayer.length-1)));
  });

  // Faire une route style 'new-player', avec la valeur d'un input pour donner le nom du player,
  // A ce moment là le push dans le tableau,

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
      ioServer.emit('startGaming', {firstPlayer : allPlayer[0]});
      ioServer.to(allPlayer[0].id).emit("readyToPlay", {firstPlayer : true});
    }
  });

  //ioServer.emit('notReadyToPlay')

  //ioServer.to(allPlayer[0].id).emit('readyToPlay');

  socket.on('eventPositionned', (datas) => {
    if(datas.position){
      player.nbOfCard -= 1;
      player.points += 100 * player.streaks;
      player.streaks += 0.5;
    }
    if(player.nbOfCard == 0){
      ioServer.emit('weHaveAWinner', player);
    };
    const nextPlayer = getNextPlayer(player.id);
    socket.broadcast.emit('eventPositionned', datas.innerHTML);
    ioServer.to(player.id).emit("notReadyToPlay");
    ioServer.to(nextPlayer.id).emit("readyToPlay", {firstPlayer : false});
    ioServer.emit('whoNeedToPlay', {nextPlayer : nextPlayer, player : player}); //changer nom variable player = ancien player pour les points 
  });

  socket.on('wrongPosition', (innerHTML) => {
    player.streak = 0;
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
