/**
 * Pure Game Rules and AI logic for NEON XO
 */

export type PlayerSymbol = 'X' | 'O';
export type BoardState = (PlayerSymbol | '')[];

export interface WinResult {
  winner: PlayerSymbol;
  line: number[];
}

/**
 * Generate all winning lines for a grid of size x size with a target streak length.
 * For 3x3: streak 3
 * For 4x4: streak 4
 * For 5x5: streak 4
 */
export function generateWinningLines(size: number, winStreak: number): number[][] {
  const lines: number[][] = [];

  const getIdx = (r: number, c: number) => r * size + c;

  // Horizontal lines
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - winStreak; c++) {
      const line: number[] = [];
      for (let k = 0; k < winStreak; k++) {
        line.push(getIdx(r, c + k));
      }
      lines.push(line);
    }
  }

  // Vertical lines
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - winStreak; r++) {
      const line: number[] = [];
      for (let k = 0; k < winStreak; k++) {
        line.push(getIdx(r + k, c));
      }
      lines.push(line);
    }
  }

  // Diagonal (top-left to bottom-right \)
  for (let r = 0; r <= size - winStreak; r++) {
    for (let c = 0; c <= size - winStreak; c++) {
      const line: number[] = [];
      for (let k = 0; k < winStreak; k++) {
        line.push(getIdx(r + k, c + k));
      }
      lines.push(line);
    }
  }

  // Anti-diagonal (top-right to bottom-left /)
  for (let r = 0; r <= size - winStreak; r++) {
    for (let c = winStreak - 1; c < size; c++) {
      const line: number[] = [];
      for (let k = 0; k < winStreak; k++) {
        line.push(getIdx(r + k, c - k));
      }
      lines.push(line);
    }
  }

  return lines;
}

/**
 * Check if there is a winner on the board
 */
export function checkWinner(
  board: BoardState,
  winningLines: number[][]
): WinResult | null {
  for (let i = 0; i < winningLines.length; i++) {
    const line = winningLines[i];
    const first = board[line[0]];
    if (first !== '' && line.every(idx => board[idx] === first)) {
      return { winner: first as PlayerSymbol, line };
    }
  }
  return null;
}

/**
 * Check if the board is completely full
 */
export function isBoardFull(board: BoardState): boolean {
  return board.every(cell => cell !== '');
}

/**
 * Get available move indices
 */
export function getAvailableMoves(board: BoardState): number[] {
  const moves: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === '') {
      moves.push(i);
    }
  }
  return moves;
}

/**
 * Evaluate heuristic score for non-3x3 boards or depth-limited search
 */
function evaluateHeuristic(
  board: BoardState,
  winningLines: number[][],
  aiSymbol: PlayerSymbol,
  oppSymbol: PlayerSymbol
): number {
  let score = 0;
  for (const line of winningLines) {
    let aiCount = 0;
    let oppCount = 0;
    for (const idx of line) {
      if (board[idx] === aiSymbol) aiCount++;
      else if (board[idx] === oppSymbol) oppCount++;
    }

    if (aiCount > 0 && oppCount > 0) {
      continue; // Blocked line
    }
    if (aiCount > 0) {
      if (aiCount === line.length) score += 100000;
      else if (aiCount === line.length - 1) score += 500;
      else if (aiCount === line.length - 2) score += 30;
      else score += 2;
    } else if (oppCount > 0) {
      if (oppCount === line.length) score -= 100000;
      else if (oppCount === line.length - 1) score -= 600;
      else if (oppCount === line.length - 2) score -= 40;
      else score -= 2;
    }
  }
  return score;
}

/**
 * Minimax with Alpha-Beta Pruning for 3x3 (perfect play)
 */
function minimax3x3(
  board: BoardState,
  winningLines: number[][],
  depth: number,
  isMaximizing: boolean,
  aiSymbol: PlayerSymbol,
  oppSymbol: PlayerSymbol,
  alpha: number,
  beta: number
): number {
  const win = checkWinner(board, winningLines);
  if (win) {
    return win.winner === aiSymbol ? 10 - depth : depth - 10;
  }
  if (isBoardFull(board)) {
    return 0;
  }

  const moves = getAvailableMoves(board);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      board[move] = aiSymbol;
      const evalScore = minimax3x3(board, winningLines, depth + 1, false, aiSymbol, oppSymbol, alpha, beta);
      board[move] = '';
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      board[move] = oppSymbol;
      const evalScore = minimax3x3(board, winningLines, depth + 1, true, aiSymbol, oppSymbol, alpha, beta);
      board[move] = '';
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Depth-limited Minimax with Alpha-Beta Pruning for larger boards (4x4, 5x5)
 */
function minimaxDepthLimited(
  board: BoardState,
  winningLines: number[][],
  depth: number,
  maxDepth: number,
  isMaximizing: boolean,
  aiSymbol: PlayerSymbol,
  oppSymbol: PlayerSymbol,
  alpha: number,
  beta: number
): number {
  const win = checkWinner(board, winningLines);
  if (win) {
    return win.winner === aiSymbol ? 100000 - depth : depth - 100000;
  }
  if (isBoardFull(board) || depth >= maxDepth) {
    return evaluateHeuristic(board, winningLines, aiSymbol, oppSymbol);
  }

  // Filter moves to nearby occupied cells for fast branch-pruning on 4x4 / 5x5
  const moves = getAvailableMoves(board);
  // Sort moves by heuristic potential
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      board[move] = aiSymbol;
      const evalScore = minimaxDepthLimited(board, winningLines, depth + 1, maxDepth, false, aiSymbol, oppSymbol, alpha, beta);
      board[move] = '';
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      board[move] = oppSymbol;
      const evalScore = minimaxDepthLimited(board, winningLines, depth + 1, maxDepth, true, aiSymbol, oppSymbol, alpha, beta);
      board[move] = '';
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Choose the best AI move
 */
export function getAIMove(
  board: BoardState,
  size: number,
  winStreak: number,
  aiSymbol: PlayerSymbol,
  difficulty: 'easy' | 'medium' | 'hard'
): number {
  const available = getAvailableMoves(board);
  if (available.length === 0) return -1;
  if (available.length === 1) return available[0];

  const oppSymbol: PlayerSymbol = aiSymbol === 'X' ? 'O' : 'X';
  const winningLines = generateWinningLines(size, winStreak);

  // 1. Easy: completely random
  if (difficulty === 'easy') {
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  // Check immediate win for current player
  for (const move of available) {
    board[move] = aiSymbol;
    if (checkWinner(board, winningLines)) {
      board[move] = '';
      return move;
    }
    board[move] = '';
  }

  // Check immediate block of opponent's win
  for (const move of available) {
    board[move] = oppSymbol;
    if (checkWinner(board, winningLines)) {
      board[move] = '';
      return move;
    }
    board[move] = '';
  }

  // 2. Medium: blocks/wins, otherwise random or preferred center
  if (difficulty === 'medium') {
    // 50% tactical heuristic, 50% random
    if (Math.random() > 0.4) {
      // Pick move with best immediate positional score
      let bestScore = -Infinity;
      let bestMove = available[0];
      for (const move of available) {
        board[move] = aiSymbol;
        const score = evaluateHeuristic(board, winningLines, aiSymbol, oppSymbol);
        board[move] = '';
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      return bestMove;
    }
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  // 3. Hard:
  // For 3x3: Full Minimax (unbeatable)
  if (size === 3) {
    // If center is available on first/second turn, take it or corner
    if (board[4] === '') {
      // Taking center is always optimal
      const occupied = board.filter(c => c !== '').length;
      if (occupied <= 1) return 4;
    }

    let bestScore = -Infinity;
    let bestMoves: number[] = [];

    for (const move of available) {
      board[move] = aiSymbol;
      const score = minimax3x3(board, winningLines, 0, false, aiSymbol, oppSymbol, -Infinity, Infinity);
      board[move] = '';

      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  // For 4x4 and 5x5: Depth-limited minimax with candidate move filtering for speed
  const maxDepth = size === 4 ? 2 : 2;

  // Prioritize moves adjacent to existing marks or center
  let candidateMoves = available;
  const occupiedCount = board.length - available.length;
  if (occupiedCount === 0) {
    // First move: take near center
    const center = Math.floor(board.length / 2);
    return center;
  }

  let bestVal = -Infinity;
  let bestMove = candidateMoves[0];

  for (const move of candidateMoves) {
    board[move] = aiSymbol;
    const moveVal = minimaxDepthLimited(
      board,
      winningLines,
      0,
      maxDepth,
      false,
      aiSymbol,
      oppSymbol,
      -Infinity,
      Infinity
    );
    board[move] = '';

    if (moveVal > bestVal) {
      bestVal = moveVal;
      bestMove = move;
    }
  }

  return bestMove;
}

/**
 * Suggest a hint move for the current player
 */
export function getHintMove(
  board: BoardState,
  size: number,
  winStreak: number,
  player: PlayerSymbol
): number {
  return getAIMove(board, size, winStreak, player, 'hard');
}
