// ============================================================================
// Birdie Blitz — multiplayer server (Node.js + ws), made to run on Render.com.
//
// One "room" per 4-digit code. Relays lobby state + shot/hole/chat events
// between the players in that room. Same message protocol as before, so the
// game only needs its host pointed here.
//
// HOW IT GETS DEPLOYED (no terminal — see the README in this folder):
//   1. Put this folder (server.js + package.json) in a public GitHub repo.
//   2. On render.com: New + → Web Service → connect that repo → Free plan → Create.
//   3. Render gives you a URL like  birdie-blitz-xxxx.onrender.com
//   4. Send that URL back to wire into the game.
//
// Players connect to:  wss://<your-app>.onrender.com/room/<4-digit-code>
// ============================================================================

const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 10000;   // Render sets PORT for you

// rooms: code -> { started:boolean, players: Map<ws, {name,seat,host,ready}> }
const rooms = new Map();

function getRoom(code) {
  let r = rooms.get(code);
  if (!r) { r = { started: false, players: new Map() }; rooms.set(code, r); }
  return r;
}

function nextSeat(room) {
  const taken = new Set([...room.players.values()].map(p => p.seat));
  for (let s = 0; s < 4; s++) if (!taken.has(s)) return s;
  return -1;
}

function playersPayload(room) {
  return [...room.players.values()]
    .map(p => ({ name: p.name, seat: p.seat, host: p.host, ready: p.ready }))
    .sort((a, b) => a.seat - b.seat);
}

function broadcast(room, obj, exceptWs) {
  const msg = JSON.stringify(obj);
  for (const ws of room.players.keys()) {
    if (exceptWs && ws === exceptWs) continue;
    if (ws.readyState === ws.OPEN) { try { ws.send(msg); } catch {} }
  }
}

// plain HTTP server: health check at / so Render sees the service as "live"
const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("Birdie Blitz multiplayer server is running.");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  // the 4-digit code is the last path segment: /room/1234
  const path = (req.url || "").split("?")[0];
  const parts = path.split("/").filter(Boolean);
  const code = (parts[parts.length - 1] || "----").replace(/[^0-9A-Za-z]/g, "").slice(0, 8) || "----";
  const room = getRoom(code);

  ws._code = code;
  ws.send(JSON.stringify({ t: "open", code }));

  ws.on("message", (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.t === "hello") {
      if (room.started) { ws.send(JSON.stringify({ t: "error", message: "Game already started" })); return; }
      const seat = nextSeat(room);
      if (seat === -1) { ws.send(JSON.stringify({ t: "error", message: "Lobby full" })); return; }
      const isHost = room.players.size === 0;
      room.players.set(ws, { name: String(msg.name || "Player").slice(0, 12), seat, host: isHost, ready: false });
      ws.send(JSON.stringify({ t: "players", players: playersPayload(room), you: seat }));
      broadcast(room, { t: "players", players: playersPayload(room) });
      return;
    }

    const me = room.players.get(ws);
    if (!me) return;

    switch (msg.t) {
      case "ready":
        me.ready = msg.ready !== false;
        broadcast(room, { t: "players", players: playersPayload(room) });
        break;

      case "start":
        if (!me.host) return;             // only the host starts
        room.started = true;
        broadcast(room, { t: "start", settings: msg.settings, players: playersPayload(room), seed: (Date.now() & 0xffff) });
        break;

      case "shot":
        broadcast(room, { t: "shot", seat: me.seat, ...msg }, ws);
        break;
      case "hole":
        broadcast(room, { t: "hole", ...msg }, ws);
        break;
      case "chat":
        broadcast(room, { t: "chat", from: me.name, text: String(msg.text || "").slice(0, 140) });
        break;
    }
  });

  ws.on("close", () => {
    const me = room.players.get(ws);
    if (!me) return;
    const wasHost = me.host;
    room.players.delete(ws);
    if (wasHost && room.players.size) {
      // promote the lowest remaining seat to host
      const next = [...room.players.values()].sort((a, b) => a.seat - b.seat)[0];
      if (next) next.host = true;
    }
    if (room.players.size === 0) {
      rooms.delete(code);               // empty room — free it
    } else {
      broadcast(room, { t: "left", players: playersPayload(room) });
    }
  });

  ws.on("error", () => { try { ws.close(); } catch {} });
});

server.listen(PORT, () => {
  console.log("Birdie Blitz server listening on port " + PORT);
});
