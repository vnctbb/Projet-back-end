'use strict'

// module express
const express = require('express');
const app = express();

// module bodyParser
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({
  extended : false
}));

// modules personnalisé
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
  // requête à la base de donnée pour récupérer les anciennes parties
  treatmentDatabase.find({
    collection : 'game',
    sort : {date : -1},
    done : (datas) => {
      // formatage de la date des données reçues
      formatDate(datas);
      // render de la page index
      res.render('index',{previousGame : datas, allAvatar : avatarName});
    }
  });
});

// requête POST réception des données du formulaire de la page index
// renvoi de la page lobby
app.post('/lobby', (req, res, next) => {
  const avatarName = ['vladimir', 'monica', 'cesar', 'angelix', 'peter', 'lee'];
  // affectation des valeurs envoyée par le formulaire
  // dans un objet player
  const player = {
    username : req.body.username,
    avatarChoosen : req.body.personnage,
  }

  // récupération de l'index de l'avatar choisit par l'utilisateur
  const index = avatarName.indexOf(player.avatarChoosen);

  // vérification du formulaire
  const error = toolbox.validateForm(player.username, index, game.running, everyPlayer.list);

  // requête à la base de donnée pour récupérer les anciennes parties
  treatmentDatabase.find({
    collection : 'game',
    done : (datas) => {
      // formatage de la date des données reçues
      formatDate(datas);
      if(error){
        // formulaire invalide, render de la page avec index
        // avec envoi de l'erreur au template pug
        res.render('index', {error : error, previousGame : datas, allAvatar : avatarName});
      } else {
        // formulaire valide, render de la page lobby
        // avec envoi des données saisies par l'utilisateur au template pug
        res.render('lobby', {player : player, previousGame : datas});
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
  console.log('il ya un problème')
  res.render('error', datasPug);
});

// constante 'server' pour relier le serveur express au serveur websocket
const server = app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});

// appel de la base de donnée pour récupérer le jeu de carte
let dataBase;

treatmentDatabase.find({
  collection : 'events',
  done : (datas) => {
    dataBase = datas;
  }
});

/**
* Serveur Websocket (avec socket.io)
*/

// module socket.io
const socketio = require('socket.io');
const createPlayer = require('./modules/module-player.js');
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
    // Appel de la méthode createPlayer
    player = createPlayer(socket, socket.id, data.username, dataBase, data.avatar);
  });

  // socket qui renvoi tous les joueurs dans le lobby au joueur qui vient de se connecter
  socket.on('askForOtherPlayer', () => {
    // on enlève le tableau le joueur qui vient de se connecter
    socket.emit('otherPlayerInLobby', everyPlayer.list.slice(0, (everyPlayer.list.length-1)));
  });

  // socket qui indique que les joueurs ne sont pas prêt à jouer
  ioServer.emit("notReadyToPlay");

  // socket reçu lorsque qu'un joueur indique qu'il est prêt
  socket.on('playerIsReady', () => {
    player.nowReady();
    everyPlayer.verificationAllPlayerAreReady(game, ioServer);
  });

  // socket qui reçoit les infos de la carte à vérifier
  socket.on('checkLastCardPlayed', (datas) => {
    distribution.cardVerification(datas, socket);
  });

  // socket reçu lorsque qu'un joueur à positionner un évènement
  socket.on('eventWellPositioned', (datas) => {
    distribution.eventWellPositioned(player, dataBase, datas, socket, ioServer);
  });

  // traitement sur les cartes lorsque la position est mauvaise
  socket.on('wrongPosition', (datas) => {
    distribution.wrongPosition(player, dataBase, datas, socket)
  });

  // socket reçu lorsque qu'un joueur se déconnecte
  socket.on('disconnect', () => {
    // suppression des cartes du joueur
    disconnect.removeCards(player, dataBase, ioServer);
    // suppression du joueur
    disconnect.removePlayer(player, dataBase, ioServer);
  });

});