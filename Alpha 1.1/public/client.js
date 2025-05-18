const socket = new WebSocket(`ws://${location.host}`);

const editor = document.getElementById('editor');
const cursors = document.getElementById('cursors');

let selfId = null;

function getAbsoluteCaretOffset(element) {
  const sel = window.getSelection();
  if (!sel.anchorNode || !element.contains(sel.anchorNode)) return 0;
  let offset = sel.anchorOffset;
  let node = sel.anchorNode;
  while (node && node !== element) {
    while (node.previousSibling) {
      node = node.previousSibling;
      offset += node.textContent.length;
    }
    node = node.parentNode;
  }
  return offset;
}

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

editor.addEventListener('input', () => {
  socket.send(JSON.stringify({ type: 'textUpdate', text: editor.innerText }));
});

editor.addEventListener('keyup', () => {
  const absPos = getAbsoluteCaretOffset(editor);
  socket.send(JSON.stringify({
    type: 'cursorMove',
    user: window.userName,
    cursor: absPos
  }));
});

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'init') {
    editor.innerText = data.text;
    selfId = data.id;
  }

  if (data.type === 'textUpdate') {
    editor.innerText = data.text;
  }

  if (data.type === 'cursors') {
    cursors.innerHTML = '';
    Array.from(editor.querySelectorAll('.remote-cursor')).forEach(e => e.remove());
    Object.entries(data.users).forEach(([id, u]) => {
      if (id === selfId) return;
      const tag = document.createElement('div');
      tag.innerText = `${u.user} is at ${u.cursor}`;
      cursors.appendChild(tag);
      if (typeof u.cursor === 'number') {
        const { x, y } = getCaretCoordinates(editor, u.cursor);
        const cursorDiv = document.createElement('div');
        cursorDiv.className = 'remote-cursor';
        cursorDiv.style.left = x + 'px';
        cursorDiv.style.top = y + 'px';
        editor.appendChild(cursorDiv);
      }
    });
  }
});
