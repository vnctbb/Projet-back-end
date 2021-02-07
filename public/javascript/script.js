'use strict'

/**
 * Connexion WebSocket
 */

const socket = io();

socket.on('connect', (req, res) => {
  console.log('connection établie');

  socket.emit('saveUsername', {username : username, avatar : avatar});

  socket.emit('askForOtherPlayer');
  
  socket.on('askForOtherPlayer', (allPlayer) => {
    allPlayer.forEach(player => {
      renderOtherPlayer(player);
    });
  });
});

const button = document.querySelector('.buttonReady');

button.addEventListener('click', () => {
  clickOnReadyButton();
});

socket.on('newPlayer', (player) => {
  renderOtherPlayer(player);
});

socket.on('giveHand', (player) => {

  renderPlayer(player);
  
  draggables = document.querySelectorAll('.draggable');
  containers = document.querySelectorAll('.container');

  draggables.forEach((draggable) => {

    draggable.addEventListener('dragstart', () => {
      draggable.classList.add('dragging');
    });
  
    draggable.addEventListener('dragend', () => {
      draggable.classList.remove('dragging');
      draggable.classList.add('last-dragged');
      getPositionLastDragged(draggable);      
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
  
  function getPositionLastDragged(draggable, index) {
    const container = document.querySelector('.reception')
    const draggableInOrder = [...container.getElementsByClassName('draggable')];
    const order = [];
    draggableInOrder.forEach(draggableOrder => {
      order.push(draggableOrder.id);
    });
    if(draggable.parentNode.className === 'container reception'){
      socket.emit('requestServerCheck', {order : order, index : index});
    }
  };
});

socket.on('responseServerCheck', (datas) => {
  const checkingPosition = datas.returnValue;
  const myDrag = draggables[0];
  console.log(draggables);
  if(myDrag.parentNode.className === 'container reception'){
    const orderListEvent = document.querySelector('.reception').innerHTML;
    socket.emit('eventPositionned', {innerHTML : orderListEvent});
    if(checkingPosition === true){
      myDrag.draggable = false;
      const orderListEvent = document.querySelector('.reception').innerHTML;
      socket.emit('eventPositionned', {innerHTML : orderListEvent, position : true});
    } else {
      setTimeout(() => {
        const container = document.querySelector('.player');
        container.appendChild(myDrag);
        const order = document.querySelector('.reception').innerHTML;
        socket.emit('wrongPosition', order);
      }, 500);
    }
  } else {
  }
});

socket.on('readyToPlay', (data) => {
  if(data.firstPlayer){
    setTimeout(() => {
      draggables = document.querySelectorAll('.draggable');
      draggables.forEach(draggable => {
        if(draggable.parentNode.className === 'player container'){
          draggable.draggable = true;
        }
      });
    }, 5000);
  } else {
    draggables = document.querySelectorAll('.draggable');
    draggables.forEach(draggable => {
      if(draggable.parentNode.className === 'player container'){
        draggable.draggable = true;
      }
    });
  }
});

socket.on('notReadyToPlay', (data) => {
  draggables = document.querySelectorAll('.draggable');
  draggables.forEach(draggable => {
    draggable.draggable = false;
  });
});

socket.on('whoNeedToPlay', (data) => {
  document.querySelector('h2').innerText = `${data.nextPlayer.name} c'est ton tour de jouer !`;
  const div = document.getElementById(`${data.player.id}`);
  div.querySelector('.playerPoints').innerText = `Points : ${data.player.points}`;
});

socket.on('eventPositionned', (innerHTML) => {
  document.querySelector('.reception').innerHTML = innerHTML;
});

socket.on('wrongPosition', (innerHTML) => {
  document.querySelector('.reception').innerHTML = innerHTML;
});

socket.on('weHaveAWinner', (data) => {
  const div = document.createElement('div');
  div.className = 'winnerMenu'
  div.innerHTML = `<p>${data.name} à gagné à la partie!</p><p>${data.points} points</p><a href="/">Retour à l'accueil</a>`;
  document.body.appendChild(div);
});

socket.on('startGaming', (data) => {
  button.disabled = true;
  let secondes = 5;
  const interval = setInterval(() => {
    document.querySelector('h2').innerText = `Lancement de la partie dans ${secondes} secondes`;
    secondes -= 1;
  }, 1000);
  window.setTimeout(() => {
    clearInterval(interval);
    document.querySelector('h2').innerText = `C'est parti ! ${data.firstPlayer.name} c'est à toi de jouer`;
  }, 6000);
});

socket.on('onePlayerIsGone', (data) => {
  if(data.running){
    const affichage = document.querySelector('.winnerMenu');
    if(!affichage){
      const div = document.createElement('div');
      div.className = 'winnerMenu'
      div.innerHTML = `<p>${data.name} à quitté la partie!</p><a href="/">Retour à l'accueil</a>`;
      document.body.appendChild(div);
    }
  } else {
    const id = `${data.id}`
    const child = document.getElementById(id);
    child.remove();
  }
});

/**
 * Game engine
 */

let draggables = document.querySelectorAll('.draggable');
let containers = document.querySelectorAll('.container');