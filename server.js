const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Alpha 1 running at http://localhost:${PORT}`);
});

let currentText = '';
const users = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  users[socket.id] = { user: 'anon', cursor: 0 };

  socket.emit('init', { text: currentText, id: socket.id });

  socket.on('textUpdate', (text) => {
    currentText = text;
    socket.broadcast.emit('textUpdate', text);
  });

  socket.on('cursorMove', ({ user, cursor }) => {
    users[socket.id] = { user, cursor };
    socket.broadcast.emit('cursors', users);
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('cursors', users);
  });
});
