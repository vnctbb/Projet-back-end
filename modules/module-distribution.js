'use strict'
// module requis
const game = require('./module-game');
const toolbox = require('./module-toolbox.js');
const everyPlayer = require('./module-competitor');
const verification = require('./module-verification');
const treatmentDatabase = require('./module-database');


/**
 * Module pour la distribution des cartes
 */


// constante contenant toute les cartes données
const allCardGiven = {
  france : [],
  classique : [],
  invention : []
};

// fonction qui donne une carte
function takeCard (db, room) {
  // demande un nombre aléatoire
  if(!db){
    treatmentDatabase.find({
      collection : room,
      done : (datas) => {
        db = datas;
      }
    });
  }
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
  allCardGiven[room].push(db[index]);
  const item = db[index];
  // création d'un objet pour regroupé les informations de la carte à retourner
  const infoGiven = {
    id : item._id,
    titre : item.titre
  }
  return infoGiven;
};


// fonction qui créé une main de carte pour un joueur
function giveHand (nbOfCardNeeded, db, room) {
  // déclaration d'une constante représentant la main
  const hand = [];
  // boucle itérant sur le nombre de carte demandé en argument
  for(let i = 0; i<nbOfCardNeeded; i++){
    hand.push(takeCard(db, room));
  };
  // renvoi la main
  return hand;
};

// fonction pour supprimer une carte dans n'importe quel conteneur
function deleteCardInContainer(eventContainer, id) {
  const index = toolbox.getIndexDb(eventContainer, id);
  eventContainer.splice(index, 1);
}


// fonction qui vérifié l'ordre des cartes
function cardVerification (player, db, datas, ioServer, socket) {

  const orderWithFullInformation = [];
  let actualCard;
  
  // récupération des données complètes pour les cartes déja posée
  verification.retriveCompleteInformation(datas, db, orderWithFullInformation, actualCard);
 
  // variable qui représente si la carte est bien positionnée ou non
  const position = verification.checkOrder(orderWithFullInformation);
  
  // donnée à renvoyer (ordre sans modification)
  const datasToSend = {
    actualCard : actualCard,
    orderWithFullInformation : orderWithFullInformation,
  };

  // affichage à tous les joueurs de ce qui vient d'être jouer
  ioServer.to(player.room).emit('serverResponseToCardCheck', datasToSend);

  // envoi au joueur qui vient de jouer le statut "Not ready"
  ioServer.to(player.id).emit("notReadyToPlay");

  // renvoi de la position pour l'animation vrai/faux
  if(position){
    ioServer.to(player.room).emit('answerIsTrue');
  } else {
    ioServer.to(player.room).emit('answerIsFalse');
  }

  // set timeout, le temps de voir si carte est vrai ou fausse
  setTimeout(() => {
    // signale au prochain joueur que c'est son tour
    const nextPlayer = toolbox.getNextPlayer(player.id, everyPlayer[player.room]);
    ioServer.to(nextPlayer.id).emit("readyToPlay", {firstPlayer : false});

    if(position){
      
      // enlève la carte de la main du joueur
      const index = toolbox.getIndex(player.hand, datas.cardId);
      player.positionOk(index);

    } else {

      // enlève la carte des données à renvoyer
      deleteCardInContainer(orderWithFullInformation, datas.cardId)
      // remet la carte dans le jeu, prête à être tiré
      deleteCardInContainer(allCardGiven[player.room], datas.cardId);

      ioServer.to(player.room).emit('wrongPosition', orderWithFullInformation);

      // suppression de la carte jouée de la main du joueur
      // puis distribution d'une nouvelle carte
      // & gestion des points du joueur
      const indexCard = toolbox.getIndex(player.hand, datas.cardId);
      player.positionNotOk(indexCard, db);

      // envoi de sa nouvelle main au joueur qui vient de jouer
      const indexPlayer = toolbox.getIndex(everyPlayer[player.room], player.id);
      everyPlayer[player.room][indexPlayer].hand = player.hand;

      socket.emit('giveHand', {player : player, newCard : true});
    }

    // redonne une carte au joueur si il n'en à plus
    if(player.nbOfCard === 0 && position){
      player.needNewCard(db)
      socket.emit('giveHand', {player : player, newCard : true});
    }

    // condition de victoire
    if(player.points > 400){
      // envoi au navigateur des données du joueur gagnant
      ioServer.to(player.room).emit('somebodyWin', player);
      // méthode win de l'objet game
      game[player.room].win(player);
      // ajout dans la base de donnée de la partie gagnante
      treatmentDatabase.insert({
        datas : game[player.room]
      });
    };

    // mise à jour des points
    everyPlayer[player.room][toolbox.getIndex(everyPlayer[player.room], player.id)].points = player.points;
    
    // blocage du jeu pour le joueur qui vient de jouer
    ioServer.to(player.id).emit("notReadyToPlay");

    // envoi du texte pour signaler le prochain joueur
    ioServer.to(player.room).emit('nextPlayerToPlay', {nextPlayer : nextPlayer, player : player});
  }, 4500)
};


// export du module
module.exports = {
  allCardGiven : allCardGiven,
  giveHand : giveHand,
  takeCard : takeCard,
  cardVerification : cardVerification,
};