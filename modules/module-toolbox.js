'use strict'

/**
 * Module toolbox contenant des fonctions génériques
 */

// fonction pour obtenir un nombre aléatoire
function getRandomNumber (array) {
  return Math.round(Math.random() * (array.length -1));
}

// fonction pour obtenir l'index d'un item dans un tableau
function getIndex (array, id) {
  let itemIndex;
  array.forEach((item, index) => {
    if(item.id == id){
      itemIndex = index;
    }
  });
  return itemIndex;
};

// fonction pour déterminer le prochain joueur à jouer
function getNextPlayer (id, array) {
  const index = getIndex(array, id);
  if(index == array.length - 1){
    return array[0];
  } else {
    return array[index+1];
  }
};

// fonction pour valider le formulaire de la page index
function validateForm (username, index, running, liste) {
  if(username == ''){
    `Attention, tu n'as rentré aucun nom !`
  }
  if(username.length < 3 || username.length > 26) {
    return 'Le nom renseigné ne correspond au format demandé !';
  }
  if(index < 0){
    return `Attention, tu n'as pas sélectionné d'avatar !`;
  }
  if(liste.length === 8){
    return 'Le nombre maximum de joueur est atteint, attend la prochaine partie'
  }
  if(running){
    return 'Une partie est déja en cours, attend le prochain tour'
  }
  liste.forEach(u => {
    if(u.name == username){
      return 'Désolé, ce nom est déja pris !';
    }
  });
  return false;
};

// export du module
module.exports = {
  getRandomNumber : getRandomNumber,
  getIndex : getIndex,
  getNextPlayer : getNextPlayer,
  validateForm : validateForm
};