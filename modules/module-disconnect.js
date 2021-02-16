'use strict'

// module personnalisé
const game = require('./module-game');
const everyPlayer = require('./module-competitor');
const treatmentDatabase = require('./module-database');

/**
 * Module pour la déconnexion d'un joueur
 */

// fonction pour retirer les cartes d'un joueur
function removeCards (player, dataBase) {
  // remet en jeu les cartes du joueurs retiré
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
  console.log(`Les cartes du joueur ont été enlevé !`)
};

// fonction pour retirer un joueur
function removePlayer (player, dataBase, ioServer) {
  // si la partie est en cours, termine la partie
  if(game.running){
    // envoi aux joueurs de l'arrêt du jeu
    ioServer.emit('onePlayerIsGone', {name : player.name, running : true});
    game.running = false;
    // reset de la variable dataBase
    treatmentDatabase.find({
      collection : 'events',
      done : (datas) => {
        dataBase = datas;
      }
    });
  } else {
    // si la partie n'a pas commencé, on retire juste le joueur de la partie
    ioServer.emit('onePlayerIsGone', {name : player.name, id : player.id, running : false});
  }
};

// export du module
module.exports = {
  removeCards : removeCards,
  removePlayer : removePlayer
}