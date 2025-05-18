# Alpha 1
### Goal:
A minimal, fast collaborative editor with real-time updates, shared sessions, and eventually full CRDT support + UX interactions.

---
## Step 1 — Core Prototype Simplified Version
### Features:
- **Editable box** (HTML `div[contenteditable]`)
- **Web server + WebSocket** for live sync
- **Shared workspace** via session key (e.g. `alpha1.io/s/abc123`)
- **Single shared file** per session
- **Live update propagation** (last-write-wins)
### Stack:
- Frontend: HTML
- Backend: Node.js + Express + Socket.io
- In-memory session store (no DB)
---
## Step 2 — CRDT Integration + Injection
### Features:
- **CRDT layer** for text consistency (Yjs or Automerge)
- Users can:
    - Type in any app (via injected script or overlay)
    - Sync changes via shared session in real time
- Designed for **immutable or non-cooperative apps** like notepad on windows (like modding or add ons)
### Stack:
- Add **Yjs** or **Automerge**
- Use mutation observers or script injection (in browser) for external text sources
- Frida or other injection observers
---
## ✅ Step 3 — UX & Collaboration Polish

### Features:
- **Named cursors** (real-time caret + user labels)
- **Click on username** → jump to their cursor location
- **Session participant list**
- UI/UX polish: shared toolbar, avatars, presence
### Stack Additions:
- Visual layer for cursor overlay (SVG or DOM)
- State map for cursor positions per user
- Small state manager (Zustand, Redux, or custom)
