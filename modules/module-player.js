'use strict'

// module personnalisé
const distribution = require('./module-distribution.js');
const everyPlayer = require('./module-competitor.js');

/**
 * Module pour créer de nouveau joueur
 */

// constructeur de joueur
class Player {
  constructor (id, username, db, avatar) {
    this.id = id;
    this.name = username;
    this.hand = distribution.giveHand(4, db);
    this.avatar = avatar;
    this.nbOfCard = 4;
    this.streaks = 1;
    this.points = 0;
    this.ready = false;
  };
  // méthode pour passer ready à true
  nowReady () {
    everyPlayer.list.forEach(onePlayer => {
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
}

// fonction pour créer un joueur
function createPlayer (socket, id, username, db, avatar) {
  // créer le joueur
  const player = new Player(id, username, db, avatar);
  // ajouter le joueur au tableau des joueurs
  everyPlayer.list.push(player);
  // renvoi aux autres joueurs les informations du joueur créé
  socket.broadcast.emit('newPlayerInLobby', player);
  // renvoi au joueur créé toute ses informations
  socket.emit('giveHand', {player : player});

  return player;
};

// export du module
module.exports = createPlayer;