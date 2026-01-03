import { useEffect, useRef, useState, useCallback } from 'react';

const GRAVITY = 0.5;
const JUMP_STRENGTH = -9;
const PIPE_SPEED = 3;
const PIPE_WIDTH = 70;
const PIPE_GAP = 160;
const BIRD_SIZE = 35;
const GROUND_HEIGHT = 80;

interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

export const FlappyBird = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('flappyHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });

  const gameRef = useRef({
    birdY: 250,
    birdVelocity: 0,
    pipes: [] as Pipe[],
    frameCount: 0,
    animationId: 0,
  });

  const jump = useCallback(() => {
    if (gameState === 'idle') {
      setGameState('playing');
      gameRef.current.birdY = 250;
      gameRef.current.birdVelocity = JUMP_STRENGTH;
      gameRef.current.pipes = [];
      gameRef.current.frameCount = 0;
      setScore(0);
    } else if (gameState === 'playing') {
      gameRef.current.birdVelocity = JUMP_STRENGTH;
    } else if (gameState === 'gameover') {
      setGameState('idle');
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const game = gameRef.current;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const playableHeight = canvasHeight - GROUND_HEIGHT;

    const drawBackground = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(0.7, '#FFE4B5');
      gradient.addColorStop(1, '#DEB887');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const drawCloud = (x: number, y: number, scale: number) => {
        ctx.beginPath();
        ctx.arc(x, y, 25 * scale, 0, Math.PI * 2);
        ctx.arc(x + 25 * scale, y - 10 * scale, 20 * scale, 0, Math.PI * 2);
        ctx.arc(x + 50 * scale, y, 25 * scale, 0, Math.PI * 2);
        ctx.arc(x + 25 * scale, y + 5 * scale, 18 * scale, 0, Math.PI * 2);
        ctx.fill();
      };
      drawCloud(50, 80, 1);
      drawCloud(200, 120, 0.8);
      drawCloud(350, 60, 1.2);
    };

    const drawGround = () => {
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(0, playableHeight, canvasWidth, GROUND_HEIGHT);
      
      ctx.fillStyle = '#6B5344';
      ctx.fillRect(0, playableHeight, canvasWidth, 10);
      
      // Grass
      ctx.fillStyle = '#228B22';
      ctx.fillRect(0, playableHeight - 15, canvasWidth, 15);
      ctx.fillStyle = '#32CD32';
      for (let i = 0; i < canvasWidth; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, playableHeight);
        ctx.lineTo(i + 10, playableHeight - 15);
        ctx.lineTo(i + 20, playableHeight);
        ctx.fill();
      }
    };

    const drawBird = (y: number, velocity: number) => {
      const x = 80;
      const rotation = Math.min(Math.max(velocity * 3, -30), 70) * (Math.PI / 180);
      
      ctx.save();
      ctx.translate(x + BIRD_SIZE / 2, y + BIRD_SIZE / 2);
      ctx.rotate(rotation);
      
      // Body
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Wing
      ctx.fillStyle = '#FFA500';
      const wingOffset = Math.sin(Date.now() / 50) * 3;
      ctx.beginPath();
      ctx.ellipse(-5, wingOffset, 12, 8, -0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(8, -5, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(10, -5, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Beak
      ctx.fillStyle = '#FF6347';
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(25, 3);
      ctx.lineTo(15, 8);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    };

    const drawPipe = (pipe: Pipe) => {
      const { x, topHeight } = pipe;
      const bottomY = topHeight + PIPE_GAP;
      
      // Top pipe
      const topGradient = ctx.createLinearGradient(x, 0, x + PIPE_WIDTH, 0);
      topGradient.addColorStop(0, '#228B22');
      topGradient.addColorStop(0.3, '#32CD32');
      topGradient.addColorStop(0.7, '#228B22');
      topGradient.addColorStop(1, '#006400');
      
      ctx.fillStyle = topGradient;
      ctx.fillRect(x, 0, PIPE_WIDTH, topHeight);
      
      // Top pipe cap
      ctx.fillRect(x - 5, topHeight - 30, PIPE_WIDTH + 10, 30);
      ctx.fillStyle = '#006400';
      ctx.fillRect(x - 5, topHeight - 30, 3, 30);
      ctx.fillStyle = '#32CD32';
      ctx.fillRect(x + PIPE_WIDTH + 2, topHeight - 30, 3, 30);
      
      // Bottom pipe
      ctx.fillStyle = topGradient;
      ctx.fillRect(x, bottomY, PIPE_WIDTH, playableHeight - bottomY);
      
      // Bottom pipe cap
      ctx.fillRect(x - 5, bottomY, PIPE_WIDTH + 10, 30);
      ctx.fillStyle = '#006400';
      ctx.fillRect(x - 5, bottomY, 3, 30);
      ctx.fillStyle = '#32CD32';
      ctx.fillRect(x + PIPE_WIDTH + 2, bottomY, 3, 30);
    };

    const checkCollision = (birdY: number, pipes: Pipe[]) => {
      const birdLeft = 80;
      const birdRight = birdLeft + BIRD_SIZE;
      const birdTop = birdY;
      const birdBottom = birdY + BIRD_SIZE;

      // Ground collision
      if (birdBottom >= playableHeight - 10) return true;
      // Ceiling collision
      if (birdTop <= 0) return true;

      for (const pipe of pipes) {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + PIPE_WIDTH;
        
        if (birdRight > pipeLeft && birdLeft < pipeRight) {
          if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
            return true;
          }
        }
      }
      return false;
    };

    const gameLoop = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      drawBackground();

      if (gameState === 'playing') {
        // Update bird
        game.birdVelocity += GRAVITY;
        game.birdY += game.birdVelocity;

        // Spawn pipes
        game.frameCount++;
        if (game.frameCount % 90 === 0) {
          const minHeight = 50;
          const maxHeight = playableHeight - PIPE_GAP - 50;
          const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
          game.pipes.push({ x: canvasWidth, topHeight, passed: false });
        }

        // Update pipes
        game.pipes = game.pipes.filter(pipe => pipe.x + PIPE_WIDTH > -10);
        game.pipes.forEach(pipe => {
          pipe.x -= PIPE_SPEED;
          
          // Score
          if (!pipe.passed && pipe.x + PIPE_WIDTH < 80) {
            pipe.passed = true;
            setScore(prev => {
              const newScore = prev + 1;
              if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem('flappyHighScore', newScore.toString());
              }
              return newScore;
            });
          }
        });

        // Check collision
        if (checkCollision(game.birdY, game.pipes)) {
          setGameState('gameover');
        }
      }

      // Draw pipes
      game.pipes.forEach(drawPipe);
      
      // Draw ground
      drawGround();

      // Draw bird
      const birdY = gameState === 'idle' 
        ? 250 + Math.sin(Date.now() / 300) * 15 
        : game.birdY;
      drawBird(birdY, gameState === 'idle' ? 0 : game.birdVelocity);

      game.animationId = requestAnimationFrame(gameLoop);
    };

    game.animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(game.animationId);
    };
  }, [gameState, highScore]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen game-container p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          onClick={jump}
          className="rounded-2xl shadow-2xl cursor-pointer border-4 border-secondary"
        />
        
        {/* Score Display */}
        {gameState === 'playing' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <span className="text-4xl text-card score-display font-bold">
              {score}
            </span>
          </div>
        )}

        {/* Idle Screen */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center game-overlay rounded-2xl">
            <h1 className="text-3xl text-primary game-title mb-8">FLAPPY BIRD</h1>
            <div className="animate-float mb-8">
              <span className="text-6xl">🐦</span>
            </div>
            <button onClick={jump} className="game-button text-sm">
              TAP TO PLAY
            </button>
            <p className="text-card text-xs mt-4 opacity-80">
              or press SPACE
            </p>
            {highScore > 0 && (
              <p className="text-card text-xs mt-6">
                Best: {highScore}
              </p>
            )}
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center game-overlay rounded-2xl">
            <h2 className="text-2xl text-destructive game-title mb-4">GAME OVER</h2>
            <div className="bg-card/90 rounded-xl p-6 mb-6 text-center">
              <p className="text-lg mb-2">Score</p>
              <p className="text-4xl text-primary font-bold mb-4">{score}</p>
              <p className="text-sm text-muted-foreground">Best: {highScore}</p>
            </div>
            <button onClick={jump} className="game-button text-sm">
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
      
      <p className="text-card/80 text-xs mt-4 text-center">
        Click or press SPACE to flap
      </p>
    </div>
  );
};
