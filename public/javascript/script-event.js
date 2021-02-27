'use strict'

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

/** 
 * Fonction pour détecter la place où insérer l'event dragger
 */
function insertEventBeforeOfAfter(container) {
  container.addEventListener('dragover', e => {
    e.preventDefault();
    const afterElement = getDragAfterElement(container, e.clientY);
    const draggable = document.querySelector('.dragging');
    if(afterElement == null) {
      container.appendChild(draggable);
    } else {
      container.insertBefore(draggable, afterElement);
    }
  });
};

/**
 * Fonction pour détecter la place de l'évènement placer et la retransmettre au autres joueurs
 */
function getPositionLastDragged (draggable, index) {
  const container = document.querySelector('.reception')
  const draggableInOrder = [...container.getElementsByClassName('draggable')];
  const order = [];
  draggableInOrder.forEach(draggableOrder => {
    order.push(draggableOrder.id);
  });
  if(draggable.parentNode.className === 'reception containers'){
    socket.emit('checkLastCardPlayed', {order : order, index : index, cardId : draggable.id});
  }
};