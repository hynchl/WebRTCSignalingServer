const socketIo = require("socket.io");
const express = require("express");

const app = express();
const port = 5001;

const server = app.listen(port, () => {
  console.log(`listening on ${port}`);
});

const socketServer = new socketIo.Server(server, {
  cors: { origin: "http://localhost:1234" },
});

let clients = [];

socketServer.on("connection", (socket) => {
  clients.push(socket.id);
  console.log(`Current clients : ${clients}`);

  // SEND LIST OF CLIENTS
  socketServer.to(socket.id).emit(
    "client",
    clients.filter(function (e) {
      return e !== socket.id;
    })
  );

  // FORWARD OFFER
  socket.on("offer", (msg) => {
    // ** sample of offer message **
    // {answerSocketId: '...',
    //  offer: {
    //    type: 'offer',
    //    sdp: '...'
    //    },
    //  offerSocketId: '...',
    //  enableMediaStream: true,
    //  enableDataChannel: false}
    console.log(`OFFER\n${JSON.stringify(msg)}`);

    socketServer.to(msg.answerSocketId).emit("offer", msg);
  });

  // FORWARD ANSWER
  socket.on("answer", (msg) => {
    // ** sample of answer message **
    // {answerSocketId: '...',
    // answer: {
    //     type: 'answer',
    //     sdp: '...'
    //     },
    // offerSocketId: '...'}
    console.log(`ANSWER\n${JSON.stringify(msg)}`);
    socketServer.to(msg.offerSocketId).emit("answer", msg);
  });

  // FORWARD CANDIDATE INFORMATION
  socket.on("candidate", (msg) => {
    // ** sample of candidate message **
    // {"candidate":
    //     {"candidate":"...",
    //     "sdpMid":"0",
    //     "sdpMLineIndex":0,
    //     "usernameFragment":"KLyo"},
    // "destSocketId":"...",
    // "fromSocketId":"..."};
    console.log(`ICE CANDIDATE\n${JSON.stringify(msg)}`);
    socketServer.to(msg.destSocketId).emit("candidate", msg);
  });

  // UPDATE LIST OF CLIENTS
  socket.on("disconnect", () => {
    clients = clients.filter(function (e) {
      return e !== socket.id;
    });
    console.log(`Current clients : ${clients}`);
  });
});
