'use strict'

/**
 * Connexion WebSocket
 */

const socket = io();

socket.on('connect', (req, res) => {
  console.log('connection établie');

  socket.emit('askForOtherPlayer');
  
  socket.on('askForOtherPlayer', (allPlayer) => {
    console.log(allPlayer); // Fonction qui mettra en place tous les noms des joueurs
  });
});

socket.on('newPlayer', (player) => {
  console.log(player) // Même fonction que celle du dessus;
});

socket.on('giveHand', (player) => {
  renderPlayer(player, true);
});

socket.on('readyToPlay', () => {

});

socket.on('eventPositionned', (innerHTML) => {
  document.querySelector('.reception').innerHTML = innerHTML;
});

socket.on('otherEventPosition', (datas) => {
  document.getElementById(datas.id).innerHTML = datas.innerHTML;
});

socket.on('playerDisconnect', (id) => {
  const toRemove = document.getElementById(id);
  document.querySelector('.playerList').removeChild(toRemove);
});

/**
 * Game engine
 */

let draggables = document.querySelectorAll('.draggable');
let containers = document.querySelectorAll('.container');

draggables = document.querySelectorAll('.draggable');
containers = document.querySelectorAll('.container');
draggableIteration(draggables);

containersIteration(containers);