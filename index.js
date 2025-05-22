let autoMode = false;
let autoTimer = null;
let activeAutoplayPath = null; // Stores the path for autoStep to follow
let autoSpeedLevel = 1; // 自動模式速度級別: 1=正常, 2=兩倍速, 3=三倍速

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
    // Tie-breaking: if counts are equal, prefer smaller x, then smaller y.
    // This makes the choice deterministic if counts are the same.
    const countA = count(a);
    const countB = count(b);
    if (countA !== countB) {
      return countA - countB;
    }
    if (a[0] !== b[0]) {
      return a[0] - b[0];
    }
    return a[1] - b[1];
  });
  return moves;
}

// Helper function to get ranked potential moves for the solver
function getRankedPotentialMoves(x, y, currentVisitedState) {
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
      nx >= 0 &&
      nx < SIZE &&
      ny >= 0 &&
      ny < SIZE &&
      !currentVisitedState[nx][ny]
  );

  moves.sort((a, b) => {
    const countOnward = (fromX, fromY, boardState) => {
      return [
        [fromX + 2, fromY + 1],
        [fromX + 2, fromY - 1],
        [fromX - 2, fromY + 1],
        [fromX - 2, fromY - 1],
        [fromX + 1, fromY + 2],
        [fromX + 1, fromY - 2],
        [fromX - 1, fromY + 2],
        [fromX - 1, fromY - 2],
      ].filter(
        ([nnx, nny]) =>
          nnx >= 0 &&
          nnx < SIZE &&
          nny >= 0 &&
          nny < SIZE &&
          !boardState[nnx][nny]
      ).length;
    };
    let onwardMovesA = countOnward(a[0], a[1], currentVisitedState);
    let onwardMovesB = countOnward(b[0], b[1], currentVisitedState);
    // Tie-breaking: if counts are equal, prefer smaller x, then smaller y.
    if (onwardMovesA !== onwardMovesB) {
      return onwardMovesA - onwardMovesB;
    }
    if (a[0] !== b[0]) {
      return a[0] - b[0];
    }
    return a[1] - b[1];
  });
  return moves;
}

// Recursive function to check if a solution exists from the current state
// Now returns { solvable: boolean, pathFromHere?: Array<[number, number]> }
function checkSolvable(currentX, currentY, numVisited, visitedBoardState) {
  if (numVisited === SIZE * SIZE) {
    // All squares visited, currentX, currentY is the last square.
    return { solvable: true, pathFromHere: [[currentX, currentY]] };
  }

  let orderedMoves = getRankedPotentialMoves(
    currentX,
    currentY,
    visitedBoardState
  );

  // If there are no moves from currentX, currentY, and we haven't visited all squares, it's a dead end.
  if (orderedMoves.length === 0 && numVisited < SIZE * SIZE) {
      return { solvable: false };
  }

  for (let move of orderedMoves) {
    let [nextX, nextY] = move;
    visitedBoardState[nextX][nextY] = true; // Try this move
    let result = checkSolvable(nextX, nextY, numVisited + 1, visitedBoardState);
    if (result.solvable) {
      visitedBoardState[nextX][nextY] = false; // Backtrack for current exploration level
      result.pathFromHere.unshift([currentX, currentY]); // Prepend currentX, currentY to the path found
      return result; // Solution found, propagate path up
    }
    visitedBoardState[nextX][nextY] = false; // Backtrack: this move didn't lead to a solution
  }
  return { solvable: false }; // No move from currentX, currentY led to a solution
}

function autoStep() {
  if (!autoMode || !started) {
    if (autoMode) { // Ensure cleanup if autoMode was true but started is false or similar edge case
      autoMode = false;
      if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = null;
      }
      activeAutoplayPath = null;
    }
    return;
  }

  if (path.length === 0) {
    console.warn("autoStep called with empty path when started. Stopping.");
    autoMode = false;
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = null;
    activeAutoplayPath = null;
    return;
  }

  let [currentX, currentY] = path[path.length - 1];
  let nextMoveTarget = null;

  if (activeAutoplayPath && activeAutoplayPath.length > 0) {
    nextMoveTarget = activeAutoplayPath.shift(); // Get and remove next move from predicted path
    if (activeAutoplayPath.length === 0) { // If path just became empty
        // activeAutoplayPath = null; // No, let it be an empty array to signify it was used up
    }
  } else {
    // Predicted path is done or wasn't provided. Use Warnsdorff.
    if (activeAutoplayPath && activeAutoplayPath.length === 0) { // Path was used up
      document.getElementById("msg").textContent = "預測路徑已完成，嘗試使用 Warnsdorff 繼續...";
      activeAutoplayPath = null; // Now clear it as we are switching to Warnsdorff
    }

    let tempVisitedForWarnsdorff = visited.map(row => row.slice());
    let warnsdorffMoves = warnsdorff(currentX, currentY, tempVisitedForWarnsdorff);

    if (warnsdorffMoves.length === 0) {      gameOver = true;
      autoMode = false;
      if (autoTimer) clearTimeout(autoTimer);
      autoTimer = null;
      activeAutoplayPath = null;
      
      // 重置按鈕樣式
      const autoBtn = document.getElementById("autoBtn");
      autoBtn.classList.remove(`speed-${autoSpeedLevel}`);
      autoBtn.textContent = "自動模式";
      autoSpeedLevel = 1;

      if (path.length === SIZE * SIZE) {
        document.getElementById("msg").textContent = "恭喜！自動模式完成了騎士巡遊！";
      } else {
        document.getElementById("msg").textContent = "自動模式：從目前位置已無下一步可走 (Warnsdorff)。";
        console.log("--- Debug: autoStep FAILED (Warnsdorff) ---");
        console.log("Current path:", JSON.parse(JSON.stringify(path)));
        console.log("Board state (visited):", JSON.parse(JSON.stringify(visited)));
        console.log("Last position:", currentX, currentY);
        console.log("Calculated moves from warnsdorff (empty):", JSON.parse(JSON.stringify(warnsdorffMoves)));
        console.log("--------------------------------------");
      }
      render();
      return;
    }
    nextMoveTarget = warnsdorffMoves[0];
  }
  if (!nextMoveTarget) {
    console.error("autoStep: Critical error - no next move determined.");
    document.getElementById("msg").textContent = "自動模式嚴重錯誤。";
    gameOver = true;
    autoMode = false;
    activeAutoplayPath = null;
    
    // 重置按鈕樣式
    const autoBtn = document.getElementById("autoBtn");
    autoBtn.classList.remove(`speed-${autoSpeedLevel}`);
    autoBtn.textContent = "自動模式";
    autoSpeedLevel = 1;
    
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = null;
    render();
    return;
  }

  let [nx, ny] = nextMoveTarget;

  if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE || visited[nx][ny]) {
    console.error(`autoStep: Attempting to move to an invalid or already visited square (${nx},${ny}).`);
    document.getElementById("msg").textContent = "自動模式錯誤：目標無效或已訪問。";
    console.log("--- Debug: autoStep INVALID TARGET ---");
    console.log("Path:", JSON.parse(JSON.stringify(path)));
    console.log("Visited:", JSON.parse(JSON.stringify(visited)));
    console.log("Attempted move:", nx, ny);
    console.log("Source of move:", (activeAutoplayPath !== null) ? "Predicted Path (or exhausted)" : "Warnsdorff");
    console.log("Remaining activeAutoplayPath content:", activeAutoplayPath ? JSON.parse(JSON.stringify(activeAutoplayPath)) : "null");
    console.log("-----------------------------------");    gameOver = true;
    autoMode = false;
    activeAutoplayPath = null;
    
    // 重置按鈕樣式
    const autoBtn = document.getElementById("autoBtn");
    autoBtn.classList.remove(`speed-${autoSpeedLevel}`);
    autoBtn.textContent = "自動模式";
    autoSpeedLevel = 1;
    
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = null;
    render();
    return;
  }

  visited[nx][ny] = true;
  path.push([nx, ny]);
  render();
  if (path.length === SIZE * SIZE) {
    document.getElementById("msg").textContent = "恭喜！自動模式完成了騎士巡遊！";
    gameOver = true;
    autoMode = false;
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = null;
    activeAutoplayPath = null;
    
    // 重置按鈕樣式
    const autoBtn = document.getElementById("autoBtn");
    autoBtn.classList.remove(`speed-${autoSpeedLevel}`);
    autoBtn.textContent = "自動模式";
    autoSpeedLevel = 1;
    return;
  }

  if (autoMode) {
    autoTimer = setTimeout(autoStep, 800 / autoSpeedLevel);
  } else {
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = null;
    activeAutoplayPath = null; 
  }
}

// Function to initiate a new auto play from a random starting point
function startNewRandomAutoPlay() {
  createBoard(SIZE); // This will set activeAutoplayPath = null via createBoard

  let i = Math.floor(Math.random() * SIZE);
  let j = Math.floor(Math.random() * SIZE);

  started = true;
  visited[i][j] = true;
  path.push([i, j]);
  render();  autoMode = true;
  autoSpeedLevel = 1; // 確保從正常速度開始
  
  // 更新按鈕樣式
  const autoBtn = document.getElementById("autoBtn");
  autoBtn.classList.add(`speed-${autoSpeedLevel}`);
  autoBtn.textContent = "自動模式 (正常速)";
  
  document.getElementById("msg").textContent = "自動模式啟動（隨機起點）...";
  autoStep(); // Will use Warnsdorff as activeAutoplayPath is null
}

document.getElementById("autoBtn").onclick = function () {
  const autoBtn = document.getElementById("autoBtn");
  
  if (autoMode) {
    // If auto mode is already running, toggle speed or stop it
    if (autoSpeedLevel < 3) {
      // Increase speed level
      autoSpeedLevel++;
      // 更新當前速度顯示消息
      let speedText = autoSpeedLevel === 2 ? "兩倍速" : "三倍速";
      document.getElementById("msg").textContent = `自動模式: ${speedText}`;
      
      // 更新按鈕樣式
      autoBtn.classList.remove(`speed-${autoSpeedLevel-1}`);
      autoBtn.classList.add(`speed-${autoSpeedLevel}`);
      autoBtn.textContent = `自動模式 (${speedText})`;
      
      // 如果有運行中的定時器，重設以應用新速度
      if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = setTimeout(autoStep, 800 / autoSpeedLevel);
      }
      return;
    } else {
      // At highest speed level, next click stops auto mode
      autoMode = false;
      if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = null;
      }
      // 恢復按鈕原始狀態
      autoBtn.classList.remove(`speed-${autoSpeedLevel}`);
      autoBtn.textContent = "自動模式";
      
      autoSpeedLevel = 1; // 重置速度級別為正常
      activeAutoplayPath = null; // Clear path on manual stop
      document.getElementById("msg").textContent = "自動模式已手動停止。玩家可以繼續遊戲。";
      render();
      return;
    }
  }

  if (path.length > 0) {
    // Game is in progress
    let [currentX, currentY] = path[path.length - 1];
    let visitedStateForSolver = visited.map((row) => row.slice());
    let currentPathLength = path.length;

    let wasGameOver = gameOver;
    if (gameOver) gameOver = false; 

    document.getElementById("msg").textContent = "正在檢查是否有解...";
    activeAutoplayPath = null; // Clear any previous path

    setTimeout(() => {
      let solveResult = checkSolvable(
          currentX,
          currentY,
          currentPathLength,
          visitedStateForSolver
        );

      if (solveResult.solvable && solveResult.pathFromHere) {
        console.clear(); 
        console.log("--- Debug: checkSolvable ---");
        console.log("Current game path before autoStep:", JSON.parse(JSON.stringify(path)));
        console.log("checkSolvable predicted continuation (starts with current pos):", JSON.parse(JSON.stringify(solveResult.pathFromHere)));
        
        activeAutoplayPath = solveResult.pathFromHere.slice(1); // Path of moves TO MAKE
        console.log("Path to be followed by autoStep (activeAutoplayPath):", JSON.parse(JSON.stringify(activeAutoplayPath)));
        
        let fullPredictedPath = path.slice(0, path.length -1).concat(solveResult.pathFromHere);
        console.log("Full predicted path by checkSolvable:", JSON.parse(JSON.stringify(fullPredictedPath)));
        console.log("-----------------------------");        gameOver = false; 
        autoMode = true;
        autoSpeedLevel = 1; // 每次開始時重置為正常速度
        started = true;
        
        // 更新按鈕樣式
        const autoBtn = document.getElementById("autoBtn");
        autoBtn.classList.add(`speed-${autoSpeedLevel}`);
        autoBtn.textContent = "自動模式 (正常速)";
        
        document.getElementById("msg").textContent = "從目前位置繼續自動遊玩（使用預測路徑）...";
        autoStep();
      } else {
        gameOver = wasGameOver; 
        document.getElementById("msg").textContent = "自動模式：從目前位置無法完成騎士巡遊。";
        autoMode = false; 
        activeAutoplayPath = null; // Ensure cleared
        render();
      }
    }, 10);
  } else {
    // New game, no moves made yet
    console.clear(); 
    console.log("--- Debug: startNewRandomAutoPlay (via button) ---");
    console.log("No existing path, starting new random auto play.");
    console.log("checkSolvable will not be called beforehand in this case.");
    console.log("------------------------------------");
    activeAutoplayPath = null; // Ensure cleared
    startNewRandomAutoPlay();
  }
};

let SIZE = 6;
let board = [];
let visited = [];
let path = [];
let started = false;
let gameOver = false;
let boardShown = false;

function createBoard(newSize) {
  if (autoMode) {
    autoMode = false;
    if (autoTimer) {
      clearTimeout(autoTimer);
      autoTimer = null;
    }
    
    // 重置按鈕樣式
    const autoBtn = document.getElementById("autoBtn");
    autoBtn.classList.remove(`speed-${autoSpeedLevel}`);
    autoBtn.textContent = "自動模式";
  }
  autoSpeedLevel = 1; // 重置為正常速度
  activeAutoplayPath = null; // Clear any active path on board reset

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
  // autoMode and autoTimer are already handled by createBoard
  // activeAutoplayPath will be cleared by createBoard
  createBoard();
};
document.querySelectorAll(".sizeBtn").forEach((btn) => {
  btn.onclick = function () {
    // createBoard will handle stopping autoMode, clearing timer and activeAutoplayPath.
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
      if (path.length === 0) return; // 移除了 gameOver 的檢查
      let [lastX, lastY] = path.pop();
      visited[lastX][lastY] = false;
      gameOver = false; // 如果是 gameOver 狀態，撤銷後應該不再是 gameOver
      document.getElementById("msg").textContent = "";
      started = path.length > 0;
      render();
    };
    document.getElementById("rules").style.display = "none";
    document.getElementById("sizeBtns").style.display = "none";
  };
});
