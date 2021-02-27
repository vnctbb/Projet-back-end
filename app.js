'use strict'

// module express
const express = require('express');
const app = express();

// module bodyParser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  extended : false
}));

// modules additionnel
const game = require('./modules/module-game.js');
const toolbox = require('./modules/module-toolbox.js');
const formatDate = require('./modules/module-date.js');
const disconnect = require('./modules/module-disconnect.js');
const everyPlayer = require('./modules/module-competitor.js');
const treatmentDatabase = require('./modules/module-database.js');
const distribution = require('./modules/module-distribution.js');

// déclaration de la variable PORT
const PORT = process.env.PORT || 3000;

// déclaration des chemins de fichier statique
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/img', express.static(__dirname + '/public/images'));
app.use('/js', express.static(__dirname + '/public/javascript'));

// déclaration du générateur de template
app.set('view engine', 'pug');

/**
 * Serveur HTTP
 */

// requête GET page d'accueil
// renvoi de la page index
app.get('/', (req, res, next) => {
  // tableau regroupant les noms des différents fichiers images
  const avatarName = ['vladimir', 'monica', 'cesar', 'angelix', 'peter', 'lee'];
  // objet regroupant les différentes rooms
  const rooms = {
    france : everyPlayer.france,
    classique : everyPlayer.classique,
    invention : everyPlayer.invention
  };

  // requête à la base de donnée pour récupérer les anciennes parties
  treatmentDatabase.find({
    collection : 'game',
    sort : {date : -1},
    done : (datas) => {
      // formatage de la date des données reçues
      formatDate(datas);
      // render de la page index
      const datasLastTen = datas.slice(0, 10);
      datas = datas.reverse();
      res.render('index',{lastTen : datasLastTen, allGame : datas, allAvatar : avatarName, rooms : rooms});
    }
  });
});

// requête POST réception des données du formulaire de la page index
// renvoi de la page lobby
app.post('/lobby', (req, res, next) => {
  const avatarName = ['vladimir', 'monica', 'cesar', 'angelix', 'peter', 'lee'];
  const rooms = {
    france : everyPlayer.france,
    classique : everyPlayer.classique,
    invention : everyPlayer.invention
  }
  // affectation des valeurs envoyée par le formulaire
  // dans un objet player
  const player = {
    username : req.body.username.charAt(0).toUpperCase() + req.body.username.substring(1).toLowerCase(),
    avatarChoosen : req.body.personnage,
  }

  // récupération de l'index de l'avatar choisit par l'utilisateur
  const index = avatarName.indexOf(player.avatarChoosen);

  // récupération de la room choisie
  const room = req.body.room;

  // vérification du formulaire
  const error = toolbox.validateForm(player.username, index, game[room].running, everyPlayer[room]);

  // requête à la base de donnée pour récupérer les anciennes parties
  treatmentDatabase.find({
    collection : 'game',
    sort : {date : -1},
    done : (datas) => {
      // formatage de la date des données reçues
      formatDate(datas);
      const datasLastTen = datas.slice(0, 10);
      datas = datas.reverse();
      if(error){
        // formulaire invalide, render de la page avec index
        // avec envoi de l'erreur au template pug
        res.render('index', {error : error, lastTen : datasLastTen, allGame : datas, allAvatar : avatarName, rooms : rooms});
      } else {
        // formulaire valide, render de la page lobby
        // avec envoi des données saisies par l'utilisateur au template pug
        res.render('lobby', {player : player, lastTen : datasLastTen, allGame : datas, room : room});
      }
    }
  });
});

// gestion erreur d'URL
app.use((req,res,next) => {
  const datasPug = {};
  switch (res.statusCode) {
      case '500':
          datasPug.titre = 'ERREUR 500';
          datasPug.erreur = 'Erreur interne - La base de donnée ne répond pas';
          break;
      default:
          res.status(404);
          datasPug.titre = 'ERREUR 404';
          datasPug.erreur = 'La page demandée n\'existe pas !';
  }
  res.render('error', datasPug);
});

// constante 'server' pour relier le serveur express au serveur websocket
const server = app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});

// appel de la base de donnée pour récupérer le jeu de carte
let dataBase = {};

// jeu "france"
treatmentDatabase.find({
  collection : 'france',
  done : (datas) => {
    dataBase.france = datas;
  }
});
// jeu "classique"
treatmentDatabase.find({
  collection : 'classique',
  done : (datas) => {
    dataBase.classique = datas;
  }
});
// jeu "invention"
treatmentDatabase.find({
  collection : 'invention',
  done : (datas) => {
    dataBase.invention = datas;
  }
});

/**
* Serveur Websocket (avec socket.io)
*/

// module socket.io
const socketio = require('socket.io');
// création du serveur socket.io
const ioServer = socketio(server);

// réception d'une connexion au websocket
ioServer.on('connection', (socket) => {

  console.log('connexion établie');

  // module personnalisé
  const createPlayer = require('./modules/module-player.js');
  // déclaration du joueur qui vient de se connecter
  let player;

  // socket qui reçoit les informations du nouveau joueur
  socket.on('savePlayerInformation', (data) => {
    // join la room demandée
    socket.join(data.room);
    // gestion erreur dataBase undefined => renvoi le joueur à index.pug
    console.log("[INFO]:database", dataBase[data.room])
    if(!dataBase[data.room]) { socket.emit("dataBaseError") };
    // Appel de la méthode createPlayer
    
    if(dataBase[data.room]){
      player = createPlayer(socket, socket.id, data.username, dataBase[data.room], data.avatar, data.room);
      socket.emit("notReadyToPlay");
    };
    // socket qui indique que les joueurs ne sont pas prêt à jouer
  });

  // socket qui renvoi tous les joueurs dans le lobby au joueur qui vient de se connecter
  socket.on('askForOtherPlayer', () => {
    // on enlève le tableau le joueur qui vient de se connecter
    if(player){
      socket.emit('otherPlayerInLobby', everyPlayer[player.room].slice(0, (everyPlayer[player.room].length-1)));
    }
  });

  // socket reçu lorsque qu'un joueur indique qu'il est prêt
  socket.on('playerIsReady', () => {
    player.nowReady(player.room);
    everyPlayer.verificationAllPlayerAreReady(game[player.room], player.room, ioServer);
  });

  // socket qui reçoit les infos de la carte à vérifier
  socket.on('checkLastCardPlayed', (datas) => {
    distribution.cardVerification(player, dataBase[player.room], datas, ioServer, socket);
  });

  // socket reçu lorsque qu'un joueur se déconnecte
  socket.on('disconnect', () => {
    if(player){
      // suppression des cartes du joueur
      disconnect.removeCards(player, dataBase[player.room], ioServer);
      // suppression du joueur
      disconnect.removePlayer(player, dataBase[player.room], ioServer);
    }
  });

  // CHAT

  // réception du message
  socket.on('newMessage', inputValue => {
    // envoi du message aux autres joueurs
    socket.to(player.room).broadcast.emit('newMessage', {playerName : player.name, playerMessage : inputValue});
    // envoi de son propre message au joueur
    socket.emit('myMessage', {playerName : player.name, playerMessage : inputValue});
  });

});