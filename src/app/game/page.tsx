
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const GRID_SIZE = 20;
const CANVAS_SIZE = 400; // 20 * 20
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const getRandomCoordinate = () => {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };
};

export default function SnakeGamePage() {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState(getRandomCoordinate());
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [speed, setSpeed] = useState<number | null>(200);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (direction !== 'DOWN') setDirection('UP');
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (direction !== 'UP') setDirection('DOWN');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (direction !== 'RIGHT') setDirection('LEFT');
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (direction !== 'LEFT') setDirection('RIGHT');
        break;
    }
  }, [direction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const moveSnake = useCallback(() => {
    if (gameOver) return;

    setSnake((prevSnake) => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      switch (direction) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        setSpeed(null);
        return prevSnake;
      }

      // Self collision
      for (let i = 1; i < newSnake.length; i++) {
        if (head.x === newSnake[i].x && head.y === newSnake[i].y) {
          setGameOver(true);
          setSpeed(null);
          return prevSnake;
        }
      }

      newSnake.unshift(head);

      // Food collision
      if (head.x === food.x && head.y === food.y) {
        setScore((s) => s + 10);
        let newFoodPosition;
        do {
            newFoodPosition = getRandomCoordinate();
        } while (newSnake.some(segment => segment.x === newFoodPosition.x && segment.y === newFoodPosition.y));
        setFood(newFoodPosition);
        // Don't pop the tail, making the snake grow
      } else {
        newSnake.pop();
      }
      
      return newSnake;
    });
  }, [direction, food, gameOver]);
  
  useEffect(() => {
    if (speed !== null && !gameOver) {
        gameLoopRef.current = setInterval(moveSnake, speed);
    }
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [speed, gameOver, moveSnake]);

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(getRandomCoordinate());
    setDirection('RIGHT');
    setSpeed(200);
    setGameOver(false);
    setScore(0);
  };
  
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-primary">Snake Game</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div
            className="relative bg-background/80 border-2 border-primary rounded-md"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
          >
            {snake.map((segment, index) => (
              <div
                key={index}
                className={`absolute rounded-sm ${index === 0 ? 'bg-green-400' : 'bg-green-600'}`}
                style={{
                  left: segment.x * CELL_SIZE,
                  top: segment.y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
              />
            ))}
            <div
              className="absolute rounded-full bg-red-500"
              style={{
                left: food.x * CELL_SIZE,
                top: food.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            />
            {gameOver && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white rounded-md">
                <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-4xl font-bold">Game Over</h2>
                <p className="text-xl mt-2">Your Score: {score}</p>
                <Button onClick={startGame} className="mt-6">
                  Play Again
                </Button>
              </div>
            )}
          </div>
          <div className="w-full text-center">
             <p className="text-xl font-bold text-foreground">Score: {score}</p>
             <p className="text-sm text-muted-foreground mt-2">Use Arrow Keys to Move</p>
          </div>
        </CardContent>
      </Card>
      <div className="mt-8 text-center">
        <Link href="/" className="text-primary hover:underline">
          &larr; Back to Bhasha Guard Home
        </Link>
      </div>
    </div>
  );
}
