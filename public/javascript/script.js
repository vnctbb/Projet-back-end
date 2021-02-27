'use strict'

/**
 * Connexion WebSocket
 */

const socket = io();

socket.on('connect', (req, res) => {
  console.log('connection établie');

  // Envoi au serveur les informations du joueur qui vient de se connecter
  socket.emit('savePlayerInformation', {username : username, avatar : avatar, room : room});

  console.log(window.location.href);
  socket.on('dataBaseError', () => {
    console.log('je viens ici');
    window.location = "http://localhost:3000/";
  });

  // Demande au serveur si d'autre joueurs sont déja dans le lobby
  socket.emit('askForOtherPlayer');
  
  // Reception les informations des joueurs déja dans le lobby
  socket.on('otherPlayerInLobby', (allPlayer) => {
    console.log('other player in lobby')
    allPlayer.forEach(player => {
      // Applique la fonction qui permet d'afficher les autres joueurs
      // pour chaque joueur
      renderOtherPlayer(player);
    });
  });
});

socket.on('bonjour', (data) => {
  console.log(`room ${data}`);
})

// Récupération du boutton "Prêt"
const button = document.querySelector('.buttonReady');

// Event "click" sur le bouton
button.addEventListener('click', () => {
  button.disabled = true;
  // Applique la fonction de changement de status
  clickOnReadyButton();
});

// Récupération du formulaire du chat

const form = document.getElementById("chat");

// Event "submit" sur le formulaire
form.addEventListener('submit', (e) => {
  e.preventDefault();
  submitMessage(e);
  form.reset();
});

socket.on('newMessage', datas => {
  newMessage(datas, "newMessage");
});

socket.on('myMessage', datas => {
  newMessage(datas, "myMessage");
});

// Reception les informations de joueur arrivé après
socket.on('newPlayerInLobby', (player) => {
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
  containers = document.querySelectorAll('.containers');

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
    insertEventBeforeOfAfter(container);
  });
  
});

socket.on('serverResponseToCardCheck', (datas) => {
  //document.querySelector('h2').innerHTML = `<i class="fas fa-spinner"></i>`;
  renderPlayground(datas.orderWithFullInformation);
});

socket.on('wrongPosition', (datas) => {
  renderPlayground(datas);
});

socket.on('readyToPlay', (data) => {
  if(data.firstPlayer){
    setTimeout(() => {
      draggables = document.querySelectorAll('.draggable');
      draggables.forEach(draggable => {
        if(draggable.parentNode.className === 'player containers'){
          draggable.draggable = true;
        }
      });
    }, 5000);
  } else {
    draggables = document.querySelectorAll('.draggable');
    draggables.forEach(draggable => {
      if(draggable.parentNode.className === 'player containers'){
        draggable.draggable = true;
      }
    });
  }
  draggables = document.querySelectorAll('.draggable');
  containers = document.querySelectorAll('.containers');
  draggables.forEach((draggable, index) => {
    draggable.classList.remove('notAllowed');

    draggable.addEventListener('dragstart', () => {
      draggable.classList.add('dragging');
    });
  });
});

socket.on('notReadyToPlay', () => {
  draggables = document.querySelectorAll('.draggable');
  draggables.forEach(draggable => {
    draggable.classList.add('notAllowed');
    draggable.draggable = false;
  });
  draggables = document.querySelectorAll('.draggable');
  containers = document.querySelectorAll('.containers');
  draggables.forEach((draggable, index) => {

    draggable.addEventListener('dragstart', () => {
      draggable.classList.remove('dragging');
    });
  });
});

socket.on('nextPlayerToPlay', (data) => {
  document.querySelector('h2').innerText = `${data.nextPlayer.name} c'est ton tour de jouer !`;
  const div = document.getElementById(`${data.player.id}`);
  div.querySelector('.playerPoints').innerText = `Points : ${data.player.points}`;
});

socket.on('answerIsFalse', () => {
  const answer = document.createElement('div')
  answer.classList.add('answer', 'answerIsFalse')
  const p = document.createElement('p');
  p.className = "answerText";
  p.innerText = 'FAUX';
  answer.appendChild(p);
  document.body.appendChild(answer);
  setTimeout(() => {
    answer.remove()
  }, 4500)
});

socket.on('answerIsTrue', () => {
  const answer = document.createElement('div')
  answer.classList.add('answer', 'answerIsTrue')
  const p = document.createElement('p');
  p.className = "answerText";
  p.innerText = 'VRAI';
  answer.appendChild(p);
  document.body.appendChild(answer);
  setTimeout(() => {
    answer.remove()
  }, 4500)
});

socket.on('somebodyWin', (data) => {
  console.log("somebody win")
  const div = document.createElement('div');
  div.className = 'winnerMenu'
  div.innerHTML = `<p>${data.name} à gagné à la partie!</p><p>${data.points} points</p><a href="/">Retour à l'accueil</a>`;
  document.body.appendChild(div);
});

socket.on('startGaming', (data) => {
  let secondes = 5;
  const interval = setInterval(() => {
    const h2Element = document.querySelector('h2');
    h2Element.innerText = `Lancement de la partie dans ${secondes} secondes`;
    secondes -= 1;
  }, 1000);
  window.setTimeout(() => {
    clearInterval(interval);
    const h2Element = document.querySelector('h2');
    h2Element.innerText = `C'est parti ! ${data.firstPlayer.name} c'est à toi de jouer`;
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

// initialisation des variables draggables & container
let draggables = document.querySelectorAll('.draggable');
let containers = document.querySelectorAll('.containers');