const socket = io();
const editor = document.getElementById('editor');
const cursors = document.getElementById('cursors');

let selfId = null;

// Helper: get absolute caret offset in contenteditable
function getAbsoluteCaretOffset(element) {
  const sel = window.getSelection();
  if (!sel.anchorNode || !element.contains(sel.anchorNode)) return 0;
  let offset = sel.anchorOffset;
  let node = sel.anchorNode;
  // Walk previous siblings and sum their textContent length
  while (node && node !== element) {
    while (node.previousSibling) {
      node = node.previousSibling;
      offset += node.textContent.length;
    }
    node = node.parentNode;
  }
  return offset;
}

// Helper: get (x, y) position of absolute character offset in editor
function getCaretCoordinates(element, absOffset) {
  let currentOffset = 0;
  let node = element.firstChild;
  while (node) {
    const len = node.textContent.length;
    if (currentOffset + len >= absOffset) {
      const localOffset = absOffset - currentOffset;
      const range = document.createRange();
      range.setStart(node, Math.min(localOffset, node.length || len));
      range.setEnd(node, Math.min(localOffset, node.length || len));
      const rects = range.getClientRects();
      if (rects.length > 0) {
        const rect = rects[0];
        return {
          x: rect.left - element.getBoundingClientRect().left,
          y: rect.top - element.getBoundingClientRect().top
        };
      }
      break;
    }
    currentOffset += len;
    node = node.nextSibling;
  }
  return { x: 0, y: 0 };
}

// Sync text and cursor to server
editor.addEventListener('input', () => {
  socket.emit('textUpdate', editor.innerText);
});

editor.addEventListener('keyup', () => {
  const absPos = getAbsoluteCaretOffset(editor);
  socket.emit('cursorMove', {
    user: window.userName,
    cursor: absPos,
  });
});

// Receive initial content
socket.on('init', (data) => {
  editor.innerText = data.text;
  selfId = data.id;
});

// Receive text changes
socket.on('textUpdate', (text) => {
  editor.innerText = text;
});

// Receive all active cursors
socket.on('cursors', (users) => {
  cursors.innerHTML = '';
  Array.from(editor.querySelectorAll('.remote-cursor')).forEach(e => e.remove());
  Object.entries(users).forEach(([id, u]) => {
    if (id === selfId) return;
    const tag = document.createElement('div');
    tag.innerText = `${u.user} is at ${u.cursor}`;
    cursors.appendChild(tag);
    if (typeof u.cursor === 'number') {
      const { x, y } = getCaretCoordinates(editor, u.cursor);
      const cursorDiv = document.createElement('div');
      cursorDiv.className = 'remote-cursor';
      cursorDiv.style.position = 'absolute';
      cursorDiv.style.left = x + 'px';
      cursorDiv.style.top = y + 'px';
      cursorDiv.style.width = '2px';
      cursorDiv.style.height = '1em';
      cursorDiv.style.background = 'red';
      cursorDiv.style.zIndex = 10;
      cursorDiv.title = u.user;
      editor.appendChild(cursorDiv);
    }
  });
});
