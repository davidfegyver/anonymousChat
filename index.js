const express     = require("express");
const io          = require("socket.io");
const xssFilters = require('xss-filters');
const PORT = process.env.PORT || 80;

const pairingQueue = [];
let userCount = 0;

const sockets = {};


const app = express()
.use(express.static("./web"));

const server = app.listen(PORT, function() {
  console.log(`Szerver elindult a ${PORT} porton`);
});

const socketServer = io.listen(server);

socketServer.sockets.on("connection", function (socket) {
  
  userCount++;
  socketServer.sockets.emit("userCount", userCount);


  socket.on("login", function (nickname) {
    socket.nickname = nickname;
    socket.isPaired = false;
    socket.otherUserId = "";
    sockets[socket.id] = socket;
    pairingQueue.push(socket.id);
    findPairForUser();
  });
  socket.on("disconnect", function () {
      if (socket.isPaired) {
        const otherUserSocket = sockets[socket.otherUserId];
        otherUserSocket.emit("notification", "A partnered kilépett a böngészőből. 10 mp múlva törlődik a szoba.", "WARN");
        cleanupPair(otherUserSocket)
      }
    delete sockets[socket.id];
    userCount--;
    socket.broadcast.emit("userCount", userCount);
  });
  socket.on("postMsg", function (msg) {
    if (socket.isPaired) {
    const otherUserSocket = sockets[socket.otherUserId];
    otherUserSocket.emit("newMsg",msg);
    }
  });
  socket.on("findAnotherPair", () => {
    if (socket.isPaired) {
      sockets[socket.otherUserId].emit("notification", "A partnered kilépett.", "😟");
      cleanupPair(sockets[socket.otherUserId]);
      cleanupPair(socket);
    }
    pairingQueue.push(socket.id);
    findPairForUser();
    sockets[socket.id] = socket;
  });
  socket.on("exitChat", () => {

    if (socket.isPaired) {
      sockets[socket.otherUserId].emit("notification", "A partnered kilépett.","😟");
      cleanupPair(sockets[socket.otherUserId]);
      cleanupPair(socket);
    }
    sockets[socket.id] = socket;
    socket.emit("notification", "Sikeresen elhagytad a szobát.","🆗");
  });

  function findPairForUser() {
    while (pairingQueue.length > 1) {
      pairing(pairingQueue[0], pairingQueue[1]);
    }
  }

  function pairing(socket1, socket2, bool = true) {
    const userSocket = sockets[socket1];
    const otherUserSocket = sockets[socket2];
    pairingQueue.splice(0, 2);

    userSocket.isPaired = true;
    otherUserSocket.isPaired = true;

    userSocket.otherUserId = otherUserSocket.id;
    otherUserSocket.otherUserId = userSocket.id;
    userSocket.emit("gotAPair",  otherUserSocket.nickname);
    otherUserSocket.emit("gotAPair", userSocket.nickname);
  }
  function cleanupPair(socket) {
    socket.isPaired = false;
    socket.otherUserId = "";
  }
});
