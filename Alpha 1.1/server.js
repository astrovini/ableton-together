const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  let file = req.url === '/' ? '/index.html' : req.url;
  let filepath = path.join(__dirname, 'public', file);

  fs.readFile(filepath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
    } else {
      const ext = path.extname(filepath);
      const contentType = ext === '.js' ? 'application/javascript' : 'text/html';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

const wss = new WebSocket.Server({ server });
const PORT = 3000;

let currentText = '';
const users = {};
let nextId = 1;

wss.on('connection', (ws) => {
  const id = `user-${nextId++}`;
  users[id] = { user: 'anon', cursor: 0 };

  ws.id = id;
  console.log(`User connected: ${id}`);

  ws.send(JSON.stringify({ type: 'init', text: currentText, id }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'textUpdate') {
      currentText = data.text;
      broadcastExcept(ws, { type: 'textUpdate', text: currentText });
    }

    if (data.type === 'cursorMove') {
      users[id] = { user: data.user, cursor: data.cursor };
      broadcastAll({ type: 'cursors', users });
    }
  });

  ws.on('close', () => {
    delete users[id];
    broadcastAll({ type: 'cursors', users });
  });
});

function broadcastAll(msg) {
  const json = JSON.stringify(msg);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

function broadcastExcept(sender, msg) {
  const json = JSON.stringify(msg);
  wss.clients.forEach(client => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

server.listen(PORT, () => {
  console.log(`Alpha 1 running at http://localhost:${PORT}`);
});
