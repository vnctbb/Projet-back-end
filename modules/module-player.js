'use strict'


// module personnalisé
const distribution = require('./module-distribution.js');
const everyPlayer = require('./module-competitor.js');


/**
 * Module pour créer de nouveau joueur
 */


// constructeur de joueur
class Player {
  constructor (id, username, db, avatar,room) {
    this.id = id;
    this.name = username.charAt(0).toUpperCase() + username.substring(1).toLowerCase();
    this.hand = distribution.giveHand(4, db, room);
    this.avatar = avatar;
    this.nbOfCard = 4;
    this.streaks = 1;
    this.points = 0;
    this.room = room;
    this.ready = false;
  };
  // méthode pour passer ready à true
  nowReady (value) {
    everyPlayer[value].forEach(onePlayer => {
      if(onePlayer.id == this.id){
        this.ready = true;
        onePlayer.ready = true;
      }
    });
  }
  // methode carte bien positionnée
  positionOk (index) {
    // retire la carte de la main
    this.hand.splice(index, 1);
    // gestion du nombre de carte restante, et des points
    this.nbOfCard -= 1;
    this.points += 100 * this.streaks;
    this.streaks += 0.2;
  }
  // modification à faire si la carte est mal placé
  positionNotOk (index, db) {
    this.points -= 50;
    this.streaks = 1;
    this.hand.splice(index, 1);
    // envoi d'une nouvelle carte
    this.hand.push(distribution.takeCard(db, this.room));
  }
  // envoi d'une nouvelle carte, si la position est bonne
  needNewCard (db) {
    this.nbOfCard += 1;
    this.hand.push(distribution.takeCard(db, this.room));
  }
}

// fonction pour créer un joueur
function createPlayer (socket, id, username, db, avatar, room) {
  // créer le joueur
  const player = new Player(id, username, db, avatar, room);
  // ajouter le joueur au tableau des joueurs
  everyPlayer[player.room].push(player);
  // renvoi aux autres joueurs les informations du joueur créé
  socket.to(player.room).broadcast.emit('newPlayerInLobby', player);
  // renvoi au joueur créé toute ses informations
  socket.emit('giveHand', {player : player});

  return player;
};


// export du module
module.exports = createPlayer;