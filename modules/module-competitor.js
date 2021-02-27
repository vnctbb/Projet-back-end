'use strict'


/**
 * module contenant la liste de tous les joueurs
 */


// module requis
const toolbox = require('./module-toolbox');

// déclaration de l'objet rassemblant tous les joueurs
const everyPlayer = {
  // tableau contenant les joueurs, réparti par room
  france : [],
  classique : [],
  invention : [],

  // méthode pour changer le status prêt ou non
  verificationAllPlayerAreReady : function (actualGame, room, ioServer) {
    // déclaration variable pour dire tous les joueurs sont prêts
    let playersReady = true;
    // boucle sur le tableau, si un joueur n'est pas prêt on passe la variable à faux
    this[room].forEach(onePlayer => {
      if(onePlayer.ready === false){
        playersReady = false;
      }
    });
    // si le tableau des joueurs contient moins de deux joueurs alors la variable est fausse
    if(this[room].length < 2){
      playersReady = false;
    }
    // si la variable est prête le jeu se lance
    if(playersReady){
      // demande d'un chiffre aléatoire pour determiner le premier à jouer
      const rand = toolbox.getRandomNumber(this[room]);
      // appel de la méthode start du module game
      actualGame.start(everyPlayer[room]);
      // envoi à tous les joueurs le jeu commence (avec le joueur qui doit commencer)
      ioServer.to(room).emit('startGaming', {firstPlayer : everyPlayer[room][rand]});
      // envoi au premier à joueur qu'il doit jouer
      ioServer.to(everyPlayer[room][rand].id).emit("readyToPlay", {firstPlayer : true});
    }
  }
};


// export du module
module.exports = everyPlayer;