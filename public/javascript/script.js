'use strict'

/**
 * Connexion WebSocket
 */

const socket = io();

socket.on('connect', (req, res) => {
  console.log('connection établie');

  socket.emit('saveUsername', {username : username});

  socket.emit('askForOtherPlayer');
  
  socket.on('askForOtherPlayer', (allPlayer) => {
    allPlayer.forEach(player => {
      console.log(player);
      const h2 = document.createElement('h2');
      h2.className = 'playerName';
      h2.innerText = player.name;
      document.querySelector('.otherPlayerList').appendChild(h2);
    });
  });
});

socket.on('newPlayer', (player) => {
  console.log(player);
  const h2 = document.createElement('h2');
  h2.className = 'playerName';
  h2.innerText = player.name;
  document.querySelector('.otherPlayerList').appendChild(h2);
});

socket.on('giveHand', (player) => {

  renderPlayer(player, true, 'player', 'container', 'draggable');
  
  draggables = document.querySelectorAll('.draggable');
  containers = document.querySelectorAll('.container');

  draggables.forEach(draggable => {

    draggable.addEventListener('dragstart', () => {
      draggable.classList.add('dragging');
    });
  
    draggable.addEventListener('dragend', () => {
      draggable.classList.remove('dragging');
      draggable.classList.add('last-dragged');
      const checkingPosition = getPositionLastDragged();
      console.log(checkingPosition);
      const orderListEvent = document.querySelector('.reception').innerHTML;
      socket.emit('eventPositionned', {innerHTML : orderListEvent});
      const listMyEvent = document.querySelector('.container').innerHTML;
      if(checkingPosition === true){
        //draggable.draggable = false; // aussi changer les draggable to not draggable
        const orderListEvent = document.querySelector('.reception').innerHTML;
        socket.emit('eventPositionned', {innerHTML : orderListEvent, position : true});
      } else {
        setTimeout(() => {
          draggable.draggable = true;
          const container = document.querySelector('.player');
          container.appendChild(draggable);
          const order = document.querySelector('.reception').innerHTML;
          socket.emit('wrongPosition', order);
        }, 500);
      }
    });
  });
  
  containers.forEach(container => {
    container.addEventListener('dragover', e => {
      e.preventDefault();
      const afterElement = getDragAfterElement(container, e.clientY);
      const draggable = document.querySelector('.dragging');
      if(afterElement == null) {
        container.appendChild(draggable);
      } else {
        container.insertBefore(draggable, afterElement);
      }
    });
  });
  
  
  function getDragAfterElement(container, y) {
    console.log('ici');
    const draggableElements = [...container.querySelectorAll('.draggable:not(.dragging)')];
  
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child};
      } else {
        return closest
      }
    }, {offset : Number.NEGATIVE_INFINITY}).element;
  };
  
  function getPositionLastDragged() {
    console.log('la');
    const container = document.querySelector('.reception')
    const draggableInOrder = [...container.getElementsByClassName('draggable')];
    let returnValue = true;
    for(let i = 1; i<draggableInOrder.length; i++) {
      if(parseFloat(draggableInOrder[i].id) > parseFloat(draggableInOrder[i-1].id)){
      } else {
        returnValue = false;
      }
    };
    return returnValue;
  };
});

socket.on('readyToPlay', (data) => {
  draggables.forEach(draggable => {
    draggable.draggable = true;
  });
});

socket.on('notReadyToPlay', (data) => {
  draggables.forEach(draggable => {
    draggable.draggable = false;
  });
});

socket.on('eventPositionned', (innerHTML) => {
  document.querySelector('.reception').innerHTML = innerHTML;
});

socket.on('wrongPosition', (innerHTML) => {
  document.querySelector('.reception').innerHTML = innerHTML;
});

socket.on('weHaveAWinner', (data) => {
  console.log('win');
  const div = document.createElement('div');
  div.className = 'winnerMenu'
  div.innerHTML = `<p>${data.name} à gagné !</p><a href="/">Retour à l'accueil</a>`;
  document.body.appendChild(div);
});

/**
 * Game engine
 */

let draggables = document.querySelectorAll('.draggable');
let containers = document.querySelectorAll('.container');