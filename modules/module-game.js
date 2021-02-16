'use strict'

// module personnalisé
const everyPlayer = require('./module-competitor.js');

/**
 * Module représentant la partie en cours
 */

 // objet représentant une partie
const game = {
	date: 0,
	duration: 0,
	nbOfPlayers: 0,
	ListOfPlayers: [
		{
		name: '',
		points: 0,		
		},
	],
	winner: {
		name: '',
		points: 0,
	},
  running : false,
	// methode pour lancer la partie
  start : function (array) {
    this.running = true;
    this.date = new Date();
    this.nbOfPlayers = array.length;
  },
	// methode lorsque qu'un joueur à gagné
	win : function (player) {
		this.winner.name = player.name;
		this.winner.points = player.points;
		this.duration = new Date();
		this.listOfPlayers = everyPlayer.list;
	}
}

// export du module
module.exports = game;