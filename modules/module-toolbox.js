'use strict'

/**
 * Module toolbox contenant des fonctions génériques
 */

// fonction pour obtenir un nombre aléatoire
function getRandomNumber (db) {
  return Math.round(Math.random() * (db.length -1));
}

function getIndex (array, id) {
  let itemIndex;
  array.forEach((item, index) => {
    if(item.id == id){
      itemIndex = index;
    }
  });
  return itemIndex;
};

function getNextPlayer (id, array) {
  const index = getIndex(array, id);
  if(index == array.length - 1){
    return array[0];
  } else {
    return array[index+1];
  }
};

module.exports = {
  getRandomNumber : getRandomNumber,
  getIndex : getIndex,
  getNextPlayer : getNextPlayer
};