'use strict'

const trophy = document.querySelector('.fa-trophy');
const times = document.querySelector('.cross');
const menu = document.querySelector('.menuPartie');

trophy.addEventListener('click', () => {
  menu.classList.remove('back');
  menu.classList.add('come');
});

times.addEventListener('click', () => {
  menu.classList.remove('come');
  menu.classList.add('back');
});