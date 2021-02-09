/** 
 * Fonction pour l'affichage du joueur
*/
const renderPlayer = (player) => {
  document.querySelector('.playerList').id = player.id;

  const newPlayer = document.createElement('div');
  newPlayer.classList.add('player', 'container');

  player.hand.forEach((card, index) => {
    const newCard = document.createElement('p');
    newCard.id = card.id;
    newCard.draggable = true;
    newCard.classList.add('draggable');
    newCard.innerHTML = card.titre;
    newPlayer.appendChild(newCard);
  });

  document.querySelector('.playerList').appendChild(newPlayer);
};

const renderDeck = (player) => {
  const div = document.querySelector('.player');
  div.innerText = '';
  player.hand.forEach((card, index) => {
    const newCard = document.createElement('p');
    newCard.id = card.id;
    newCard.draggable = false;
    newCard.classList.add('draggable');
    newCard.innerHTML = card.titre;
    console.log(newCard);
    div.appendChild(newCard);
  });
};

/**
 * Fonction pour l'affichage des autres joueurs
*/
const renderOtherPlayer = (player) => {
  const div = document.createElement('div');
  div.id = player.id;

  const sousDiv = document.createElement('div');
  const sousDivDeux = document.createElement('div');

  const img = document.createElement('img');
  img.src = `/img/avatar/${player.avatar}.png`;
  img.style.width = '100px';

  const h3 = document.createElement('h3');
  h3.className = 'playerName';
  h3.innerText = player.name;

  const p = document.createElement('p');
  p.className = 'playerPoints';
  p.innerText = 'Points : ';

  div.appendChild(sousDiv);
  div.appendChild(sousDivDeux);

  sousDiv.appendChild(img);
  sousDivDeux.appendChild(h3);
  sousDivDeux.appendChild(p);

  document.querySelector('.otherPlayerList').appendChild(div);
};

/**
 * Fonction changement statut prêt ou non lors du clique
 */
const clickOnReadyButton = () => {
  if(button.innerText == 'Prêt à jouer?'){
    const fas = document.querySelector('.fa-times');
    button.innerText = 'Prêt !';
    fas.classList.remove('fa-times', 'red');
    fas.classList.add('fa-check', 'green');
    socket.emit('playerIsReady');
  } else {
    const fas = document.querySelector('.fa-check');
    button.innerText = 'Prêt à jouer?';
    fas.classList.remove('fa-check', 'green');
    fas.classList.add('fa-times', 'red');
    socket.emit('playerIsNotReady');
  }
};

/**
 * Fonction pour déplacer l'élément qui est pris
 */

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