import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

export default function App() {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [matchStarted, setMatchStarted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [result, setResult] = useState(null);
  const [opponentScore, setOpponentScore] = useState(null);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const pastelCombos = [
    {
      bg: 'bg-pastel-pink', btn: 'bg-pastel-blue hover:bg-pastel-blue-dark', text: 'text-pastel-blue',
    },
    {
      bg: 'bg-pastel-yellow', btn: 'bg-pastel-green hover:bg-pastel-green-dark', text: 'text-pastel-green',
    },
    {
      bg: 'bg-pastel-blue', btn: 'bg-pastel-pink hover:bg-pastel-pink-dark', text: 'text-pastel-pink',
    },
    {
      bg: 'bg-pastel-green', btn: 'bg-pastel-yellow hover:bg-pastel-yellow-dark', text: 'text-pastel-yellow',
    },
    {
      bg: 'bg-pastel-purple', btn: 'bg-pastel-orange hover:bg-pastel-orange-dark', text: 'text-pastel-orange',
    },
    {
      bg: 'bg-pastel-orange', btn: 'bg-pastel-purple hover:bg-pastel-purple-dark', text: 'text-pastel-purple',
    },
  ];
  const [pastelIdx, setPastelIdx] = useState(0);

  useEffect(() => {
    const adjectives = [
      'Witty', 'Sleepy', 'Jumpy', 'Funky', 'Angry', 'Sassy', 'Goofy', 'Zany', 'Cheeky', 'Nerdy',
      'Spicy', 'Bouncy', 'Grumpy', 'Silly', 'Snazzy', 'Loopy', 'Dizzy', 'Chill', 'Groovy', 'Sneaky',
      'Quirky', 'Peppy', 'Giggly', 'Wobbly', 'Breezy', 'Dorky', 'Rowdy', 'Bubbly', 'Oddball', 'Hyper',
      'Clumsy', 'Mellow', 'Nutty', 'Zesty', 'Fuzzy', 'Cranky', 'Perky', 'Wacky', 'Tipsy', 'Spooky',
      'Fluffy', 'Tiny', 'Mega', 'Epic', 'Cosmic', 'Turbo', 'Ultra', 'Chubby', 'Loud', 'Silent',
      'Swift', 'Lazy', 'Epic', 'Weird', 'Cool', 'Rad', 'Wild', 'Magic', 'Lucky', 'Unicorn',
      'Electric', 'Pixel', 'Retro', 'Viral', 'Meme', 'Legend', 'Mystic', 'Shadow', 'Sunny', 'Frosty'
    ];
    const animals = [
      'Duck', 'Sloth', 'Giraffe', 'Penguin', 'Llama', 'Otter', 'Moose', 'Ferret', 'Narwhal', 'Capybara',
      'Platypus', 'Wombat', 'Panda', 'Koala', 'Hedgehog', 'Axolotl', 'Corgi', 'Pug', 'Goat', 'Sheep',
      'Alpaca', 'Mole', 'Frog', 'Toad', 'Crab', 'Shrimp', 'Mantis', 'Bat', 'Crow', 'Parrot',
      'Owl', 'Eagle', 'Shark', 'Seal', 'Walrus', 'Otter', 'Raccoon', 'Squirrel', 'Hamster', 'Mouse',
      'Cat', 'Dog', 'Wolf', 'Fox', 'Bear', 'Tiger', 'Lion', 'Leopard', 'Jaguar', 'Monkey',
      'Ape', 'Baboon', 'Chinchilla', 'Dingo', 'Emu', 'Falcon', 'Gecko', 'Hyena', 'Iguana', 'Jackal',
      'Kangaroo', 'Lynx', 'Mongoose', 'Newt', 'Ocelot', 'Porcupine', 'Quokka', 'Raven', 'Salamander', 'Tapir'
    ];
    const randomName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${animals[Math.floor(Math.random() * animals.length)]}`;
    setName(randomName);
    setPastelIdx(Math.floor(Math.random() * pastelCombos.length));

    socket.on('start_game', ({ roomId, questions }) => {
      setRoomId(roomId);
      setQuestions(questions);
      setMatchStarted(true);
      setGameStarted(true);
      startTimer();
    });

    socket.on('end_game', ({ p1, p2 }) => {
      const opponent = score === p1 ? p2 : p1;
      setOpponentScore(opponent);
      setResult(
        score > opponent
          ? 'You Win! 🎉'
          : score < opponent
          ? 'You Lose! 😔'
          : "It's a Tie! 🤝"
      );
      setShowResultModal(true);
      setGameStarted(false);
      setTimeLeft(0); // Ensure timer shows 0
    });

    socket.on('opponent_left', () => {
      setOpponentLeft(true);
      setGameStarted(false);
    });

    return () => {
      socket.off('start_game');
      socket.off('end_game');
      socket.off('opponent_left');
    };
  }, [score, pastelCombos.length]);

  useEffect(() => {
    let interval;
    if (timerActive && gameStarted && !opponentLeft) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameStarted(false);
            setTimerActive(false);
            socket.emit('submit_score', { roomId, score });
            setShowResultModal(true); // Show modal if timer runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameStarted, opponentLeft, roomId, score]);

  const startTimer = () => {
    setScore(0);
    setTimeLeft(60);
    setCurrentIndex(0);
    setShowResultModal(false);
    setTimerActive(true);
  };

  const submitAnswer = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    if (parseFloat(answer) === parseFloat(currentQ.a)) {
      setScore(prev => prev + 1);
    }

    setAnswer('');
    setCurrentIndex(prev => prev + 1);
  };

  const handleStartGame = () => {
    socket.emit('start_matchmaking');
    setMatchStarted(true); // show waiting screen
  };

  const currentQ = questions[currentIndex];

  return (
    <>
      {/* Start Screen */}
      {!matchStarted && (
        <div className={`h-screen flex flex-col justify-center items-center gap-4 text-center transition-all duration-500 ${pastelCombos[pastelIdx].bg}`}>
          <h1 className={`text-2xl font-bold ${pastelCombos[pastelIdx].text}`}>Welcome, {name}</h1>
          <button
            onClick={handleStartGame}
            className={`px-6 py-2 rounded transition-all duration-300 text-white text-lg font-semibold shadow-md ${pastelCombos[pastelIdx].btn}`}
          >
            Start Game
          </button>
        </div>
      )}

      {/* Opponent Left */}
      {opponentLeft && (
        <div className="h-screen flex flex-col justify-center items-center text-center gap-4">
          <h1 className="text-2xl font-bold">Opponent left the game.</h1>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Restart
          </button>
        </div>
      )}

      {/* Main Game Screen */}
      {matchStarted && gameStarted && !opponentLeft && (
        <div className="h-screen flex flex-col justify-center items-center gap-6">
          <p className="text-xl">Time Left: {timeLeft}s</p>
          <h2 className="text-2xl font-bold">{currentQ?.q}</h2>
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
      )}

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 animate-fadeIn">
          <div className="bg-white text-black rounded-xl p-8 shadow-xl text-center max-w-sm w-full transform transition-all duration-300 scale-100 animate-slideIn">
            <h2 className="text-3xl font-bold mb-4">{result}</h2>
            <div className="space-y-3 mb-6">
              <p className="text-lg">Your Score: <strong className="text-blue-600 text-xl">{score}</strong></p>
              <p className="text-lg">Opponent Score: <strong className="text-blue-600 text-xl">{opponentScore}</strong></p>
            </div>
            <button
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transform transition-all duration-200 hover:scale-105 active:scale-95"
              onClick={() => window.location.reload()}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </>
  );
}
