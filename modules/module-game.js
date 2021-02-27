'use strict'

// module requis
const everyPlayer = require('./module-competitor.js');


/**
 * Module représentant la partie en cours
 */


 // objet représentant une partie
class Game {
	constructor () {
		this.date= 0;
		this.duration= 0;
		this.nbOfPlayers= 0;
		this.ListOfPlayers= [
			{
			name: '',
			points: 0,		
			}
		];
		this.winner= {
			name: '',
			points: 0,
		};
		this.room= '';
  	this.running = false;
	};
	// methode pour lancer la partie
  start (array) {
    this.running = true;
    this.date = new Date();
    this.nbOfPlayers = array.length;
  };
	// methode lorsque qu'un joueur à gagné
	win (player) {
		this.room = player.room;
		this.winner.name = player.name;
		this.winner.points = player.points;
		this.duration = new Date();
		this.listOfPlayers = everyPlayer[player.room];
	};
};

// objet représentant les différents parties possible
const game = {
	france : new Game(),
	classique : new Game(),
	invention : new Game()
}


// export du module
module.exports = game;