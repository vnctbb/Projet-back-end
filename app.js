'use strict'

const express = require('express');
const path = require('path');
const app = express();

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
    return allPlayer[0].id;
  } else {
    return allPlayer[index+1].id;
  }
}

/**
* Serveur Websocket (avec socket.io)
*/

const allPlayer = [];

const socketio = require('socket.io');

const ioServer = socketio(server);

ioServer.on('connection', (socket) => {
  console.log('connexion établie');

  socket.on('askForOtherPlayer', () => {
    socket.emit('askForOtherPlayer', allPlayer.slice(0, (allPlayer.length-1)));
  });

  // Faire une route style 'new-player', avec la valeur d'un input pour donner le nom du player,
  // A ce moment là le push dans le tableau,

  const player = {
    id : socket.id,
    name : 'Claude',
    hand : giveHand(4)
  }

  allPlayer.push({
    id : socket.id,
    name : 'Claude',
    turn : false,
    hand : player.hand
  });

  socket.broadcast.emit('newPlayer', player);

  socket.emit('giveHand', player);

  ioServer.to(allPlayer[0].id).emit('readyToPlay', {turn : true});

  ioServer.emit('giveOtherPlayersHands', {player : player, allPLayer : allPlayer});

  socket.on('eventPositionned', (innerHTML) => {
    const nextPlayer = getNextPlayer(player.id);
    socket.broadcast.emit('eventPositionned', innerHTML);
    ioServer.to(player.id).emit("readyToPlay", {turn : false});
    ioServer.to(nextPlayer).emit("readyToPlay", {turn : true});
  });

  socket.on('myEventPosition', (innerHTML) => {
    socket.broadcast.emit('otherEventPosition', {id : player.id, innerHTML : innerHTML});
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
    ioServer.emit('playerDisconnect', player.id);
  });

});
