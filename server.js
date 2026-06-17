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
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 10000;   // Render sets PORT for you

// ============================================================================
// GLOBAL LEADERBOARD
// Tracks each player's lifetime birdies and their best (lowest) round score.
// Stored in memory + mirrored to a JSON file so it survives within an instance.
// NOTE: Render's FREE tier has an ephemeral disk, so a full server restart can
// reset this. For permanent storage you'd add a database; this is the free-tier
// version and is plenty for a friends leaderboard.
// ============================================================================
const LB_FILE = path.join(__dirname, "leaderboard.json");
// board: name(lowercased) -> { name, birdies, bestRound, rounds, updated }
let board = {};
try {
  if (fs.existsSync(LB_FILE)) board = JSON.parse(fs.readFileSync(LB_FILE, "utf8")) || {};
} catch { board = {}; }

let lbSaveTimer = null;
function saveBoard() {
  // debounce writes so we don't hammer the disk
  if (lbSaveTimer) return;
  lbSaveTimer = setTimeout(() => {
    lbSaveTimer = null;
    try { fs.writeFileSync(LB_FILE, JSON.stringify(board)); } catch {}
  }, 1500);
}

function cleanName(n) {
  return String(n || "Player").replace(/[^\w \-]/g, "").trim().slice(0, 14) || "Player";
}

// merge a submission into the board. birdies are ADDED (incremental since last submit);
// bestRound keeps the lowest ever seen. Returns the updated entry.
function submitScore({ name, birdies, bestRound, holes, register }) {
  const nm = cleanName(name);
  const key = nm.toLowerCase();
  const e = board[key] || { name: nm, birdies: 0, bestRound: null, rounds: 0, holes: 0, updated: 0 };
  e.name = nm;   // keep latest casing
  if (e.holes == null) e.holes = 0;   // migrate older entries
  const addB = Math.max(0, Math.min(50, parseInt(birdies, 10) || 0));   // cap per-submit to deter abuse
  e.birdies += addB;
  const addH = Math.max(0, Math.min(500, parseInt(holes, 10) || 0));    // holes played since last submit
  e.holes += addH;
  if (bestRound != null) {
    const br = parseInt(bestRound, 10);
    // round score is relative to par, so it can be negative (under par = better). Range-check only.
    if (!isNaN(br) && br > -100 && br < 200) {
      if (e.bestRound == null || br < e.bestRound) e.bestRound = br;
    }
  }
  // a pure presence/registration submit (no birdies, no holes, no round) shouldn't count as a round
  if (!register && (addB > 0 || addH > 0 || bestRound != null)) e.rounds += 1;
  e.updated = Date.now();
  board[key] = e;
  saveBoard();
  return e;
}

// FULL board: every registered player, sorted by birdies (best round as tiebreak).
// n defaults high so nobody is cut off as the player base grows.
function topBoard(n = 500) {
  return Object.values(board)
    .sort((a, b) => (b.birdies - a.birdies) || ((a.bestRound || 999) - (b.bestRound || 999)))
    .slice(0, n)
    .map(e => ({ name: e.name, birdies: e.birdies, bestRound: e.bestRound, rounds: e.rounds, holes: e.holes || 0 }));
}

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
    .map(p => ({ name: p.name, seat: p.seat, host: p.host, ready: p.ready, skin: p.skin || 'white' }))
    .sort((a, b) => a.seat - b.seat);
}

function broadcast(room, obj, exceptWs) {
  const msg = JSON.stringify(obj);
  for (const ws of room.players.keys()) {
    if (exceptWs && ws === exceptWs) continue;
    if (ws.readyState === ws.OPEN) { try { ws.send(msg); } catch {} }
  }
}

// plain HTTP server: health check at / plus the leaderboard API
const server = http.createServer((req, res) => {
  // allow the game (served from Netlify/your domain) to call these endpoints
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const url = (req.url || "/").split("?")[0];

  // GET /leaderboard  → top players as JSON
  if (req.method === "GET" && url === "/leaderboard") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ board: topBoard() }));
    return;
  }

  // POST /leaderboard  → submit { name, birdies, bestRound }
  if (req.method === "POST" && url === "/leaderboard") {
    let body = "";
    req.on("data", c => { body += c; if (body.length > 4000) req.destroy(); });
    req.on("end", () => {
      let data; try { data = JSON.parse(body || "{}"); } catch { data = {}; }
      const entry = submitScore(data);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, you: { name: entry.name, birdies: entry.birdies, bestRound: entry.bestRound, holes: entry.holes || 0 }, board: topBoard() }));
    });
    return;
  }

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
  if (room._reapTimer) { clearTimeout(room._reapTimer); room._reapTimer = null; }

  ws._code = code;
  ws.send(JSON.stringify({ t: "open", code }));

  ws.on("message", (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    // keepalive: respond to pings so the socket (and free-tier instance) stays warm
    if (msg.t === "ping") { try { ws.send(JSON.stringify({ t: "pong" })); } catch {} return; }

    if (msg.t === "hello") {
      // RECONNECT: a player dropped and is rejoining. Let them back into their old seat even
      // if the game has started, so a connection blip doesn't lock them out / freeze the game.
      if (msg.rejoin && msg.seat != null) {
        // free any stale socket still sitting on that seat
        for (const [oldWs, p] of room.players) {
          if (p.seat === msg.seat && oldWs !== ws) { room.players.delete(oldWs); try { oldWs.close(); } catch {} }
        }
        const isHost = room.players.size === 0 ? true : ([...room.players.values()].every(p => p.seat !== 0) && msg.seat === 0);
        room.players.set(ws, { name: String(msg.name || "Player").slice(0, 12), seat: msg.seat, host: !!msg.host || isHost, ready: true, skin: String(msg.skin || "white").slice(0, 20) });
        ws.send(JSON.stringify({ t: "players", players: playersPayload(room), you: msg.seat }));
        broadcast(room, { t: "players", players: playersPayload(room) });
        return;
      }
      if (room.started) { ws.send(JSON.stringify({ t: "error", message: "Game already started" })); return; }
      const seat = nextSeat(room);
      if (seat === -1) { ws.send(JSON.stringify({ t: "error", message: "Lobby full" })); return; }
      const isHost = room.players.size === 0;
      room.players.set(ws, { name: String(msg.name || "Player").slice(0, 12), seat, host: isHost, ready: false, skin: String(msg.skin || "white").slice(0, 20) });
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
        // force the authoritative server seat (spread msg FIRST so our seat wins, not the client's)
        broadcast(room, { ...msg, t: "shot", seat: me.seat }, ws);
        break;
      case "turn":
        // authoritative turn pointer from the host — relay to everyone else
        broadcast(room, { ...msg, t: "turn" }, ws);
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
      // don't delete immediately — a brief connection blip may have dropped everyone at once.
      // hold the room for a grace period so reconnecting players can rejoin their seats.
      if (room._reapTimer) clearTimeout(room._reapTimer);
      room._reapTimer = setTimeout(() => {
        if (room.players.size === 0) rooms.delete(code);
      }, 60000);   // 60s grace
    } else {
      broadcast(room, { t: "left", players: playersPayload(room) });
    }
  });

  ws.on("error", () => { try { ws.close(); } catch {} });
});

server.listen(PORT, () => {
  console.log("Birdie Blitz server listening on port " + PORT);
});
