'use strict'

/**
 * Module représentant la partie en cours
 */

 const everyPlayer = require('./module-competitor.js');

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
  start : function (array) {
    this.running = true;
    this.date = new Date();
    this.nbOfPlayers = array.length;
  },
	win : function (player) {
		this.winner.name = player.name;
		this.winner.points = player.points;
		this.duration = new Date();
		this.listOfPlayers = everyPlayer.list;
	}
}

module.exports = game;