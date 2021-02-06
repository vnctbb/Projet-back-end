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
      const div = document.createElement('div');
      div.id = player.id;
      const h3 = document.createElement('h3');
      h3.className = 'playerName';
      h3.innerText = player.name;
      const p = document.createElement('p');
      p.innerText = 'Points : ';
      div.appendChild(h3);
      div.appendChild(p);
      document.querySelector('.otherPlayerList').appendChild(div);
    });
  });
});

const button = document.querySelector('.buttonReady');
const fasTimes = document.querySelector('.fa-times');

button.addEventListener('click', () => {
  if(button.innerText == 'Prêt à jouer?'){
    button.innerText = 'Prêt !';
    fasTimes.classList.remove('fa-times', 'red');
    fasTimes.classList.add('fa-check', 'green');
    socket.emit('playerIsReady');
  } else {
    console.log('ici');
    button.innerText = 'Prêt à jouer?';
    fasTimes.classList.remove('fa-check', 'green');
    fasTimes.classList.add('fa-times', 'red');
    socket.emit('playerIsNotReady');
  }
});

socket.on('newPlayer', (player) => {
  const div = document.createElement('div');
  div.id = player.id;
  const h3 = document.createElement('h3');
  h3.className = 'playerName';
  h3.innerText = player.name;
  const p = document.createElement('p');
  p.innerText = 'Points : ';
  div.appendChild(h3);
  div.appendChild(p);
  document.querySelector('.otherPlayerList').appendChild(div);
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
      if(draggable.parentNode.className === 'container reception'){
        const orderListEvent = document.querySelector('.reception').innerHTML;
        socket.emit('eventPositionned', {innerHTML : orderListEvent});
        if(checkingPosition === true){
          draggable.draggable = false;
          console.log(draggable.draggable);
          const orderListEvent = document.querySelector('.reception').innerHTML;
          socket.emit('eventPositionned', {innerHTML : orderListEvent, position : true});
        } else {
          setTimeout(() => {
            const container = document.querySelector('.player');
            container.appendChild(draggable);
            const order = document.querySelector('.reception').innerHTML;
            socket.emit('wrongPosition', order);
          }, 500);
        }
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
  console.log(data);
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