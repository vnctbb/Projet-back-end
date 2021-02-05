function renderPlayer (player) {
  const div = document.createElement('div');
  div.id = player.id;
  div.classList.add('player', 'container');

  const h2 = document.createElement('h2');
  h2.innerText = player.name;
  h2.className = 'playerName';
  div.appendChild(h2);

  player.hand.forEach((card, index) => {
    const p = document.createElement('p');
    p.id = card.date;
    p.draggable = true;
    p.classList.add('draggable');
    p.innerHTML = card.titre;
    div.appendChild(p);
  });

  document.querySelector('.playerList').appendChild(div);
};


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


function getPositionLastDragged() {
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


function draggableIteration(draggables, boolean){
  draggables.forEach(draggable => {
    draggable.draggable = true;
    draggable.addEventListener('dragstart', () => {
      draggable.classList.add('dragging');
    });
  
    draggable.addEventListener('dragend', () => {
      draggable.classList.remove('dragging');
      draggable.classList.add('last-dragged');
      const checkingPosition = getPositionLastDragged();
      console.log(checkingPosition);
      const orderListEvent = document.querySelector('.reception').innerHTML;
      socket.emit('eventPositionned', orderListEvent);
      const listMyEvent = document.querySelector('.container').innerHTML;
      socket.emit('myEventPosition', listMyEvent);
      if(checkingPosition === 'end'){
        console.log('Winner');
      } else {
        if(checkingPosition === true){
          //draggable.draggable = false; // aussi changer les draggable to not draggable
          const orderListEvent = document.querySelector('.reception').innerHTML;
          socket.emit('eventPositionned', orderListEvent);
        } else {
          setTimeout(() => {
            draggable.draggable = true;
            const container = document.querySelector('.player');
            container.appendChild(draggable);
            const order = document.querySelector('.reception').innerHTML;
            socket.emit('eventPositionned', order);
          }, 500);
        }
      }
    });
  });
};

function containersIteration(containers){
  containers.forEach(container => {
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
  });
};