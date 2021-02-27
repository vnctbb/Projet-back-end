/** 
 * Fonction pour l'affichage du joueur
*/
const renderPlayer = (player) => {
  document.querySelector('.mainPlayer').id = player.id;

  const newPlayer = document.createElement('div');
  newPlayer.classList.add('player', 'containers');

  player.hand.forEach((card, index) => {
    const newCard = document.createElement('p');
    newCard.id = card.id;
    newCard.draggable = false;
    newCard.classList.add('draggable');
    newCard.innerHTML = card.titre;
    newPlayer.appendChild(newCard);
  });

  document.querySelector('.mainPlayer').appendChild(newPlayer);
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

  document.querySelector('.otherPlayer').appendChild(div);
};

/**
 * Fonction pour l'affichage d'une main
 */
const renderDeck = (player) => {
  const div = document.querySelector('.player');
  div.innerText = '';
  player.hand.forEach((card, index) => {
    const newCard = document.createElement('p');
    newCard.id = card.id;
    newCard.draggable = false;
    newCard.classList.add('draggable');
    newCard.innerHTML = card.titre;
    div.appendChild(newCard);
  });
};

// fonction mise à jour du container de réception des cartes jouées
function renderPlayground (playgroundOrder) {
  const actualPlayground = document.querySelector('.reception');
  actualPlayground.innerText = '';
  // pour chaque carte, on la créer dans le dom
  playgroundOrder.forEach(event => {
    const pElement = document.createElement('p');
    pElement.id = event._id
    pElement.classList.add('draggable');
    pElement.innerHTML = event.titre;
    const spanElement = document.createElement('span');
    spanElement.innerHTML = event.date;
    pElement.appendChild(spanElement);
    actualPlayground.appendChild(pElement);
  });
};