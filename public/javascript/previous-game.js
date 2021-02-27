'use strict'

const trophy = document.querySelector('.fa-award');
const times = document.querySelector('.cross');
const menu = document.querySelector('.menuPartie');
const lastTenButton = document.querySelector('.lastTen');
const allGameButton = document.querySelector('.allGame');

// variable pour déterminer car catégorie de partie afficher
const sort = "all";

// affichage du menu
trophy.addEventListener('click', () => {
  menu.classList.remove('back');
  menu.classList.add('come');
});

// de-affichage du menu
times.addEventListener('click', () => {
  menu.classList.remove('come');
  menu.classList.add('back');
});

// affichage 10 dernière partie
lastTenButton.addEventListener('click', () => {
  renderPreviousGame(lastTen);
});

// affichage toute les parties
allGameButton.addEventListener('click', () => {
  renderPreviousGame(allGame);
});

// fonction affichage des parties lors du clique
function renderPreviousGame (array) {

  const exposeGame = document.querySelector('.exposeGame');
  exposeGame.innerHTML = '';

  array.forEach(game => {
    const divOneGame = document.createElement('div');
    divOneGame.className = 'oneGame';

    const divGray = createDivGray(game);
    const pElement = createPElement(game);
    const ulElement = createUl(game);

    divOneGame.appendChild(divGray);
    pElement.forEach(p => {
      divOneGame.appendChild(p);
    });
    divOneGame.appendChild(ulElement);
    exposeGame.appendChild(divOneGame);

  });
}

// création de la div globale
function createDivGray (game) {

  const divGray = document.createElement('div');
  divGray.className = "gray";
  const pDate = document.createElement('p');
  pDate.innerHTML = `${game.dateFormat} - ${game.durationFormat}`;
  const pNbOfPlayers = document.createElement('p');
  pNbOfPlayers.innerHTML = `Joueurs : ${game.nbOfPlayers}`;
  divGray.appendChild(pDate);
  divGray.appendChild(pNbOfPlayers);

  return divGray;
}

// création des p
function createPElement(game) {

  const pRoomWinner = document.createElement('p');
  pRoomWinner.className = 'roomWinner';
  pRoomWinner.innerHTML = game.room;
  const pGray = document.createElement('p');
  pGray.className = 'gray';
  pGray.innerHTML = "Vainqueur :"
  const pNameWinner = document.createElement('p');
  pNameWinner.className = 'nameWinner';
  pNameWinner.innerHTML = `${game.winner.name} avec ${game.winner.points} points`;

  return [pRoomWinner, pGray, pNameWinner];
};

// création de l'élément ul
function createUl(game) {
  const ulGray = document.createElement('ul');
  ulGray.className = 'gray';
  ulGray.innerText = 'Liste complète des joueurs';
  game.listOfPlayers.forEach(player => {
    const li = document.createElement('li');
    li.innerText = `${player.name} - ${player.points} points`;
    ulGray.appendChild(li);
  });

  return ulGray;
};

