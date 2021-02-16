'use strict'

// module personnalisé
const toolbox = require('./module-toolbox');

/**
 * Module contenant la liste de tous les joueurs
 */

// déclaration de l'objet rassemblant tous les joueurs
const everyPlayer = {
  // tableau contenant les joueurs
  list : [],

  // méthode pour changer le status prêt ou non
  verificationAllPlayerAreReady : function (actualGame, ioServer) {
    // déclaration variable pour dire tous les joueurs sont prêts
    let playersReady = true;
    // boucle sur le tableau, si un joueur n'est pas prêt on passe la variable à faux
    this.list.forEach(onePlayer => {
      if(onePlayer.ready === false){
        playersReady = false;
      }
    });
    // si le tableau des joueurs contient moins de deux joueurs alors la variable est fausse
    if(this.list.length < 2){
      playersReady = false;
    }
    // si la variable est prête le jeu se lance
    if(playersReady){
      // demande d'un chiffre aléatoire pour determiner le premier à jouer
      //const rand = toolbox.getRandomNumber(this.list);
      // appel de la méthode start du module game
      actualGame.start(everyPlayer.list);
      // envoi à tous les joueurs le jeu commence (avec le joueur qui doit commencer)
      ioServer.emit('startGaming', {firstPlayer : everyPlayer.list[0]});
      // envoi au premier à joueur qu'il doit jouer
      ioServer.to(everyPlayer.list[0].id).emit("readyToPlay", {firstPlayer : true});
    }
  }
};

// export du module
module.exports = everyPlayer;