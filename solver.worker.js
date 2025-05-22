
self.onmessage = function(e) {
  const { x, y, numVisited, visited, size } = e.data;

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
        nx >= 0 && nx < size && ny >= 0 && ny < size && !currentVisitedState[nx][ny]
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
            nnx >= 0 && nnx < size && nny >= 0 && nny < size && !boardState[nnx][nny]
        ).length;
      };
      let onwardMovesA = countOnward(a[0], a[1], currentVisitedState);
      let onwardMovesB = countOnward(b[0], b[1], currentVisitedState);
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

  function checkSolvable(currentX, currentY, numVisited, visitedBoardState) {
    if (numVisited === size * size) {
      return { solvable: true, pathFromHere: [[currentX, currentY]] };
    }
    let orderedMoves = getRankedPotentialMoves(currentX, currentY, visitedBoardState);
    if (orderedMoves.length === 0 && numVisited < size * size) {
      return { solvable: false };
    }
    for (let move of orderedMoves) {
      let [nextX, nextY] = move;
      visitedBoardState[nextX][nextY] = true;
      let result = checkSolvable(nextX, nextY, numVisited + 1, visitedBoardState);
      if (result.solvable) {
        visitedBoardState[nextX][nextY] = false;
        result.pathFromHere.unshift([currentX, currentY]);
        return result;
      }
      visitedBoardState[nextX][nextY] = false;
    }
    return { solvable: false };
  }

  // Deep copy visited for safety
  let visitedCopy = visited.map(row => row.slice());
  let result = checkSolvable(x, y, numVisited, visitedCopy);
  self.postMessage(result);
};
