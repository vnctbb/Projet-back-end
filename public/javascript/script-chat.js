'use strict'

const header = document.querySelector('header');
const buttonChat = document.querySelector('.buttonChat');
const backChat = document.querySelector('.backChatButton');
const divChat = document.querySelector('.chat');
let open = false;
let compteur = 0;

// affichage du chat
buttonChat.addEventListener('click', () => {
  open = true;
  compteur = 0;
  divChat.classList.remove('backChat');
  divChat.classList.add('comeChat');
});

// de-affichage du chat
backChat.addEventListener('click', () => {
  open = false;
  const alert = document.querySelector('.alertMessage');
  if(alert){
    alert.remove();
  }
  divChat.classList.remove('comeChat');
  divChat.classList.add('backChat');
});

// envoi d'un message
function submitMessage(e){
  const inputValue = document.querySelector('input').value;
  socket.emit("newMessage", {text : inputValue});
};

// alert d'un nouveau message
// affichage du message
function newMessage(datas, className){
  if(!open){
    const alert = document.querySelector('.alertMessage');
    if(alert){
      alert.remove();
    }
    compteur += 1;
    let ponctuation = "nouveau message";
    if(compteur > 1){
      ponctuation = "nouveaux messages";
    };
    const p = document.createElement('p');
    p.className = 'alertMessage';
    p.innerHTML = `🔝 ${compteur} ${ponctuation}`;
    header.prepend(p);
  }
  const container = document.querySelector('.conversation');
  const divElement = document.createElement('div');
  divElement.classList.add(className);

  const pName = document.createElement('p');
  pName.innerHTML = `${datas.playerName} dit :`;
  divElement.appendChild(pName);

  const pMessage = document.createElement('p');
  pMessage.innerHTML = `• ${datas.playerMessage.text}`;
  divElement.appendChild(pMessage);

  container.prepend(divElement);
};