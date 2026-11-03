import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateWinningLines,
  checkWinner,
  isBoardFull,
  getAIMove,
  getHintMove,
  BoardState
} from './rules';

test('generateWinningLines produces correct line counts', () => {
  // 3x3 with streak 3: 3 rows + 3 cols + 2 diagonals = 8
  const lines3x3 = generateWinningLines(3, 3);
  assert.equal(lines3x3.length, 8);

  // 4x4 with streak 4: 4 rows + 4 cols + 2 diagonals = 10
  const lines4x4 = generateWinningLines(4, 4);
  assert.equal(lines4x4.length, 10);

  // 5x5 with streak 4:
  // rows: 5 rows * (5 - 4 + 1) = 10
  // cols: 5 cols * (5 - 4 + 1) = 10
  // diag: 2 * 2 * 2 = 8
  // total = 28 lines
  const lines5x5 = generateWinningLines(5, 4);
  assert.equal(lines5x5.length, 28);
});

test('checkWinner detects row, column, and diagonal wins on 3x3', () => {
  const lines = generateWinningLines(3, 3);

  // Row win
  const rowBoard: BoardState = ['X', 'X', 'X', '', '', '', '', '', ''];
  const rowWin = checkWinner(rowBoard, lines);
  assert.ok(rowWin);
  assert.equal(rowWin?.winner, 'X');
  assert.deepEqual(rowWin?.line, [0, 1, 2]);

  // Col win
  const colBoard: BoardState = ['O', '', '', 'O', '', '', 'O', '', ''];
  const colWin = checkWinner(colBoard, lines);
  assert.ok(colWin);
  assert.equal(colWin?.winner, 'O');
  assert.deepEqual(colWin?.line, [0, 3, 6]);

  // Diagonal win
  const diagBoard: BoardState = ['X', '', '', '', 'X', '', '', '', 'X'];
  const diagWin = checkWinner(diagBoard, lines);
  assert.ok(diagWin);
  assert.equal(diagWin?.winner, 'X');
  assert.deepEqual(diagWin?.line, [0, 4, 8]);
});

test('checkWinner detects 4-in-a-row on 5x5 board', () => {
  const lines = generateWinningLines(5, 4);
  const board: BoardState = Array(25).fill('');
  // Fill indices 6, 7, 8, 9 with 'O' (row 1, columns 1 to 4)
  board[6] = 'O';
  board[7] = 'O';
  board[8] = 'O';
  board[9] = 'O';

  const win = checkWinner(board, lines);
  assert.ok(win);
  assert.equal(win?.winner, 'O');
  assert.deepEqual(win?.line, [6, 7, 8, 9]);
});

test('isBoardFull correctly identifies full and incomplete boards', () => {
  const incomplete: BoardState = ['X', 'O', 'X', 'O', '', 'X', 'O', 'X', 'O'];
  assert.equal(isBoardFull(incomplete), false);

  const full: BoardState = ['X', 'O', 'X', 'O', 'X', 'X', 'O', 'X', 'O'];
  assert.equal(isBoardFull(full), true);
});

test('Medium and Hard AI block immediate opponent win on 3x3', () => {
  // O is about to win at index 2
  const board: BoardState = ['O', 'O', '', 'X', 'X', '', '', '', ''];
  // AI is X, opponent is O
  const moveHard = getAIMove(board, 3, 3, 'X', 'hard');
  // AI should prioritize its own win or block O.
  // X has [3, 4, (5)], O has [0, 1, (2)]. Both are immediate wins!
  // If X moves first, X takes 5 to win immediately!
  assert.equal(moveHard, 5);

  // Now test pure block: O has [0, 1, (2)], X has no winning move
  const blockBoard: BoardState = ['O', 'O', '', '', 'X', '', '', '', ''];
  const moveBlock = getAIMove(blockBoard, 3, 3, 'X', 'hard');
  assert.equal(moveBlock, 2);

  const moveMedium = getAIMove(blockBoard, 3, 3, 'X', 'medium');
  assert.equal(moveMedium, 2);
});

test('getHintMove returns a valid legal move index', () => {
  const board: BoardState = ['X', 'O', 'X', '', 'O', '', '', '', ''];
  const hint = getHintMove(board, 3, 3, 'X');
  assert.ok(hint >= 0 && hint < 9);
  assert.equal(board[hint], '');
});
