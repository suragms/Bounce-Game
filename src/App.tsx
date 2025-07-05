import React, { useRef, useEffect, useState } from "react";
import "./App.css";

const GAME_WIDTH = 480;
const GAME_HEIGHT = 320;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 10;
const PADDLE_Y = GAME_HEIGHT - 30;
const BALL_SPEED = 4;

function getRandomAngle() {
  // Between 30 and 150 degrees, in radians
  const deg = 30 + Math.random() * 120;
  return (deg * Math.PI) / 180;
}

const App: React.FC = () => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paddleX, setPaddleX] = useState(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
  const [ball, setBall] = useState({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    dx: BALL_SPEED * Math.cos(getRandomAngle()),
    dy: -BALL_SPEED * Math.sin(getRandomAngle()),
  });
  const requestRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Paddle movement with keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.key === "ArrowLeft") {
        setPaddleX((x) => Math.max(0, x - 32));
      } else if (e.key === "ArrowRight") {
        setPaddleX((x) => Math.min(GAME_WIDTH - PADDLE_WIDTH, x + 32));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameOver]);

  // Paddle movement with mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gameOver || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let mouseX = e.clientX - rect.left;
      mouseX = Math.max(0, Math.min(mouseX, GAME_WIDTH));
      setPaddleX(
        Math.max(0, Math.min(mouseX - PADDLE_WIDTH / 2, GAME_WIDTH - PADDLE_WIDTH))
      );
    };
    const ref = containerRef.current;
    if (ref) ref.addEventListener("mousemove", handleMouseMove);
    return () => ref && ref.removeEventListener("mousemove", handleMouseMove);
  }, [gameOver]);

  // Game loop
  useEffect(() => {
    if (gameOver) return;
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
        } else if (x + BALL_RADIUS > GAME_WIDTH) {
          x = GAME_WIDTH - BALL_RADIUS;
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
          x >= paddleX &&
          x <= paddleX + PADDLE_WIDTH &&
          dy > 0
        ) {
          y = PADDLE_Y - BALL_RADIUS;
          dy = -dy;
          newScore = score + 1;
          setScore(newScore);
        }
        // Game over
        if (y - BALL_RADIUS > GAME_HEIGHT) {
          setGameOver(true);
          return prev;
        }
        return { x, y, dx, dy };
      });
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => requestRef.current && cancelAnimationFrame(requestRef.current);
    // eslint-disable-next-line
  }, [gameOver, paddleX, score]);

  const handleRestart = () => {
    setScore(0);
    setGameOver(false);
    setPaddleX(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
    setBall({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      dx: BALL_SPEED * Math.cos(getRandomAngle()),
      dy: -BALL_SPEED * Math.sin(getRandomAngle()),
    });
  };

  return (
    <div className="game-container" ref={containerRef} style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
      <svg width={GAME_WIDTH} height={GAME_HEIGHT} style={{ display: "block", background: "#222" }}>
        {/* Ball */}
        <circle cx={ball.x} cy={ball.y} r={BALL_RADIUS} fill="#f5d300" />
        {/* Paddle */}
        <rect
          x={paddleX}
          y={PADDLE_Y}
          width={PADDLE_WIDTH}
          height={PADDLE_HEIGHT}
          fill="#09f"
          rx={6}
        />
      </svg>
      <div className="score">Score: {score}</div>
      {gameOver && (
        <div className="game-over">
          <div>Game Over!</div>
          <button onClick={handleRestart}>Restart</button>
        </div>
      )}
    </div>
  );
};

export default App;
