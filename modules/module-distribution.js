'use strict'

// module personnalisé
const toolbox = require('./module-toolbox.js');
const everyPlayer = require('./module-competitor');
const game = require('./module-game');
const treatmentDatabase = require('./module-database');

/**
 * Module pour la distribution des cartes
 */

// constante contenant toute les cartes données
const allCardGiven = [];

// fonction qui donne une carte
function takeCard (db) {
  // demande un nombre aléatoire
  let index = toolbox.getRandomNumber(db);
  // boucle sur le tableau donné en argument (ce sera le tableau représentant la base de donnée)
  if(db[index].given){
    // tant qu'on tombe sur une carte pour laquel given = true, on recommence
    while(db[index].given){
      index = toolbox.getRandomNumber(db);
    }
  }
  // lorsque la carte à giver = false
  // on passe given à true
  db[index].given = true;
  // on insert la carte dans la variable contenant les cartes
  allCardGiven.push(db[index]);
  const item = db[index];
  // création d'un objet pour regroupé les informations de la carte à retourner
  const infoGiven = {
    id : item._id,
    titre : item.titre
  }
  return infoGiven;
};

// fonction qui créé une main de carte pour un joueur
function giveHand (nbOfCardNeeded, db) {
  // déclaration d'une constante représentant la main
  const hand = [];
  // boucle itérant sur le nombre de carte demandé en argument
  for(let i = 0; i<nbOfCardNeeded; i++){
    hand.push(takeCard(db));
  };
  // renvoi la main
  return hand;
};

// fonction qui vérifié l'ordre des cartes
function cardVerification (datas, socket) {
  // constante qui contiendra les cartes avec toute leurs informations
  const orderFullInformation = [];
  // variable = carte à vérifier
  let actualCard;
  // pour chaque carte déja joué, on récupère les informations complète
  datas.order.forEach(card => {
    allCardGiven.forEach(cardFullInfo => {
      if(card == cardFullInfo._id){
        // puis on insert dans la constante
        orderFullInformation.push(cardFullInfo);
        if(datas.cardId == cardFullInfo._id)
          // récupération de l'ensemble des informations de la dernière carte jouée
          actualCard = cardFullInfo;
      }
    });
  });
  // variable qui représente si la réponse est bonne ou fausse
  let returnValue = true;
  // itération sur la constante des cartes avec les informations complètes
  for(let i = 1; i<orderFullInformation.length; i++) {
    // si la date d'une carte est inférieur à la date de la dernière jouer, alors la réponse est fausse
    if(orderFullInformation[i].date < orderFullInformation[i-1].date){
      returnValue = false;
    }
  };
  // objet regroupant les informations à retourner
  const retour = {
    actualCard : actualCard,
    returnValue : returnValue,
    index : datas.index
  };
  // emit de la réponse (qui sera à l'origine d'un autre emit coté navigateur)
  socket.emit('serverResponseToCardCheck', retour);
};

// fonction lorsque qu'une carte est bien positionnée
function eventWellPositioned(player, db, datas, socket, ioServer){

  // si la carte est bien positionnée
  if(datas.position){
    // récupération de l'index de la carte dans la main du joueur
    const index = toolbox.getIndex(player.hand, datas.elementId);
    // méthode positionOk de l'objet player
    player.positionOk(index);
  }

  // si le joueur n'a plus de carte et ses points son supérieur à 400
  if(player.nbOfCard == 0 && player.points > 400){
    // envoi au navigateur des données du joueur gagnant
    ioServer.emit('somebodyWin', player);
    // méthode win de l'objet game
    game.win(player);
    // ajout dans la base de donnée de la partie gagnante
    treatmentDatabase.insert({
      datas : game
    });
  }

  // si la partie n'est pas gagné

  // actualisation des points dans le tableau contenant tous les joueurs (pour l'affichage)
  everyPlayer.list[toolbox.getIndex(everyPlayer.list, player.id)].points = player.points;

  // demande du prochain joueur à jouer
  const nextPlayer = toolbox.getNextPlayer(player.id, everyPlayer.list);

  // blocage du jeu pour le joueur qui vient de jouer
  ioServer.to(player.id).emit("notReadyToPlay");

  // déblocage du jeu pour le prochain joueur à jouer
  ioServer.to(nextPlayer.id).emit("readyToPlay", {firstPlayer : false});

  // actualisation de la div contenant les évènements placés
  socket.broadcast.emit('eventWellPositioned', {innerHTML : datas.innerHTML});

  // envoi de la date au navigateur pour affichage
  ioServer.emit('renderDate', datas.actualCard);

  // envoi de prochain joueur à jouer pour affichage
  ioServer.emit('whoNeedToPlay', {nextPlayer : nextPlayer, player : player});
}

// fonction lorsque qu'une carte est mal positionnée
function wrongPosition (player, db, datas, socket) {
  // gestion des points du joueur
  player.streak = 1;
  player.points -= 50;

  // suppression de la carte jouée de la main du joueur
  // puis distribution d'une nouvelle carte
  const indexCard = toolbox.getIndex(player.hand, datas.elementId);
  const indexPlayer = toolbox.getIndex(everyPlayer.list, player.id);
  player.hand.splice(indexCard, 1);
  player.hand.push(takeCard(db));
  everyPlayer.list[indexPlayer].hand = player.hand;

  // envoi de sa nouvelle main au joueur qui vient de jouer
  socket.emit('giveHand', {player : player, newCard : true});
  
  // actualisation de la div contenant les évènements placés
  socket.broadcast.emit('wrongPosition', {player : player, innerHTML : datas.innerHTML});
};


// export du module
module.exports = {
  giveHand : giveHand,
  takeCard : takeCard,
  cardVerification : cardVerification,
  eventWellPositioned : eventWellPositioned,
  wrongPosition : wrongPosition,
};