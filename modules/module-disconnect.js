'use strict'

// module requis
const game = require('./module-game');
const toolbox = require('./module-toolbox.js');
const everyPlayer = require('./module-competitor');
const treatmentDatabase = require('./module-database');
const distribution = require('./module-distribution');


/**
 * Module pour gérer la déconnexion d'un joueur
 */


// fonction pour retirer les cartes d'un joueur
function removeCards (player, dataBase) {
  // remet en jeu les cartes du joueurs retiré
  everyPlayer[player.room].forEach((playerInArray, index) => {
    if(playerInArray.id == player.id){
      playerInArray.hand.forEach(card => {
        dataBase.forEach(event => {
          if(event.titre === card.titre){
            event.given = false;
          }
        })
        distribution.allCardGiven[player.room].forEach(event => {
          if(event.titre === card.titre){
            const indexCarda = toolbox.getIndex(distribution.allCardGiven[player.room], event._id);
            distribution.allCardGiven[player.room].splice(indexCarda, 1);
          }
        })
      });
      everyPlayer[player.room].splice(index, 1);
    }
  });
  console.log(distribution.allCardGiven[player.room])
  console.log(`Les cartes du joueur ont été enlevé !`)
};

// fonction pour retirer un joueur
function removePlayer (player, dataBase, ioServer) {
  // si la partie est en cours, termine la partie
  if(game[player.room].running){
    // envoi aux joueurs de l'arrêt du jeu
    ioServer.to(player.room).emit('onePlayerIsGone', {name : player.name, running : true});
    game[player.room].running = false;
    // reset de la variable dataBase
    treatmentDatabase.find({
      collection : 'events',
      done : (datas) => {
        dataBase = datas;
      }
    });
  } else {
    // si la partie n'a pas commencé, on retire juste le joueur de la partie
    ioServer.to(player.room).emit('onePlayerIsGone', {name : player.name, id : player.id, running : false});
  }
};


// export du module
module.exports = {
  removeCards : removeCards,
  removePlayer : removePlayer
}