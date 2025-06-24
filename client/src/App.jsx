import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001'); // Backend URL

export default function App() {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [opponentScore, setOpponentScore] = useState(null);

  // Generate random funny name
  useEffect(() => {
    const adjectives = ['Witty', 'Sleepy', 'Jumpy', 'Funky', 'Angry'];
    const animals = ['Duck', 'Sloth', 'Giraffe', 'Penguin', 'Llama'];
    const randomName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${animals[Math.floor(Math.random() * animals.length)]}`;
    setName(randomName);
  }, []);

  // Socket listeners
  useEffect(() => {
    socket.on('match_found', ({ roomId }) => {
      setRoomId(roomId);
      setTimeout(() => {
        setGameStarted(true);
        startGame();
      }, 1000); // You can add a 3-2-1 countdown later
    });

    socket.on('end_game', ({ p1, p2 }) => {
      setGameStarted(false);
      const opponent = (p1 === score) ? p2 : p1;
      setOpponentScore(opponent);
      setResult(
        score > opponent
          ? 'You Win!'
          : score < opponent
          ? 'You Lose!'
          : "It's a Tie!"
      );
    });
  }, [score]);

  const generateQuestion = (elapsed) => {
    const operators = ['+', '-', '*', '/'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    const rangeMin = elapsed < 30 ? 10 : 100;
    const rangeMax = elapsed < 30 ? 99 : 999;
    let a = Math.floor(Math.random() * (rangeMax - rangeMin)) + rangeMin;
    let b = Math.floor(Math.random() * (rangeMax - rangeMin)) + rangeMin;
    if (operator === '/' && b === 0) b = 1;

    return {
      q: `${a} ${operator} ${b}`,
      a: eval(`${a} ${operator} ${b}`),
    };
  };

  const startGame = () => {
    let elapsed = 0;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        elapsed++;
        if (prev <= 1) {
          clearInterval(interval);
          socket.emit('submit_score', { roomId, score });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setQuestion(generateQuestion(elapsed));
  };

  const submitAnswer = () => {
    if (parseFloat(answer) === parseFloat(question.a)) {
      setScore(prev => prev + 1);
    }
    setAnswer('');
    setQuestion(generateQuestion(60 - timeLeft));
  };

  // Render Logic
  if (!roomId) {
    return (
      <div className="h-screen flex flex-col justify-center items-center text-center gap-4">
        <h1 className="text-2xl font-bold">Welcome, {name}</h1>
        <p className="text-lg">Waiting for an opponent...</p>
      </div>
    );
  }

  if (!gameStarted) {
    return result ? (
      <div className="h-screen flex flex-col justify-center items-center text-center gap-4">
        <h1 className="text-3xl font-bold">{result}</h1>
        <p>Your Score: {score}</p>
        <p>Opponent Score: {opponentScore}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Play Again
        </button>
      </div>
    ) : (
      <div className="h-screen flex flex-col justify-center items-center text-center gap-4">
        <p className="text-lg">Game starting soon...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col justify-center items-center gap-6">
      <p className="text-xl">Time Left: {timeLeft}s</p>
      <h2 className="text-2xl font-bold">{question?.q}</h2>
      <input
        type="number"
        className="border px-4 py-2 rounded"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
      />
      <button
        onClick={submitAnswer}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Submit
      </button>
      <p className="text-lg">Score: {score}</p>
    </div>
  );
}
