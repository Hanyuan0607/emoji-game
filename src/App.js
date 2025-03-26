import React, { useState, useEffect } from 'react';
import './App.css';

const EMOJIS = ['☠️', '💀', '🥛', '🤡', '🐶', '☂️', '☔️', '🇵🇷', '🃏', '🚾', '🚬', '⛳️', '🎾'];
const BOARD_SIZE = 6;
const GAME_DURATION = 60;

function getRandomEmoji() {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
}

function generateBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => getRandomEmoji())
  );
}

function findMatches(board) {
  const matched = new Set();

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE - 2; col++) {
      const emoji = board[row][col];
      if (
        emoji &&
        emoji === board[row][col + 1] &&
        emoji === board[row][col + 2]
      ) {
        matched.add(`${row}-${col}`);
        matched.add(`${row}-${col + 1}`);
        matched.add(`${row}-${col + 2}`);
      }
    }
  }

  for (let col = 0; col < BOARD_SIZE; col++) {
    for (let row = 0; row < BOARD_SIZE - 2; row++) {
      const emoji = board[row][col];
      if (
        emoji &&
        emoji === board[row + 1][col] &&
        emoji === board[row + 2][col]
      ) {
        matched.add(`${row}-${col}`);
        matched.add(`${row + 1}-${col}`);
        matched.add(`${row + 2}-${col}`);
      }
    }
  }

  return matched;
}

function clearMatches(board, matches) {
  const newBoard = board.map(row => [...row]);
  matches.forEach(pos => {
    const [row, col] = pos.split('-').map(Number);
    newBoard[row][col] = null;
  });
  return newBoard;
}

function dropEmojis(board) {
  const newBoard = board.map(row => [...row]);

  for (let col = 0; col < BOARD_SIZE; col++) {
    let pointer = BOARD_SIZE - 1;
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      if (newBoard[row][col]) {
        newBoard[pointer][col] = newBoard[row][col];
        if (pointer !== row) {
          newBoard[row][col] = null;
        }
        pointer--;
      }
    }
    for (let r = pointer; r >= 0; r--) {
      newBoard[r][col] = getRandomEmoji();
    }
  }

  return newBoard;
}

function getMultiplierFromSpin() {
  const rand = Math.random();
  if (rand < 0.32) return 2;
  if (rand < 0.67) return 5;
  if (rand < 0.97) return 10;
  return 20;
}

function App() {
  const [board, setBoard] = useState([]);
  const [selected, setSelected] = useState([]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(null);
  const [spinning, setSpinning] = useState(true);

  useEffect(() => {
    if (!spinning && multiplier !== null) {
      setBoard(generateBoard());
    }
  }, [spinning, multiplier]);

  useEffect(() => {
    if (spinning) return;

    if (timeLeft === 0) {
      setGameOver(true);
      return;
    }

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, spinning]);

  const handleSelect = (row, col) => {
    if (gameOver || spinning) return;

    const newSelected = [...selected, { row, col }];
    if (newSelected.length === 2) {
      const [{ row: r1, col: c1 }, { row: r2, col: c2 }] = newSelected;
      const isAdjacent =
        (r1 === r2 && Math.abs(c1 - c2) === 1) ||
        (c1 === c2 && Math.abs(r1 - r2) === 1);

      if (isAdjacent) {
        const newBoard = board.map(row => [...row]);
        [newBoard[r1][c1], newBoard[r2][c2]] = [newBoard[r2][c2], newBoard[r1][c1]];
        processBoard(newBoard);
      }

      setSelected([]);
    } else {
      setSelected(newSelected);
    }
  };

  const processBoard = (inputBoard) => {
    let tempBoard = inputBoard;

    const loop = () => {
      const matches = findMatches(tempBoard);
      if (matches.size > 0) {
        setScore(prev => prev + matches.size / 3);
        tempBoard = clearMatches(tempBoard, matches);
        tempBoard = dropEmojis(tempBoard);
        setBoard([...tempBoard]);
        setTimeout(loop, 300);
      } else {
        setBoard([...tempBoard]);
      }
    };

    loop();
  };

  const resetGame = () => {
    setScore(0);
    setGameOver(false);
    setTimeLeft(GAME_DURATION);
    setMultiplier(null);
    setSpinning(true);
  };

  const startGame = () => {
    const result = getMultiplierFromSpin();
    setMultiplier(result);
    setSpinning(false);
  };

  const isSelected = (row, col) => {
    return selected.some(cell => cell.row === row && cell.col === col);
  };

  return (
    <div className="App" style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>🥛💀???</h1>

      {spinning ? (
        <>
          <div style={{ fontSize: '18px', margin: '20px' }}>
            🎰 命运齿轮转动中…… 🤡
          </div>
          <button
            onClick={startGame}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#4f46e5',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            🔆
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>
            每消掉1组消除抵 {multiplier} 口酒！
          </div>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>
            剩余时间：{timeLeft} 秒
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 50px)`,
            gap: '10px',
            justifyContent: 'center',
            marginTop: '10px'
          }}>
            {board.map((row, rowIndex) =>
              row.map((emoji, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleSelect(rowIndex, colIndex)}
                  disabled={gameOver || emoji === null}
                  style={{
                    fontSize: '24px',
                    width: '50px',
                    height: '50px',
                    borderRadius: '10px',
                    backgroundColor: isSelected(rowIndex, colIndex) ? '#facc15' : '#fff',
                    border: '1px solid #ccc',
                    boxShadow: '1px 1px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  {emoji}
                </button>
              ))
            )}
          </div>

          <button
            onClick={resetGame}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#4f46e5',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Restart 🏁
          </button>

          {gameOver && (
            <>
              <div style={{ marginTop: '20px', fontSize: '20px', color: '#dc2626' }}>
                Time is 🆙
              </div>
              <div style={{ marginTop: '10px', fontSize: '18px', color: '#16a34a' }}>
                。。。恭喜你失去了 {score * multiplier} 口酒！🍺
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;