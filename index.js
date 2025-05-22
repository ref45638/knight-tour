let autoMode = false;
let autoTimer = null;

function warnsdorff(x, y, tempVisited) {
  // Warnsdorff's rule: pick the move with the fewest onward moves
  let moves = [
    [x + 2, y + 1],
    [x + 2, y - 1],
    [x - 2, y + 1],
    [x - 2, y - 1],
    [x + 1, y + 2],
    [x + 1, y - 2],
    [x - 1, y + 2],
    [x - 1, y - 2],
  ].filter(
    ([nx, ny]) =>
      nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && !tempVisited[nx][ny]
  );
  moves.sort((a, b) => {
    const count = (m) =>
      [
        [m[0] + 2, m[1] + 1],
        [m[0] + 2, m[1] - 1],
        [m[0] - 2, m[1] + 1],
        [m[0] - 2, m[1] - 1],
        [m[0] + 1, m[1] + 2],
        [m[0] + 1, m[1] - 2],
        [m[0] - 1, m[1] + 2],
        [m[0] - 1, m[1] - 2],
      ].filter(
        ([nx, ny]) =>
          nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && !tempVisited[nx][ny]
      ).length;
    return count(a) - count(b);
  });
  return moves;
}

function autoStep() {
  if (gameOver || !started) return;
  let [x, y] = path[path.length - 1];
  let tempVisited = visited.map((row) => row.slice());
  let moves = warnsdorff(x, y, tempVisited);
  if (moves.length === 0) {
    gameOver = true;
    document.getElementById("msg").textContent =
      path.length === SIZE * SIZE
        ? "恭喜！你完成了騎士巡遊！"
        : "無法繼續，遊戲結束。";
    autoMode = false;
    return;
  }
  let [nx, ny] = moves[0];
  visited[nx][ny] = true;
  path.push([nx, ny]);
  render();
  if (path.length === SIZE * SIZE) {
    document.getElementById("msg").textContent = "恭喜！你完成了騎士巡遊！";
    autoMode = false;
    gameOver = true;
    return;
  }
  if (autoMode) {
    autoTimer = setTimeout(autoStep, 800);
  }
}

function startAuto() {
  if (autoMode) return;
  createBoard();
  // 自動隨機起點
  let i = Math.floor(Math.random() * SIZE);
  let j = Math.floor(Math.random() * SIZE);
  started = true;
  visited[i][j] = true;
  path.push([i, j]);
  render();
  autoMode = true;
  autoStep();
}

document.getElementById("autoBtn").onclick = function () {
  if (autoMode) return;
  startAuto();
};
let SIZE = 6;
let board = [];
let visited = [];
let path = [];
let started = false;
let gameOver = false;
let boardShown = false;

function createBoard(newSize) {
  if (newSize) SIZE = newSize;
  board = [];
  visited = [];
  path = [];
  started = false;
  gameOver = false;
  document.getElementById("msg").textContent = "";
  document.getElementById("title").textContent = `${SIZE}x${SIZE} 騎士巡遊遊戲`;
  for (let i = 0; i < SIZE; i++) {
    board.push([]);
    visited.push([]);
    for (let j = 0; j < SIZE; j++) {
      board[i].push(0);
      visited[i].push(false);
    }
  }
  // 顯示棋盤與按鈕
  document.getElementById("game").style.display = "";
  document.getElementById("resetBtn").style.display = "";
  document.getElementById("undoBtn").style.display = "";
  document.getElementById("autoBtn").style.display = "";
  boardShown = true;
  render();
}

function knightMoves(x, y) {
  return [
    [x + 2, y + 1],
    [x + 2, y - 1],
    [x - 2, y + 1],
    [x - 2, y - 1],
    [x + 1, y + 2],
    [x + 1, y - 2],
    [x - 1, y + 2],
    [x - 1, y - 2],
  ].filter(
    ([nx, ny]) =>
      nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && !visited[nx][ny]
  );
}

function render() {
  let html = "<table>";
  let knightX = null,
    knightY = null;
  if (path.length) {
    [knightX, knightY] = path[path.length - 1];
  }
  for (let i = 0; i < SIZE; i++) {
    html += "<tr>";
    for (let j = 0; j < SIZE; j++) {
      let cls = "";
      let cellContent = "";
      if (visited[i][j]) cls = "visited";
      if (path.length && path[0][0] === i && path[0][1] === j) cls = "start";
      let isNext = !visited[i][j] && started && isNextMove(i, j);
      if (isNext) cls = "next";
      let idx = path.findIndex(([x, y]) => x === i && y === j);
      // 騎士圖示置中且黑白
      if (i === knightX && j === knightY) {
        cellContent = '<span class="knight">&#9816;</span>';
      } else if (isNext) {
        // 預測下一步的 next 數
        let tempVisited = visited.map((row) => row.slice());
        tempVisited[i][j] = true;
        let nextMoves = [
          [i + 2, j + 1],
          [i + 2, j - 1],
          [i - 2, j + 1],
          [i - 2, j - 1],
          [i + 1, j + 2],
          [i + 1, j - 2],
          [i - 1, j + 2],
          [i - 1, j - 2],
        ].filter(
          ([nx, ny]) =>
            nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && !tempVisited[nx][ny]
        );
        cellContent = `<span class='next-count'>${nextMoves.length}</span>`;
      } else if (idx !== -1) {
        cellContent = idx + 1;
      }
      html += `<td class="${cls}" data-x="${i}" data-y="${j}">${cellContent}</td>`;
    }
    html += "</tr>";
  }
  html += "</table>";
  document.getElementById("game").innerHTML = html;
  document.querySelectorAll("td").forEach((td) => {
    td.onclick = onCellClick;
  });
}

function isNextMove(i, j) {
  if (!started || gameOver) return false;
  const [x, y] = path[path.length - 1];
  return knightMoves(x, y).some(([nx, ny]) => nx === i && ny === j);
}

function onCellClick(e) {
  if (gameOver) return;
  const i = parseInt(this.dataset.x);
  const j = parseInt(this.dataset.y);
  if (!started) {
    started = true;
    visited[i][j] = true;
    path.push([i, j]);
    render();
    return;
  }
  if (visited[i][j]) return;
  if (!isNextMove(i, j)) return;
  visited[i][j] = true;
  path.push([i, j]);
  render();
  if (path.length === SIZE * SIZE) {
    document.getElementById("msg").textContent = "恭喜！你完成了騎士巡遊！";
    gameOver = true;
  } else if (knightMoves(i, j).length === 0) {
    document.getElementById("msg").textContent = "無法繼續，遊戲結束。";
    gameOver = true;
  }
}

document.getElementById("resetBtn").onclick = () => {
  autoMode = false;
  if (autoTimer) clearTimeout(autoTimer);
  createBoard();
};
document.querySelectorAll(".sizeBtn").forEach((btn) => {
  btn.onclick = function () {
    createBoard(Number(this.dataset.size));
    document
      .querySelectorAll(".sizeBtn")
      .forEach((b) => b.classList.remove("selected"));
    this.classList.add("selected");
    // 顯示棋盤與按鈕
    document.getElementById("game").style.display = "";
    document.getElementById("resetBtn").style.display = "";
    document.getElementById("undoBtn").style.display = "";
    document.getElementById("autoBtn").style.display = "";
document.getElementById("undoBtn").onclick = function () {
  if (autoMode) return;
  if (path.length === 0 || gameOver) return;
  let [lastX, lastY] = path.pop();
  visited[lastX][lastY] = false;
  gameOver = false;
  document.getElementById("msg").textContent = "";
  started = path.length > 0;
  render();
};
    document.getElementById("rules").style.display = "none";
    document.getElementById("sizeBtns").style.display = "none";
  };
});
