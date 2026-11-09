(function () {
  "use strict";

  const MAT = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  const PROMO_NAME = { q: "Queen", r: "Rook", b: "Bishop", n: "Knight" };
  const TYPE_NAME = { k: "King", q: "Queen", r: "Rook", b: "Bishop", n: "Knight", p: "Pawn" };
  const SIDE_NAME = { w: "White", b: "Black" };
  const LEVELS = [
    { n: 1, emo: "😴", name: "Sleepy Chick" },
    { n: 2, emo: "🐤", name: "Baby Chick" },
    { n: 3, emo: "🐥", name: "Walking Chick" },
    { n: 4, emo: "🐰", name: "Hoppy Bunny" },
    { n: 5, emo: "🐱", name: "Clever Cat" },
    { n: 6, emo: "🦊", name: "Sly Fox" },
    { n: 7, emo: "🦉", name: "Night Owl" },
    { n: 8, emo: "🦄", name: "Magic Unicorn" },
    { n: 9, emo: "🐲", name: "Little Dragon" },
    { n: 10, emo: "🐉", name: "Glowing Dragon" },
  ];

  // Index 0 is the piece's own back rank.
  const PST = {
    p: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [5, 10, 10, -20, -20, 10, 10, 5],
      [5, -5, -10, 0, 0, -10, -5, 5],
      [0, 0, 0, 20, 20, 0, 0, 0],
      [5, 5, 10, 25, 25, 10, 5, 5],
      [10, 10, 20, 30, 30, 20, 10, 10],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    n: [
      [-50, -40, -30, -30, -30, -30, -40, -50],
      [-40, -20, 0, 5, 5, 0, -20, -40],
      [-30, 5, 10, 15, 15, 10, 5, -30],
      [-30, 0, 15, 20, 20, 15, 0, -30],
      [-30, 5, 15, 20, 20, 15, 5, -30],
      [-30, 0, 10, 15, 15, 10, 0, -30],
      [-40, -20, 0, 0, 0, 0, -20, -40],
      [-50, -40, -30, -30, -30, -30, -40, -50],
    ],
    b: [
      [-20, -10, -10, -10, -10, -10, -10, -20],
      [-10, 0, 0, 0, 0, 0, 0, -10],
      [-10, 0, 8, 10, 10, 8, 0, -10],
      [-10, 5, 5, 10, 10, 5, 5, -10],
      [-10, 0, 10, 10, 10, 10, 0, -10],
      [-10, 10, 10, 10, 10, 10, 10, -10],
      [-10, 5, 0, 0, 0, 0, 5, -10],
      [-20, -10, -10, -10, -10, -10, -10, -20],
    ],
    r: [
      [0, 0, 0, 5, 5, 0, 0, 0],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [5, 10, 10, 10, 10, 10, 10, 5],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    q: [
      [-20, -10, -10, -5, -5, -10, -10, -20],
      [-10, 0, 0, 0, 0, 0, 0, -10],
      [-10, 0, 5, 5, 5, 5, 0, -10],
      [-5, 0, 5, 5, 5, 5, 0, -5],
      [0, 0, 5, 5, 5, 5, 0, -5],
      [-10, 5, 5, 5, 5, 5, 0, -10],
      [-10, 0, 5, 0, 0, 0, 0, -10],
      [-20, -10, -10, -5, -5, -10, -10, -20],
    ],
    k: [
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-20, -30, -30, -40, -40, -30, -30, -20],
      [-10, -20, -20, -20, -20, -20, -20, -10],
      [10, 15, 0, 0, 0, 0, 15, 10],
      [15, 25, 8, 0, 0, 8, 25, 15],
    ],
  };

  const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const ROOK_DIR = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const BISHOP_DIR = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

  let board = emptyBoard();
  let turn = "w";
  let castle = { wK: true, wQ: true, bK: true, bQ: true };
  let ep = null;
  let history = [];
  let ply = 0;
  let abort = false;
  let nodes = 0;

  function emptyBoard() {
    return Array.from({ length: 8 }, () => Array(8).fill(null));
  }

  function opp(color) {
    return color === "w" ? "b" : "w";
  }

  function on(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  function resetPosition() {
    board = emptyBoard();
    const back = ["r", "n", "b", "q", "k", "b", "n", "r"];
    for (let c = 0; c < 8; c++) {
      board[0][c] = { type: back[c], color: "b" };
      board[1][c] = { type: "p", color: "b" };
      board[6][c] = { type: "p", color: "w" };
      board[7][c] = { type: back[c], color: "w" };
    }
    turn = "w";
    castle = { wK: true, wQ: true, bK: true, bQ: true };
    ep = null;
    history = [];
    ply = 0;
  }

  function loadPosition(pieces, side, rights) {
    board = emptyBoard();
    for (const p of pieces) board[p.r][p.f] = { type: p.t, color: p.c };
    turn = side;
    castle = rights || { wK: false, wQ: false, bK: false, bQ: false };
    ep = null;
    history = [];
  }

  function dump() {
    const rows = board.map((row) => row.map((p) => (p ? p.color + p.type : ".")).join("")).join("/");
    const epS = ep ? ep.r + "," + ep.c : "-";
    return rows + " " + turn + " " + [castle.wK, castle.wQ, castle.bK, castle.bQ].map((v) => (v ? 1 : 0)).join("") + " " + epS;
  }

  function kingPos(color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.color === color && p.type === "k") return [r, c];
      }
    }
    return null;
  }

  function rayHit(r, c, dr, dc, by, types) {
    let rr = r + dr;
    let cc = c + dc;
    while (on(rr, cc)) {
      const p = board[rr][cc];
      if (p) return p.color === by && types.indexOf(p.type) !== -1;
      rr += dr;
      cc += dc;
    }
    return false;
  }

  function attacked(r, c, by) {
    const pr = by === "w" ? r + 1 : r - 1;
    if (on(pr, c - 1)) {
      const p = board[pr][c - 1];
      if (p && p.color === by && p.type === "p") return true;
    }
    if (on(pr, c + 1)) {
      const p = board[pr][c + 1];
      if (p && p.color === by && p.type === "p") return true;
    }
    for (let i = 0; i < KNIGHT.length; i++) {
      const rr = r + KNIGHT[i][0];
      const cc = c + KNIGHT[i][1];
      if (!on(rr, cc)) continue;
      const p = board[rr][cc];
      if (p && p.color === by && p.type === "n") return true;
    }
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const rr = r + dr;
        const cc = c + dc;
        if (!on(rr, cc)) continue;
        const p = board[rr][cc];
        if (p && p.color === by && p.type === "k") return true;
      }
    }
    for (let i = 0; i < ROOK_DIR.length; i++) {
      if (rayHit(r, c, ROOK_DIR[i][0], ROOK_DIR[i][1], by, ["r", "q"])) return true;
    }
    for (let i = 0; i < BISHOP_DIR.length; i++) {
      if (rayHit(r, c, BISHOP_DIR[i][0], BISHOP_DIR[i][1], by, ["b", "q"])) return true;
    }
    return false;
  }

  function inCheck(color) {
    const pos = kingPos(color);
    if (!pos) return false;
    return attacked(pos[0], pos[1], opp(color));
  }

  function pushMove(list, fr, fc, tr, tc, extra) {
    const piece = board[fr][fc];
    const move = {
      fr: fr,
      fc: fc,
      tr: tr,
      tc: tc,
      piece: piece,
      promo: null,
      capture: null,
      castle: null,
      isEp: false,
      double: false,
    };
    if (extra) {
      if (extra.promo) move.promo = extra.promo;
      if (extra.capture) move.capture = extra.capture;
      if (extra.castle) move.castle = extra.castle;
      if (extra.isEp) move.isEp = true;
      if (extra.double) move.double = true;
    }
    list.push(move);
  }

  function addPawn(list, color, r, c) {
    const dir = color === "w" ? -1 : 1;
    const startRow = color === "w" ? 6 : 1;
    const last = color === "w" ? 0 : 7;
    const one = r + dir;
    if (on(one, c) && !board[one][c]) {
      if (one === last) {
        ["q", "r", "b", "n"].forEach((promo) => pushMove(list, r, c, one, c, { promo: promo }));
      } else {
        pushMove(list, r, c, one, c);
        if (r === startRow) {
          const two = r + dir * 2;
          if (!board[two][c]) pushMove(list, r, c, two, c, { double: true });
        }
      }
    }
    for (let dc = -1; dc <= 1; dc += 2) {
      const tc = c + dc;
      if (!on(one, tc)) continue;
      const target = board[one][tc];
      if (target && target.color !== color) {
        if (one === last) {
          ["q", "r", "b", "n"].forEach((promo) => pushMove(list, r, c, one, tc, { promo: promo, capture: target }));
        } else {
          pushMove(list, r, c, one, tc, { capture: target });
        }
      }
      if (ep && ep.r === one && ep.c === tc) {
        const cap = board[r][tc];
        pushMove(list, r, c, one, tc, { isEp: true, capture: cap });
      }
    }
  }

  function addSlider(list, r, c, dirs) {
    const piece = board[r][c];
    for (let i = 0; i < dirs.length; i++) {
      let rr = r + dirs[i][0];
      let cc = c + dirs[i][1];
      while (on(rr, cc)) {
        const target = board[rr][cc];
        if (!target) pushMove(list, r, c, rr, cc);
        else {
          if (target.color !== piece.color) pushMove(list, r, c, rr, cc, { capture: target });
          break;
        }
        rr += dirs[i][0];
        cc += dirs[i][1];
      }
    }
  }

  function addCastle(list, color) {
    const row = color === "w" ? 7 : 0;
    const king = board[row][4];
    if (!king || king.type !== "k" || king.color !== color) return;
    if (inCheck(color)) return;
    const sides = [
      { flag: color === "w" ? castle.wK : castle.bK, rook: 7, pass: [5, 6], empty: [5, 6], dest: 6, kind: "K" },
      { flag: color === "w" ? castle.wQ : castle.bQ, rook: 0, pass: [3, 2], empty: [1, 2, 3], dest: 2, kind: "Q" },
    ];
    const enemy = opp(color);
    for (let s = 0; s < sides.length; s++) {
      const side = sides[s];
      if (!side.flag) continue;
      const rook = board[row][side.rook];
      if (!rook || rook.type !== "r" || rook.color !== color) continue;
      let blocked = false;
      for (let i = 0; i < side.empty.length; i++) {
        if (board[row][side.empty[i]]) blocked = true;
      }
      if (blocked) continue;
      let unsafe = false;
      for (let i = 0; i < side.pass.length; i++) {
        if (attacked(row, side.pass[i], enemy)) unsafe = true;
      }
      if (unsafe) continue;
      pushMove(list, row, 4, row, side.dest, { castle: side.kind });
    }
  }

  function pseudoMoves(color) {
    const list = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece || piece.color !== color) continue;
        if (piece.type === "p") addPawn(list, color, r, c);
        else if (piece.type === "n") {
          for (let i = 0; i < KNIGHT.length; i++) {
            const rr = r + KNIGHT[i][0];
            const cc = c + KNIGHT[i][1];
            if (!on(rr, cc)) continue;
            const target = board[rr][cc];
            if (!target) pushMove(list, r, c, rr, cc);
            else if (target.color !== color) pushMove(list, r, c, rr, cc, { capture: target });
          }
        } else if (piece.type === "b") addSlider(list, r, c, BISHOP_DIR);
        else if (piece.type === "r") addSlider(list, r, c, ROOK_DIR);
        else if (piece.type === "q") addSlider(list, r, c, ROOK_DIR.concat(BISHOP_DIR));
        else if (piece.type === "k") {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (!dr && !dc) continue;
              const rr = r + dr;
              const cc = c + dc;
              if (!on(rr, cc)) continue;
              const target = board[rr][cc];
              if (!target) pushMove(list, r, c, rr, cc);
              else if (target.color !== color) pushMove(list, r, c, rr, cc, { capture: target });
            }
          }
        }
      }
    }
    addCastle(list, color);
    return list;
  }

  function clearRookRight(color, r, c) {
    if (color === "w" && r === 7 && c === 0) castle.wQ = false;
    if (color === "w" && r === 7 && c === 7) castle.wK = false;
    if (color === "b" && r === 0 && c === 0) castle.bQ = false;
    if (color === "b" && r === 0 && c === 7) castle.bK = false;
  }

  function makeMove(m) {
    m._turn = turn;
    m._ep = ep;
    m._wK = castle.wK;
    m._wQ = castle.wQ;
    m._bK = castle.bK;
    m._bQ = castle.bQ;
    m._cap = null;
    m._rookFrom = null;
    const piece = board[m.fr][m.fc];
    m._piece = piece;
    if (m.isEp) {
      m._capR = m.fr;
      m._capC = m.tc;
      m._cap = board[m._capR][m._capC];
      board[m._capR][m._capC] = null;
    } else if (board[m.tr][m.tc]) {
      m._cap = board[m.tr][m.tc];
      m._capR = m.tr;
      m._capC = m.tc;
    }
    board[m.fr][m.fc] = null;
    board[m.tr][m.tc] = m.promo ? { type: m.promo, color: piece.color } : piece;
    if (m.castle) {
      const row = m.fr;
      const fromC = m.castle === "K" ? 7 : 0;
      const toC = m.castle === "K" ? 5 : 3;
      m._rookFrom = fromC;
      m._rookTo = toC;
      board[row][toC] = board[row][fromC];
      board[row][fromC] = null;
    }
    if (piece.type === "k") {
      if (piece.color === "w") { castle.wK = false; castle.wQ = false; }
      else { castle.bK = false; castle.bQ = false; }
    }
    if (piece.type === "r") clearRookRight(piece.color, m.fr, m.fc);
    if (m._cap && m._cap.type === "r") clearRookRight(m._cap.color, m._capR, m._capC);
    ep = m.double ? { r: (m.fr + m.tr) / 2, c: m.fc } : null;
    turn = opp(turn);
  }

  function undoMove(m) {
    const row = m.fr;
    if (m.castle) {
      board[row][m._rookFrom] = board[row][m._rookTo];
      board[row][m._rookTo] = null;
    }
    board[m.tr][m.tc] = null;
    board[m.fr][m.fc] = m._piece;
    if (m._cap) board[m._capR][m._capC] = m._cap;
    castle.wK = m._wK;
    castle.wQ = m._wQ;
    castle.bK = m._bK;
    castle.bQ = m._bQ;
    ep = m._ep;
    turn = m._turn;
  }

  function legalMoves(color) {
    const side = color || turn;
    return pseudoMoves(side).filter((m) => {
      makeMove(m);
      const bad = inCheck(side);
      undoMove(m);
      return !bad;
    });
  }

  function insufficient() {
    const extras = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type !== "k") extras.push({ p: p, r: r, c: c });
      }
    }
    if (!extras.length) return true;
    if (extras.length === 1 && (extras[0].p.type === "n" || extras[0].p.type === "b")) return true;
    if (extras.length === 2 && extras[0].p.type === "b" && extras[1].p.type === "b") {
      const same = (extras[0].r + extras[0].c) % 2 === (extras[1].r + extras[1].c) % 2;
      if (same) return true;
    }
    return false;
  }

  function outcomeOf(moves) {
    const check = inCheck(turn);
    if (!moves.length) return check ? "mate" : "stalemate";
    if (insufficient()) return "material";
    if (check) return "check";
    return "ok";
  }

  function relRow(color, r) {
    return color === "w" ? 7 - r : r;
  }

  function evaluate() {
    let white = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p) continue;
        const sign = p.color === "w" ? 1 : -1;
        const table = PST[p.type][relRow(p.color, r)][c];
        white += sign * (MAT[p.type] + table);
      }
    }
    return turn === "w" ? white : -white;
  }

  function guess(m) {
    let score = 0;
    if (m.capture) score += 10 * MAT[m.capture.type] - MAT[m.piece.type];
    if (m.promo === "q") score += 800;
    else if (m.promo) score += 280;
    if (m.castle) score += 40;
    return score;
  }

  function negamax(depth, alpha, beta, deadline, useQ) {
    if (abort) return 0;
    if ((nodes++ & 63) === 0 && performance.now() > deadline) {
      abort = true;
      return 0;
    }
    if (depth === 0) {
      if (inCheck(turn)) {
        const replies = legalMoves(turn);
        if (!replies.length) return -100000 + ply;
        if (!useQ) return evaluate();
      } else if (!useQ) {
        return evaluate();
      }
      return qsearch(alpha, beta, deadline, 2);
    }
    const moves = legalMoves(turn);
    if (!moves.length) return inCheck(turn) ? -100000 + ply : 0;
    moves.sort((a, b) => guess(b) - guess(a));
    let best = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      makeMove(m);
      ply++;
      const score = -negamax(depth - 1, -beta, -alpha, deadline, useQ);
      ply--;
      undoMove(m);
      if (abort) return 0;
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (alpha >= beta) break;
    }
    return best;
  }

  function qsearch(alpha, beta, deadline, left) {
    if (abort) return 0;
    if ((nodes++ & 63) === 0 && performance.now() > deadline) {
      abort = true;
      return 0;
    }
    const check = inCheck(turn);
    const stand = evaluate();
    if (!check) {
      if (stand >= beta) return beta;
      if (stand > alpha) alpha = stand;
      if (left <= 0) return stand;
    }
    let moves = legalMoves(turn);
    if (!moves.length) return check ? -100000 + ply : stand;
    if (!check) moves = moves.filter((m) => m.capture || m.promo);
    if (!moves.length) return stand;
    moves.sort((a, b) => guess(b) - guess(a));
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      makeMove(m);
      ply++;
      const score = -qsearch(-beta, -alpha, deadline, left - 1);
      ply--;
      undoMove(m);
      if (abort) return 0;
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  function aiConfig(level) {
    if (level <= 2) return { silly: true, cap: level === 1 ? 0.25 : 0.5, maxDepth: 0, time: 80, noise: 1, useQ: false };
    if (level <= 4) return { silly: false, maxDepth: 1, time: 400, noise: level === 3 ? 0.62 : 0.38, useQ: false };
    if (level <= 6) return { silly: false, maxDepth: 2, time: 550, noise: level === 5 ? 0.3 : 0.16, useQ: false };
    if (level <= 8) return { silly: false, maxDepth: 3, time: 700, noise: level === 7 ? 0.1 : 0.05, useQ: false };
    if (level === 9) return { silly: false, maxDepth: 3, time: 800, noise: 0.03, useQ: true };
    return { silly: false, maxDepth: 4, time: 800, noise: 0, useQ: true };
  }

  function queenOnly(moves) {
    const kept = moves.filter((m) => !m.promo || m.promo === "q");
    return kept.length ? kept : moves;
  }

  function sillyPick(moves, capBias) {
    const pool = queenOnly(moves);
    const caps = pool.filter((m) => m.capture);
    if (caps.length && Math.random() < capBias) return caps[Math.floor(Math.random() * caps.length)];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function exactRoot(moves, depth, deadline, useQ) {
    const scored = [];
    for (let i = 0; i < moves.length; i++) {
      if (performance.now() > deadline) break;
      const m = moves[i];
      makeMove(m);
      ply = 1;
      abort = false;
      let score;
      if (depth === 1) {
        if (inCheck(turn)) {
          const replies = legalMoves(turn);
          score = replies.length ? -evaluate() : -(-100000 + ply);
        } else score = -evaluate();
      } else {
        score = -negamax(depth - 1, -1e9, 1e9, deadline, useQ);
      }
      undoMove(m);
      ply = 0;
      if (abort) break;
      scored.push({ m: m, s: score });
    }
    scored.sort((a, b) => b.s - a.s);
    return scored;
  }

  function searchRoot(moves, maxDepth, deadline, useQ) {
    let best = moves[0];
    for (let d = 1; d <= maxDepth; d++) {
      if (performance.now() > deadline) break;
      abort = false;
      let alpha = -1e9;
      let localBest = null;
      let localScore = -1e9;
      const rest = moves.filter((m) => m !== best).sort((a, b) => (b._score || -1e9) - (a._score || -1e9));
      const ordered = [best].concat(rest);
      let stop = false;
      for (let i = 0; i < ordered.length; i++) {
        if (performance.now() > deadline) { stop = true; break; }
        const m = ordered[i];
        makeMove(m);
        ply = 1;
        const score = -negamax(d - 1, -1e9, -alpha, deadline, useQ);
        undoMove(m);
        ply = 0;
        if (abort) { stop = true; break; }
        m._score = score;
        if (score > localScore) {
          localScore = score;
          localBest = m;
        }
        if (score > alpha) alpha = score;
      }
      if (stop || !localBest) break;
      best = localBest;
    }
    return best;
  }

  function shallowSecond(moves, chosen) {
    let best = null;
    let bestS = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      if (m === chosen) continue;
      if (m.promo && m.promo !== "q") continue;
      makeMove(m);
      const score = -evaluate();
      undoMove(m);
      if (score > bestS) {
        bestS = score;
        best = m;
      }
    }
    return best;
  }

  function chooseMove(level, opts) {
    const options = opts || {};
    const cfg = aiConfig(level);
    if (options.fair) {
      cfg.silly = false;
      cfg.noise = 0;
      cfg.maxDepth = Math.max(cfg.maxDepth, 2);
      cfg.time = Math.min(cfg.time, options.time || 380);
      cfg.useQ = false;
    }
    let moves = legalMoves(turn);
    if (!moves.length) return null;
    if (moves.length === 1) return moves[0];
    if (cfg.silly && !options.fair) return sillyPick(moves, cfg.cap);
    const deadline = performance.now() + cfg.time;
    ply = 0;
    abort = false;
    nodes = 0;
    let chosen;
    if (cfg.maxDepth <= 2) {
      const scored = exactRoot(moves, cfg.maxDepth, deadline, cfg.useQ);
      if (!scored.length) return moves[0];
      chosen = scored[0].m;
      if (cfg.noise > 0 && scored.length > 1 && Math.random() < cfg.noise) {
        if (cfg.noise >= 0.5 && scored.length > 2 && Math.random() < 0.35) chosen = scored[2].m;
        else chosen = scored[1].m;
      }
      return chosen;
    }
    chosen = searchRoot(moves, cfg.maxDepth, deadline, cfg.useQ) || moves[0];
    if (cfg.noise > 0 && Math.random() < cfg.noise) {
      const alt = shallowSecond(moves, chosen);
      if (alt) chosen = alt;
    }
    return chosen;
  }

  function pieceSvg(type, color) {
    const white = color === "w";
    const fill = white ? "#F7F7F5" : "#161616";
    const stroke = white ? "#1A1A1A" : "#F4F1EA";
    const cut = stroke;
    const pen = 'fill="' + fill + '" stroke="' + stroke + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke fill"';
    let shape = "";
    if (type === "k") {
      shape =
        '<rect ' + pen + ' x="35" y="2" width="10" height="32" rx="1.4"/>' +
        '<rect ' + pen + ' x="27" y="8" width="26" height="10" rx="1.4"/>' +
        '<path ' + pen + ' d="M22 30H58L54 38L60 58H68V72H12V58H20L26 38Z"/>';
    } else if (type === "q") {
      shape =
        '<path ' + pen + ' d="M14 72H66V62H58L52 44L62 36L54 16L46 30L40 8L34 30L26 16L18 36L28 44L22 62H14Z"/>';
    } else if (type === "r") {
      shape =
        '<path ' + pen + ' d="M16 14H28V24H34V14H46V24H52V14H64V32H58V46H64V60H70V72H10V60H16V46H22V32H16Z"/>';
    } else if (type === "b") {
      shape =
        '<circle ' + pen + ' cx="40" cy="10" r="6"/>' +
        '<path ' + pen + ' d="M40 16C52 22 58 34 54 46L58 50H52L56 60H66V72H14V60H24L28 50H22L26 46C22 34 28 22 40 16Z"/>' +
        '<path fill="' + cut + '" d="M38.7 20H41.3V34H38.7Z"/>';
    } else if (type === "n") {
      shape =
        '<path ' + pen + ' d="M18 70L14 50L26 32L24 16L36 6L44 16L54 14L70 26L72 38L58 42L66 56L50 70L32 64Z"/>' +
        '<circle fill="' + cut + '" cx="58" cy="30" r="2.2"/>';
    } else {
      shape =
        '<path ' + pen + ' d="M22 72L32 58Q26 50 31 36A12 12 0 1 1 49 36Q54 50 48 58L58 72Z"/>';
    }
    const flip = color === "b" && type === "n" ? ' transform="translate(80 0) scale(-1 1)"' : "";
    return '<svg viewBox="0 0 80 80" aria-hidden="true"><g' + flip + ">" + shape + "</g></svg>";
  }

  const sounds = {
    ctx: null,
    master: null,
    muted: false,
    nodes: [],
    hum: null,
    last: "",
    unlock() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!this.ctx) {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.2;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    stopMain() {
      this.nodes.forEach((node) => { try { node.stop(); } catch (e) { /* already stopped */ } });
      this.nodes = [];
    },
    stopHum() {
      if (!this.hum) return;
      try { this.hum.o.stop(); } catch (e) { /* already stopped */ }
      try { this.hum.lfo.stop(); } catch (e) { /* already stopped */ }
      this.hum = null;
    },
    tone(freq, dur, type, gain, delay, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + (delay || 0);
      const osc = this.ctx.createOscillator();
      const amp = this.ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(gain, t + 0.02);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(amp);
      amp.connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      this.nodes.push(osc);
    },
    play(name) {
      this.unlock();
      if (this.muted || !this.ctx) {
        this.last = name;
        return;
      }
      this.stopHum();
      this.stopMain();
      this.last = name;
      const now = this;
      if (name === "tap") {
        now.tone(523, 0.12, "sine", 0.12, 0);
        now.tone(659, 0.16, "sine", 0.1, 0.11);
      } else if (name === "pick") {
        now.tone(360, 0.16, "sine", 0.08, 0, 680);
      } else if (name === "move") {
        now.tone(784, 0.18, "triangle", 0.14, 0);
      } else if (name === "knight") {
        now.tone(494, 0.08, "triangle", 0.12, 0);
        now.tone(784, 0.1, "triangle", 0.1, 0.08);
      } else if (name === "pawn") {
        now.tone(420, 0.12, "triangle", 0.12, 0);
      } else if (name === "capture") {
        now.tone(640, 0.16, "sine", 0.12, 0, 180);
        now.tone(320, 0.16, "triangle", 0.1, 0.14, 560);
        now.tone(1400, 0.08, "sine", 0.05, 0.05);
        now.tone(1800, 0.08, "sine", 0.04, 0.12);
      } else if (name === "special") {
        now.tone(523, 0.14, "triangle", 0.12, 0);
        now.tone(659, 0.14, "triangle", 0.11, 0.13);
        now.tone(784, 0.22, "triangle", 0.12, 0.26);
      } else if (name === "check") {
        now.tone(196, 0.16, "sine", 0.14, 0);
        now.tone(156, 0.2, "sine", 0.12, 0.18);
      } else if (name === "win") {
        [[523, 0], [659, 0.18], [784, 0.36], [1046, 0.56], [1318, 0.78], [1568, 1.02], [1318, 1.24]].forEach((note) => {
          now.tone(note[0], 0.22, "triangle", 0.12, note[1]);
        });
      } else if (name === "draw") {
        now.tone(659, 0.18, "sine", 0.08, 0);
        now.tone(523, 0.18, "sine", 0.08, 0.16);
        now.tone(392, 0.28, "sine", 0.07, 0.32);
      } else if (name === "no") {
        now.tone(150, 0.08, "triangle", 0.04, 0);
      }
    },
    startHum() {
      this.unlock();
      if (this.muted || !this.ctx) return;
      this.stopMain();
      this.stopHum();
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lg = this.ctx.createGain();
      o.type = "sine";
      o.frequency.value = 196;
      g.gain.value = 0.018;
      lfo.frequency.value = 3.2;
      lg.gain.value = 0.01;
      lfo.connect(lg);
      lg.connect(g.gain);
      o.connect(g);
      g.connect(this.master);
      o.start();
      lfo.start();
      this.hum = { o: o, lfo: lfo, g: g };
      this.last = "hum";
    },
  };

  try {
    if (localStorage.getItem("forest-chess-mute") === "1") sounds.muted = true;
  } catch (e) { /* private mode */ }

  const ui = {
    mode: "two",
    level: 1,
    human: "w",
    selected: null,
    moves: [],
    outcome: "ok",
    last: null,
    note: "",
    noteTimer: 0,
    thinking: false,
    thinkToken: 0,
    promo: null,
    hint: null,
    pop: null,
    flip: false,
    acceptInputAfter: 0,
  };

  let boardEl, statusEl, noteEl, thinkEl, promoEl, promoChoices, soundBtn;

  function $(id) { return document.getElementById(id); }

  function showScreen(id) {
    ["screen-start", "screen-level", "screen-play"].forEach((name) => {
      $(name).classList.toggle("hidden", name !== id);
    });
  }

  function setNote(text) {
    ui.note = text || "";
    if (noteEl) noteEl.textContent = ui.note;
    clearTimeout(ui.noteTimer);
    if (text) ui.noteTimer = setTimeout(() => { ui.note = ""; if (noteEl) noteEl.textContent = ""; }, 2600);
  }

  function sync() {
    ui.moves = legalMoves(turn);
    ui.outcome = outcomeOf(ui.moves);
  }

  function sideToMoveLabel() {
    if (ui.mode === "ai") {
      if (turn === ui.human) return "Your turn";
      return "Computer's turn";
    }
    return SIDE_NAME[turn] + "'s turn";
  }

  function statusHtml() {
    if (ui.outcome === "mate") {
      const winner = opp(turn);
      return "Checkmate! " + (ui.mode === "ai" && winner === ui.human ? "You win!" : SIDE_NAME[winner] + " wins!");
    }
    if (ui.outcome === "stalemate") return "Draw! No moves left";
    if (ui.outcome === "material") return "Draw! Not enough pieces";
    const icon = pieceSvg("k", turn);
    let text = sideToMoveLabel();
    if (ui.outcome === "check") text = "Check! " + text;
    if (ui.thinking) text = "Computer is thinking…";
    return icon + "<span>" + text + "</span>";
  }

  function burst(x, y, count) {
    const layer = $("bursts");
    if (!layer) return;
    for (let i = 0; i < count; i++) {
      const star = document.createElement("div");
      star.className = "spark";
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 110;
      star.style.left = x + "px";
      star.style.top = y + "px";
      star.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      star.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      star.style.background = ["#ffe56a", "#fff", "#ffb4d8", "#9be7ff"][i % 4];
      layer.appendChild(star);
      setTimeout(() => star.remove(), 800);
    }
  }

  function burstSquare(r, c) {
    const el = boardEl.querySelector('.sq[data-r="' + r + '"][data-c="' + c + '"]');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 12);
  }

  function celebrate() {
    for (let i = 0; i < 18; i++) {
      setTimeout(() => burst(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.8, 4), i * 70);
    }
  }

  function render() {
    if (!boardEl) return;
    const selectedMoves = ui.selected ? ui.moves.filter((m) => m.fr === ui.selected.r && m.fc === ui.selected.c) : [];
    const dests = {};
    selectedMoves.forEach((m) => { dests[m.tr + "," + m.tc] = m.capture || m.isEp ? "capture" : "legal"; });
    boardEl.innerHTML = "";
    for (let vr = 0; vr < 8; vr++) {
      for (let vc = 0; vc < 8; vc++) {
        const r = ui.flip ? 7 - vr : vr;
        const c = ui.flip ? 7 - vc : vc;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sq " + ((r + c) % 2 === 1 ? "dark" : "light");
        btn.dataset.r = String(r);
        btn.dataset.c = String(c);
        btn.setAttribute("role", "gridcell");
        const piece = board[r][c];
        if (piece) {
          btn.innerHTML = pieceSvg(piece.type, piece.color);
          btn.setAttribute("aria-label", SIDE_NAME[piece.color] + TYPE_NAME[piece.type]);
        } else btn.setAttribute("aria-label", "Empty square");
        if (ui.selected && ui.selected.r === r && ui.selected.c === c) btn.classList.add("sel");
        if (dests[r + "," + c]) btn.classList.add(dests[r + "," + c]);
        if (ui.last && ((ui.last.fr === r && ui.last.fc === c) || (ui.last.tr === r && ui.last.tc === c))) btn.classList.add("last");
        if (ui.hint && ((ui.hint.fr === r && ui.hint.fc === c) || (ui.hint.tr === r && ui.hint.tc === c))) btn.classList.add("hint");
        if (ui.outcome === "check" && piece && piece.type === "k" && piece.color === turn) btn.classList.add("check");
        if (ui.pop && ui.pop.r === r && ui.pop.c === c) btn.classList.add("pop");
        boardEl.appendChild(btn);
      }
    }
    ui.pop = null;
    statusEl.className = "status";
    if (ui.outcome === "mate") statusEl.classList.add("win");
    else if (ui.outcome === "stalemate" || ui.outcome === "material") statusEl.classList.add("draw");
    else statusEl.classList.add(turn === "w" ? "sun" : "moon");
    if (ui.outcome === "check") statusEl.classList.add("check");
    statusEl.innerHTML = statusHtml();
    thinkEl.classList.toggle("hidden", !ui.thinking);
    const over = ui.outcome === "mate" || ui.outcome === "stalemate" || ui.outcome === "material";
    $("btn-hint").disabled = over || ui.thinking || ui.promo || (ui.mode === "ai" && turn !== ui.human);
    $("btn-undo").disabled = ui.promo || history.length === 0;
    noteEl.textContent = ui.note;
  }

  function soundFor(move, result) {
    if (result === "mate") return "win";
    if (result === "stalemate" || result === "material") return "draw";
    if (result === "check") return "check";
    if (move.castle || move.promo) return "special";
    if (move.capture || move.isEp) return "capture";
    if (move.piece.type === "n") return "knight";
    if (move.piece.type === "p") return "pawn";
    return "move";
  }

  function finishHumanTurn(move) {
    ui.selected = null;
    ui.hint = null;
    ui.last = move;
    ui.pop = { r: move.tr, c: move.tc };
    sync();
    if (move.castle) setNote("Castling!");
    else if (move.promo) setNote("Promotion!");
    else setNote("");
    sounds.play(soundFor(move, ui.outcome));
    if (move.capture || move.isEp) burstSquare(move.tr, move.tc);
    if (ui.outcome === "mate") {
      setNote("Checkmate! " + (ui.mode === "ai" && opp(turn) === ui.human ? "You win!" : SIDE_NAME[opp(turn)] + " wins!"));
      celebrate();
    } else if (ui.outcome === "stalemate") setNote("Stalemate! It's a draw");
    else if (ui.outcome === "material") setNote("It's a draw");
    render();
    maybeAi();
  }

  function maybeAi() {
    if (ui.mode === "ai" && turn !== ui.human && (ui.outcome === "ok" || ui.outcome === "check")) startAi();
  }

  function commit(move) {
    makeMove(move);
    history.push(move);
    finishHumanTurn(move);
  }

  function openPromo(moves) {
    ui.promo = moves;
    promoChoices.innerHTML = "";
    const order = ["q", "r", "b", "n"];
    order.forEach((type) => {
      const move = moves.find((m) => m.promo === type);
      if (!move) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML = pieceSvg(type, move.piece.color) + "<span>" + PROMO_NAME[type] + "</span>";
      btn.addEventListener("click", () => {
        sounds.play("tap");
        ui.promo = null;
        promoEl.classList.add("hidden");
        commit(move);
      });
      promoChoices.appendChild(btn);
    });
    promoEl.classList.remove("hidden");
    render();
  }

  function onSquare(r, c, stamp) {
    sounds.unlock();
    if (stamp && stamp < ui.acceptInputAfter) return;
    if (ui.thinking || ui.promo) return;
    if (ui.outcome === "mate" || ui.outcome === "stalemate" || ui.outcome === "material") return;
    if (ui.mode === "ai" && turn !== ui.human) return;
    const piece = board[r][c];
    if (ui.selected) {
      const hits = ui.moves.filter((m) => m.fr === ui.selected.r && m.fc === ui.selected.c && m.tr === r && m.tc === c);
      if (hits.length) {
        if (hits[0].promo) openPromo(hits);
        else commit(hits[0]);
        return;
      }
    }
    if (piece && piece.color === turn) {
      const mine = ui.moves.some((m) => m.fr === r && m.fc === c);
      if (!mine) {
        sounds.play("no");
        return;
      }
      ui.selected = { r: r, c: c };
      ui.hint = null;
      sounds.play("pick");
      render();
      return;
    }
    sounds.play("no");
    boardEl.classList.remove("shake");
    void boardEl.offsetWidth;
    boardEl.classList.add("shake");
  }

  function startAi() {
    if (ui.mode !== "ai" || turn === ui.human) return;
    if (ui.outcome === "mate" || ui.outcome === "stalemate" || ui.outcome === "material") return;
    ui.thinking = true;
    ui.selected = null;
    const token = ++ui.thinkToken;
    render();
    sounds.startHum();
    const level = ui.level;
    setTimeout(() => {
      if (token !== ui.thinkToken) return;
      const move = chooseMove(level);
      if (token !== ui.thinkToken) return;
      sounds.stopHum();
      ui.thinking = false;
      if (!move) {
        sync();
        render();
        return;
      }
      makeMove(move);
      history.push(move);
      ui.acceptInputAfter = performance.now();
      finishHumanTurn(move);
    }, 320);
  }

  function undoOne() {
    if (!history.length) return;
    undoMove(history.pop());
  }

  function onUndo() {
    sounds.play("tap");
    if (ui.promo || !history.length) {
      sounds.play("no");
      return;
    }
    ui.thinkToken++;
    sounds.stopHum();
    ui.thinking = false;
    ui.promo = null;
    promoEl.classList.add("hidden");
    ui.selected = null;
    ui.hint = null;
    if (ui.mode === "ai") {
      if (turn === ui.human && history.length >= 2 && history[history.length - 1]._piece.color !== ui.human) {
        undoOne();
        undoOne();
      } else undoOne();
    } else undoOne();
    ui.last = history.length ? history[history.length - 1] : null;
    setNote("");
    sync();
    render();
    maybeAi();
  }

  function beginGame(mode, level, humanColor) {
    ui.mode = mode;
    ui.level = level || 1;
    ui.human = humanColor || "w";
    ui.flip = mode === "ai" && ui.human === "b";
    ui.selected = null;
    ui.last = null;
    ui.hint = null;
    ui.promo = null;
    ui.thinking = false;
    ui.thinkToken++;
    sounds.stopHum();
    promoEl.classList.add("hidden");
    resetPosition();
    if (mode === "ai" && ui.human === "b") turn = "w";
    sync();
    setNote(mode === "ai" ? "Playing " + LEVELS[ui.level - 1].name : "Two kids are playing");
    showScreen("screen-play");
    render();
    if (mode === "ai" && ui.human === "b") startAi();
  }

  function updateSoundButton() {
    soundBtn.classList.toggle("off", sounds.muted);
    soundBtn.setAttribute("aria-pressed", sounds.muted ? "false" : "true");
    soundBtn.textContent = sounds.muted ? "🔇 Mute" : "🔊 Sound";
  }

  function buildLevels() {
    const grid = $("level-grid");
    LEVELS.forEach((level) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "level-btn" + (level.n === 10 ? " glow" : "");
      btn.innerHTML = '<span class="emo">' + level.emo + '</span><span class="lvl">' + level.n + " " + level.name + "</span>";
      btn.addEventListener("click", () => {
        sounds.play("tap");
        ui.level = level.n;
        Array.from(grid.children).forEach((child, i) => child.classList.toggle("on", i === level.n - 1));
        $("btn-human-first").disabled = false;
        $("btn-ai-first").disabled = false;
      });
      grid.appendChild(btn);
    });
  }

  function init() {
    boardEl = $("board");
    statusEl = $("status");
    noteEl = $("note");
    thinkEl = $("think-badge");
    promoEl = $("promo");
    promoChoices = $("promo-choices");
    soundBtn = $("sound-btn");
    buildLevels();
    updateSoundButton();
    soundBtn.addEventListener("click", () => {
      sounds.unlock();
      sounds.muted = !sounds.muted;
      try { localStorage.setItem("forest-chess-mute", sounds.muted ? "1" : "0"); } catch (e) { /* ignore */ }
      if (sounds.muted) sounds.stopHum();
      else if (ui.thinking) sounds.startHum();
      else sounds.play("tap");
      updateSoundButton();
    });
    $("btn-two").addEventListener("click", () => { sounds.play("tap"); beginGame("two", 1, "w"); });
    $("btn-ai").addEventListener("click", () => {
      sounds.play("tap");
      ui.level = 0;
      $("btn-human-first").disabled = true;
      $("btn-ai-first").disabled = true;
      Array.from($("level-grid").children).forEach((child) => child.classList.remove("on"));
      showScreen("screen-level");
    });
    $("btn-level-back").addEventListener("click", () => { sounds.play("tap"); showScreen("screen-start"); });
    $("btn-human-first").addEventListener("click", () => {
      if (!ui.level) { sounds.play("no"); setNote(""); return; }
      sounds.play("tap");
      beginGame("ai", ui.level, "w");
    });
    $("btn-ai-first").addEventListener("click", () => {
      if (!ui.level) { sounds.play("no"); return; }
      sounds.play("tap");
      beginGame("ai", ui.level, "b");
    });
    $("btn-back").addEventListener("click", () => {
      sounds.play("tap");
      ui.thinkToken++;
      sounds.stopHum();
      ui.thinking = false;
      showScreen("screen-start");
    });
    $("btn-again").addEventListener("click", () => { sounds.play("tap"); beginGame(ui.mode, ui.level || 1, ui.human); });
    $("btn-undo").addEventListener("click", onUndo);
    $("btn-hint").addEventListener("click", () => {
      sounds.play("tap");
      if ($("btn-hint").disabled) return;
      const hintLevel = Math.max(ui.mode === "ai" ? ui.level : 5, 5);
      const move = chooseMove(hintLevel, { fair: true, time: 360 });
      if (!move) { sounds.play("no"); return; }
      ui.hint = move;
      ui.selected = { r: move.fr, c: move.fc };
      setNote("Try the glowing move");
      render();
    });
    boardEl.addEventListener("click", (event) => {
      const sq = event.target.closest(".sq");
      if (!sq) return;
      onSquare(Number(sq.dataset.r), Number(sq.dataset.c), event.timeStamp);
    });
    document.addEventListener("pointerdown", () => sounds.unlock(), { once: false });
  }

  function playAlg(text) {
    const fc = text.charCodeAt(0) - 97;
    const fr = 8 - Number(text[1]);
    const tc = text.charCodeAt(2) - 97;
    const tr = 8 - Number(text[3]);
    const promo = text[4] || null;
    const moves = legalMoves(turn).filter((m) => m.fr === fr && m.fc === fc && m.tr === tr && m.tc === tc && (!promo || m.promo === promo));
    let move = moves[0];
    if (!promo && moves.length > 1) move = moves.find((m) => m.promo === "q") || moves[0];
    if (!move) throw new Error("illegal " + text + " dump " + dump());
    makeMove(move);
    history.push(move);
    return move;
  }

  const api = {
    reset: resetPosition,
    load: loadPosition,
    dump: dump,
    move: playAlg,
    legal: () => legalMoves(turn),
    turn: () => turn,
    inCheck: () => inCheck(turn),
    outcome: () => outcomeOf(legalMoves(turn)),
    undo: () => { if (history.length) undoMove(history.pop()); },
    choose: chooseMove,
    historyLength: () => history.length,
    ep: () => ep,
    castle: () => Object.assign({}, castle),
  };

  function selfCheck() {
    const errors = [];
    function expect(cond, msg) { if (!cond) errors.push(msg); }
    resetPosition();
    expect(legalMoves(turn).length === 20, "start moves " + legalMoves(turn).length);
    playAlg("f2f3"); playAlg("e7e5"); playAlg("g2g4"); playAlg("d8h4");
    expect(outcomeOf(legalMoves(turn)) === "mate", "fool mate " + outcomeOf(legalMoves(turn)));
    resetPosition();
    ["e2e4", "e7e5", "d1h5", "b8c6", "f1c4", "g8f6"].forEach(playAlg);
    const mateMove = chooseMove(4, { fair: true, time: 500 });
    expect(!!mateMove && mateMove.fr === 3 && mateMove.fc === 7 && mateMove.tr === 1 && mateMove.tc === 5, "scholar mate search");
    makeMove(mateMove);
    expect(outcomeOf(legalMoves(turn)) === "mate", "qxf7 is mate");
    resetPosition();
    ["e2e4", "a7a6", "e4e5", "d7d5"].forEach(playAlg);
    const epMove = legalMoves(turn).find((m) => m.isEp && m.fc === 4 && m.tc === 3);
    expect(!!epMove, "en passant exists");
    makeMove(epMove);
    expect(!board[3][3] && board[2][3] && board[2][3].type === "p", "en passant capture");
    undoMove(epMove);
    expect(board[3][3] && board[3][3].color === "b" && !board[2][3], "en passant undo");
    resetPosition();
    ["e2e4", "e7e5", "g1f3", "b8c6", "f1e2", "g8f6"].forEach(playAlg);
    expect(legalMoves(turn).some((m) => m.castle === "K"), "castle kingside");
    loadPosition([
      { t: "k", c: "w", r: 7, f: 4 }, { t: "r", c: "w", r: 7, f: 7 }, { t: "r", c: "b", r: 0, f: 5 },
      { t: "k", c: "b", r: 0, f: 0 },
    ], "w", { wK: true, wQ: false, bK: false, bQ: false });
    expect(!legalMoves(turn).some((m) => m.castle), "no castle through check");
    loadPosition([
      { t: "k", c: "w", r: 7, f: 4 }, { t: "p", c: "w", r: 1, f: 0 }, { t: "k", c: "b", r: 0, f: 4 },
    ], "w");
    const promos = legalMoves(turn).filter((m) => m.promo && m.tc === 0);
    expect(promos.length === 4, "four promotions");
    const queen = promos.find((m) => m.promo === "q");
    makeMove(queen);
    expect(board[0][0].type === "q", "promoted");
    undoMove(queen);
    expect(board[1][0].type === "p" && !board[0][0], "promo undo");
    loadPosition([
      { t: "k", c: "b", r: 0, f: 7 }, { t: "q", c: "w", r: 2, f: 6 }, { t: "k", c: "w", r: 7, f: 0 },
    ], "b");
    expect(outcomeOf(legalMoves(turn)) === "stalemate", "stalemate " + outcomeOf(legalMoves(turn)));
    loadPosition([
      { t: "k", c: "w", r: 7, f: 4 }, { t: "q", c: "w", r: 6, f: 4 }, { t: "r", c: "b", r: 0, f: 4 }, { t: "k", c: "b", r: 0, f: 0 },
    ], "w");
    expect(!legalMoves(turn).some((m) => m.fr === 6 && m.fc === 4 && m.tc !== 4), "pinned queen");
    expect(legalMoves(turn).some((m) => m.fr === 6 && m.fc === 4 && m.tc === 4), "queen along pin");
    loadPosition([{ t: "k", c: "w", r: 7, f: 0 }, { t: "k", c: "b", r: 0, f: 0 }], "w");
    expect(outcomeOf(legalMoves(turn)) === "material", "bare kings");
    resetPosition();
    const startDump = dump();
    for (let game = 0; game < 40; game++) {
      resetPosition();
      const local = [];
      for (let step = 0; step < 24; step++) {
        const moves = legalMoves(turn);
        const end = outcomeOf(moves);
        if (end === "mate" || end === "stalemate" || end === "material") break;
        const move = moves[Math.floor(Math.random() * moves.length)];
        makeMove(move);
        local.push(move);
      }
      while (local.length) undoMove(local.pop());
      if (dump() !== startDump) { errors.push("fuzz undo " + game + " " + dump()); break; }
    }
    resetPosition();
    const t0 = performance.now();
    const aiMove = chooseMove(10);
    const elapsed = performance.now() - t0;
    expect(!!aiMove, "level 10 move");
    expect(legalMoves("w").some((m) => m.fr === aiMove.fr && m.fc === aiMove.fc && m.tr === aiMove.tr && m.tc === aiMove.tc && m.promo === aiMove.promo && !!m.castle === !!aiMove.castle), "level 10 legal");
    expect(elapsed < 1200, "level 10 time " + Math.round(elapsed));
    resetPosition();
    const silly = chooseMove(1);
    expect(!!silly, "level 1 move");
    return errors;
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }

  const exported = { api: api, selfCheck: selfCheck, sounds: sounds };
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  if (typeof window !== "undefined") window.ForestChess = exported;
})();
