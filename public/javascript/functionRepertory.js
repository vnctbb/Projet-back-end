const renderPlayer = (player, draggable, firstClass, secondClass, thirdClass) => {
  const newPlayer = document.createElement('div');
  newPlayer.id = player.id;
  newPlayer.classList.add(firstClass, secondClass);
  player.hand.forEach((card, index) => {
    const newCard = document.createElement('p');
    newCard.id = card.date;
    newCard.draggable = draggable;
    newCard.classList.add(thirdClass);
    newCard.innerHTML = card.titre;
    newPlayer.appendChild(newCard);
  });
  document.querySelector('.playerList').appendChild(newPlayer);
};


function getDragAfterElement(container, y) {
  console.log('ici');
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

  function getPositionLastDragged() {
    console.log('la');
    const container = document.querySelector('.reception')
    const draggableInOrder = [...container.getElementsByClassName('draggable')];
    let returnValue = true;
    for(let i = 1; i<draggableInOrder.length; i++) {
      if(parseFloat(draggableInOrder[i].id) > parseFloat(draggableInOrder[i-1].id)){
      } else {
        returnValue = false;
      }
    };
    if(draggableInOrder.length == 4 && returnValue === true){
      returnValue = 'end';
    }
    return returnValue;
  };