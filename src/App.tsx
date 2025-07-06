import React, { useRef, useEffect, useState } from "react";
import "./App.css";

const ASPECT_RATIO = 4 / 3;
const BASE_WIDTH = 480;
const BASE_HEIGHT = 360;
const PADDLE_WIDTH_RATIO = 80 / BASE_WIDTH;
const PADDLE_HEIGHT_RATIO = 12 / BASE_HEIGHT;
const BALL_RADIUS_RATIO = 10 / BASE_WIDTH;
const BALL_SPEED_RATIO = 4 / BASE_WIDTH;

function getRandomAngle() {
  // Between 30 and 150 degrees, in radians
  const deg = 30 + Math.random() * 120;
  return (deg * Math.PI) / 180;
}

const App: React.FC = () => {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('bounce_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const paddleXRef = useRef(BASE_WIDTH / 2 - 80 / 2);
  const [paddleX, setPaddleX] = useState(BASE_WIDTH / 2 - 80 / 2);
  useEffect(() => { paddleXRef.current = paddleX; }, [paddleX]);

  const [ball, setBall] = useState({
    x: BASE_WIDTH / 2,
    y: BASE_HEIGHT / 2,
    dx: BALL_SPEED_RATIO * Math.cos(getRandomAngle()),
    dy: -BALL_SPEED_RATIO * Math.sin(getRandomAngle()),
  });
  const ballRef = useRef(ball);
  useEffect(() => { ballRef.current = ball; }, [ball]);

  const [gameSize, setGameSize] = useState({ width: BASE_WIDTH, height: BASE_HEIGHT });

  // Responsive observer for svg-wrapper
  useEffect(() => {
    const ref = containerRef.current;
    if (!ref) return;
    const resize = () => {
      let width = ref.clientWidth;
      let height = width / ASPECT_RATIO;
      if (height > ref.clientHeight) {
        height = ref.clientHeight;
        width = height * ASPECT_RATIO;
      }
      setGameSize({ width, height });
    };
    resize();
    const observer = new (window as any).ResizeObserver(resize);
    observer.observe(ref);
    window.addEventListener('resize', resize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Calculate paddle/ball sizes based on current gameSize
  const PADDLE_WIDTH = gameSize.width * PADDLE_WIDTH_RATIO;
  const PADDLE_HEIGHT = gameSize.height * PADDLE_HEIGHT_RATIO;
  const BALL_RADIUS = gameSize.width * BALL_RADIUS_RATIO;
  const BALL_SPEED = gameSize.width * BALL_SPEED_RATIO;

  // Reset paddle and ball when gameSize changes
  useEffect(() => {
    setPaddleX(gameSize.width / 2 - PADDLE_WIDTH / 2);
    setBall({
      x: gameSize.width / 2,
      y: gameSize.height / 2,
      dx: BALL_SPEED * Math.cos(getRandomAngle()),
      dy: -BALL_SPEED * Math.sin(getRandomAngle()),
    });
  }, [gameSize.width, gameSize.height]);

  // Paddle movement with keyboard (update for dynamic width)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.key === "ArrowLeft") {
        setPaddleX((x) => Math.max(0, x - 0.07 * gameSize.width));
      } else if (e.key === "ArrowRight") {
        setPaddleX((x) => Math.min(gameSize.width - PADDLE_WIDTH, x + 0.07 * gameSize.width));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameOver, gameSize.width, PADDLE_WIDTH]);

  // Paddle movement with mouse (update for dynamic width)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gameOver || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let mouseX = e.clientX - rect.left;
      mouseX = Math.max(0, Math.min(mouseX, gameSize.width));
      setPaddleX(
        Math.max(0, Math.min(mouseX - PADDLE_WIDTH / 2, gameSize.width - PADDLE_WIDTH))
      );
    };
    const ref = containerRef.current;
    if (ref) ref.addEventListener("mousemove", handleMouseMove);
    return () => {
      if (ref) ref.removeEventListener("mousemove", handleMouseMove);
    };
  }, [gameOver, gameSize.width, PADDLE_WIDTH]);

  // Game loop (update for dynamic width/height)
  useEffect(() => {
    if (gameOver) return;
    const PADDLE_Y = gameSize.height - 30 / BASE_HEIGHT * gameSize.height - PADDLE_HEIGHT;
    const animate = () => {
      setBall((prev) => {
        let { x, y, dx, dy } = prev;
        let newScore = score;
        // Move ball
        x += dx;
        y += dy;
        // Wall collisions
        if (x - BALL_RADIUS < 0) {
          x = BALL_RADIUS;
          dx = -dx;
        } else if (x + BALL_RADIUS > gameSize.width) {
          x = gameSize.width - BALL_RADIUS;
          dx = -dx;
        }
        if (y - BALL_RADIUS < 0) {
          y = BALL_RADIUS;
          dy = -dy;
        }
        // Paddle collision
        if (
          y + BALL_RADIUS >= PADDLE_Y &&
          y + BALL_RADIUS <= PADDLE_Y + PADDLE_HEIGHT &&
          x >= paddleXRef.current &&
          x <= paddleXRef.current + PADDLE_WIDTH &&
          dy > 0
        ) {
          y = PADDLE_Y - BALL_RADIUS;
          dy = -dy;
          newScore = score + 1;
          setScore(newScore);
          // Update high score if needed
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('bounce_highscore', newScore.toString());
          }
        }
        // Game over
        if (y - BALL_RADIUS > gameSize.height) {
          setGameOver(true);
          return prev;
        }
        return { x, y, dx, dy };
      });
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
    // eslint-disable-next-line
  }, [gameOver, score, highScore, gameSize, PADDLE_HEIGHT, PADDLE_WIDTH]);

  const handleRestart = () => {
    setScore(0);
    setGameOver(false);
    setPaddleX(gameSize.width / 2 - PADDLE_WIDTH / 2);
    setBall({
      x: gameSize.width / 2,
      y: gameSize.height / 2,
      dx: BALL_SPEED * Math.cos(getRandomAngle()),
      dy: -BALL_SPEED * Math.sin(getRandomAngle()),
    });
  };

  const PADDLE_Y = gameSize.height - 30 / BASE_HEIGHT * gameSize.height - PADDLE_HEIGHT;

  const requestRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <div className="game-bg">
      <div className="game-panel">
        {showWelcome && (
          <div className="welcome-overlay">
            <div className="welcome-form">
              <h1>Welcome to Bounce Game! 🏓</h1>
              <p>Test your reflexes. Move the paddle with your mouse or arrow keys. Try to beat the high score!</p>
              <button onClick={() => setShowWelcome(false)}>Start Game</button>
            </div>
          </div>
        )}
        {!showWelcome && (
          <header className="game-header">
            <span className="game-logo" role="img" aria-label="bounce">🏓</span>
            <h1>Bounce Game</h1>
          </header>
        )}
        <main className="game-main">
          <div className="score-badge">
            <span className="score-label">Score</span>
            <span className="score-value">{score}</span>
            <span className="score-label" style={{ marginLeft: 16, color: '#ffe066' }}>High</span>
            <span className="score-value" style={{ color: '#ffe066' }}>{highScore}</span>
          </div>
          <div className="svg-wrapper" ref={containerRef} style={{ aspectRatio: '4 / 3', width: '100%', maxWidth: 520, height: 'auto' }}>
            <svg
              width={gameSize.width}
              height={gameSize.height}
              style={{ display: "block", background: "#232946", borderRadius: 20, boxShadow: "0 8px 32px #000a, 0 0 0 4px #f5d30022", width: '100%', height: 'auto' }}
              viewBox={`0 0 ${gameSize.width} ${gameSize.height}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <circle cx={ball.x} cy={ball.y} r={BALL_RADIUS + 6} fill="#f5d30044" />
              <circle cx={ball.x} cy={ball.y} r={BALL_RADIUS + 2} fill="#0007" />
              <circle cx={ball.x} cy={ball.y} r={BALL_RADIUS} fill="url(#ballGradient)" style={{ filter: "drop-shadow(0 0 12px #ffe066)" }} />
              <defs>
                <radialGradient id="ballGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fffbe0" />
                  <stop offset="80%" stopColor="#f5d300" />
                  <stop offset="100%" stopColor="#bfa100" />
                </radialGradient>
                <linearGradient id="paddleGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#09f" />
                  <stop offset="100%" stopColor="#0cf" />
                </linearGradient>
              </defs>
              <rect
                x={paddleX}
                y={PADDLE_Y}
                width={PADDLE_WIDTH}
                height={PADDLE_HEIGHT}
                fill="url(#paddleGradient)"
                rx={12}
                style={{ filter: "drop-shadow(0 0 16px #09f8) drop-shadow(0 2px 8px #0cf8)" }}
              />
            </svg>
            {gameOver && (
              <div className="game-over">
                <div className="game-over-emoji">😵</div>
                <div className="game-over-title">Game Over!</div>
                <button onClick={handleRestart}>Restart</button>
              </div>
            )}
          </div>
        </main>
        {!showWelcome && (
          <footer className="game-footer">
            <span className="footer-icon" role="img" aria-label="mouse">🖱️</span> Move: Mouse &nbsp;|&nbsp;
            <span className="footer-icon" role="img" aria-label="arrow">⬅️➡️</span> Arrows &nbsp;|&nbsp;
            <span className="footer-icon" role="img" aria-label="goal">🎯</span> Don't miss the ball!
          </footer>
        )}
      </div>
    </div>
  );
};

export default App;
