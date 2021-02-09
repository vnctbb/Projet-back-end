'use strict'

/**
 * Module contenant la liste de tous les joueurs
 */

const everyPlayer = {
  list : [],
  ready : function () {
    let playersReady = true;
    this.list.forEach(onePlayer => {
      if(onePlayer.ready === false){
        playersReady = false;
      }
    });
    if(this.list.length < 2){
      playersReady = false;
    }
    return playersReady;
  }
};


module.exports = everyPlayer;