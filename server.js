import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const port = 3001;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

let lobbies = {};
let publicLobbies = [];

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('createLobby', ({ name, isPublic }) => {
    const lobbyId = Math.random().toString(36).substr(2, 5);
    lobbies[lobbyId] = { [socket.id]: name, isPublic };
    if (isPublic) {
      publicLobbies.push(lobbyId);
      io.emit('publicLobbiesUpdate', publicLobbies);
    }
    socket.join(lobbyId);
    socket.emit('lobbyCreated', lobbyId);
    console.log(`${name} created lobby ${lobbyId}`);
  });
  
  socket.on('getPublicLobbies', () => {
    socket.emit('publicLobbiesUpdate', publicLobbies);
  });

  socket.on('joinLobby', ({ lobbyId, name }) => {
    if (lobbies[lobbyId]) {
      socket.join(lobbyId);
      lobbies[lobbyId][socket.id] = name;
      console.log(`${name} joined lobby ${lobbyId}`);
      io.to(lobbyId).emit('lobbyUpdate', lobbies[lobbyId]);
    } else {
      socket.emit('lobbyError', 'Lobby not found');
    }
  });

  socket.on('disconnect', () => {
    // ...
    for (const lobbyId in lobbies) {
      if (lobbies[lobbyId][socket.id]) {
        if (lobbies[lobbyId].isPublic) {
          publicLobbies = publicLobbies.filter((id) => id !== lobbyId);
          io.emit('publicLobbiesUpdate', publicLobbies);
        }
        delete lobbies[lobbyId][socket.id];
        io.to(lobbyId).emit('lobbyUpdate', lobbies[lobbyId]);
      }
    }
  });

  
});

server.listen(port, () => console.log(`Server listening on port ${port}`));
