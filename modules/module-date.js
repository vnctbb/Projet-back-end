'use strict'

/**
 * Module pour formater l'affichage de la date 
 */

// ajoute un zero à un nombre, si il est inférieur à 10;
const addZero = (number) => {
  if(number < 10){
    const numberString = number.toString();
    number = `0${numberString}`;
    return number;
  } else {
    return number
  }
 };

 // met en format une date donnée
 const getDate = (uneDate) => {
  const jour = addZero(uneDate.getDate());
  const mois = addZero(uneDate.getMonth() + 1);
  const année = uneDate.getFullYear();
  const heure = addZero(uneDate.getHours());
  const minutes = addZero(uneDate.getMinutes());
  const format = `le ${jour}/${mois}/${année} à ${heure}h${minutes}`;
  return format;
};

// donne l'écart entre deux date donnée (égal à la durée d'une partie);
const getDuration = (uneDate, deuxDate) => {
  let ecart = uneDate.getTime() - deuxDate.getTime();
    ecart = - ecart;

  let mi = Math.floor(ecart / 60000) % 60;
  let s = Math.floor(ecart / 1000) % 60;

  if(mi < 10){mi = '0' + mi};
  if(s < 10){s = '0' + s};

  return  mi + 'min ' + s + 's';
};

// actualise le format des données sortant de la base de donnée
const formatDatabase = (datas) => {
  datas.forEach(item => {
    item.dateFormat = getDate(item.date);
    item.durationFormat = getDuration(item.date, item.duration);
  });
};

// export du module
module.exports = formatDatabase;