'use strict'

/**
 * Connexion WebSocket
 */

const socket = io();

socket.on('connect', (req, res) => {
  console.log('connection établie');

  // Envoi au serveur les informations du joueur qui vient de se connecter
  socket.emit('saveUsername', {username : username, avatar : avatar});

  // Demande au serveur si d'autre joueurs sont déja dans le lobby
  socket.emit('askForOtherPlayer');
  
  // Reception les informations des joueurs déja dans le lobby
  socket.on('askForOtherPlayer', (allPlayer) => {
    allPlayer.forEach(player => {
      // Applique la fonction qui permet d'afficher les autres joueurs
      // pour chaque joueur
      renderOtherPlayer(player);
    });
  });
});

// Récupération du boutton "Prêt"
const button = document.querySelector('.buttonReady');

// Event "click" sur le bouton
button.addEventListener('click', () => {
  // Applique la fonction de changement de status
  clickOnReadyButton();
});

// Reception les informations de joueur arrivé après
socket.on('newPlayer', (player) => {
  // Applique la fonction qui permet d'afficher les autres joueurs
  renderOtherPlayer(player);
});

// Variable qui permet de conserver l'élément en cours de déplacement
let activeDraggableElement;

// Reception des cartes
socket.on('giveHand', datas => {
  
  // Affichage du joueur connecté
  if(datas.newCard) {
    renderDeck(datas.player)
  } else {
    renderPlayer(datas.player);
  }

  draggables = document.querySelectorAll('.draggable');
  containers = document.querySelectorAll('.container');

  draggables.forEach((draggable, index) => {

    draggable.addEventListener('dragstart', () => {
      draggable.classList.add('dragging');
    });
  
    draggable.addEventListener('dragend', () => {
      draggable.classList.remove('dragging');
      draggable.classList.add('last-dragged');
      activeDraggableElement = draggable;
      getPositionLastDragged(draggable, index);      
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
  
  function getPositionLastDragged(draggable, index) {
    const container = document.querySelector('.reception')
    const draggableInOrder = [...container.getElementsByClassName('draggable')];
    const order = [];
    draggableInOrder.forEach(draggableOrder => {
      order.push(draggableOrder.id);
    });
    if(draggable.parentNode.className === 'container reception'){
      socket.emit('requestServerCheck', {order : order, index : index, cardId : draggable.id});
    }
  };
});

socket.on('responseServerCheck', (datas) => {
  const position = datas.returnValue;
  const draggedElement = activeDraggableElement;
  if(draggedElement.parentNode.className === 'container reception'){
    const orderListEvent = document.querySelector('.reception').innerHTML;
    socket.emit('eventPositionned', {innerHTML : orderListEvent, elementId : draggedElement.id});
    if(position === true){
      draggedElement.draggable = false;
      const orderListEvent = document.querySelector('.reception').innerHTML;
      socket.emit('eventPositionned', {innerHTML : orderListEvent, position : true, actualCard : datas.actualCard});
    } else {
      setTimeout(() => {
        const container = document.querySelector('.player');
        container.appendChild(draggedElement);
        const order = document.querySelector('.reception').innerHTML;
        socket.emit('wrongPosition', {innerHTML : order, elementId : draggedElement.id});
      }, 2500);
    }
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

socket.on('eventPositionned', (datas) => {
  document.querySelector('.reception').innerHTML = datas.innerHTML;
});

socket.on('renderDate', (card) => {
  if(card){
    const span = document.createElement('span');
    span.innerHTML = card.date;
    document.getElementById(card._id).appendChild(span);
  }
});

socket.on('wrongPosition', (datas) => {
  document.querySelector('.reception').innerHTML = datas.innerHTML;
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