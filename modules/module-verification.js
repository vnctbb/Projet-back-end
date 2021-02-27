'use strict'


/**
 * module pour la vérificationd des cartes
 */


// pour chaque carte déja joué, on récupère les informations complète
function retriveCompleteInformation (datas, db, eventContainer, actualCard) {
  datas.order.forEach(card => {
    db.forEach(cardFullInfo => {
      if(card == cardFullInfo._id){
        // puis on insert dans la constante
        eventContainer.push(cardFullInfo);
        if(datas.cardId == cardFullInfo._id)
          // récupération de l'ensemble des informations de la dernière carte jouée
          actualCard = cardFullInfo;
      }
    });
  });
};

function checkOrder (eventContainer) {
  let position = true;
  for(let i = 1; i<eventContainer.length; i++) {
    // si la date d'une carte est inférieur à la date de la dernière jouer, alors la réponse est fausse
    if(eventContainer[i].date < eventContainer[i-1].date){
      console.log(eventContainer[i].date);
      console.log(eventContainer[i-1].date);
      console.log("----------")
      position = false;
    }
  };
  console.log(position);
  return position
}


module.exports = {
  retriveCompleteInformation : retriveCompleteInformation,
  checkOrder : checkOrder
}