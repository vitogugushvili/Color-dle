"use client";

import { useState, useEffect } from "react";
import {
  generateColorGrid,
  findColorPosition,
  isWithinProximity,
} from "./utils/colorUtils";
import {
  loadGameState,
  saveGameState,
  hasSeenInstructionsToday,
  markInstructionsAsSeen,
} from "./utils/storageUtils";

interface Guess {
  color: string;
  isClose: boolean;
  position: { row: number; col: number };
}

export default function Colordle() {
  const [colors] = useState(() => generateColorGrid());
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentClue, setCurrentClue] = useState(1); // Start with first clue visible
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">(
    "playing"
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false); // Will be set based on localStorage
  const [celebrating, setCelebrating] = useState(false);
  const [animateGuess, setAnimateGuess] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [jumpingAnswer, setJumpingAnswer] = useState(false);
  const [movingToCenter, setMovingToCenter] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Hardcoded daily color and clues
  const targetColor = "#FFB3E0";
  const clues = ["Flamingo", "Hello Kitty", "Cotton Candy"];
  const targetPosition = findColorPosition(colors, targetColor);

  // Load game state from localStorage on mount
  useEffect(() => {
    const savedState = loadGameState();

    if (savedState) {
      // Restore saved game state
      setGuesses(savedState.guesses);
      setCurrentClue(savedState.currentClue);
      setGameState(savedState.gameStatus);

      // Show instructions only if not seen today
      setShowHowToPlay(!savedState.hasSeenInstructions);
    } else {
      // New day or first visit - show instructions
      setShowHowToPlay(!hasSeenInstructionsToday());
    }

    setIsLoaded(true);
  }, []);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return; // Don't save during initial load

    saveGameState({
      guesses,
      currentClue,
      gameStatus: gameState,
      hasSeenInstructions: hasSeenInstructionsToday(),
    });
  }, [guesses, currentClue, gameState, isLoaded]);

  // Effect to trigger animations when game is lost
  useEffect(() => {
    if (gameState === "lost") {
      // Start jump animation
      const jumpTimer = setTimeout(() => {
        setJumpingAnswer(true);

        // After jumping animation completes (1.2s), start moving to center
        const moveTimer = setTimeout(() => {
          setJumpingAnswer(false);
          setMovingToCenter(true);

          // After moving animation completes (0.8s), show answer
          const showTimer = setTimeout(() => {
            setShowAnswer(true);
          }, 800);

          return () => clearTimeout(showTimer);
        }, 1200);

        return () => clearTimeout(moveTimer);
      }, 300);

      return () => clearTimeout(jumpTimer);
    }
  }, [gameState]);

  const handleColorClick = (color: string) => {
    if (gameState !== "playing" || guesses.length >= 3) return;

    setSelectedColor(color);
    setAnimateGuess(true);

    // Add a slight delay for better UX and visual feedback
    setTimeout(() => {
      const position = findColorPosition(colors, color);
      const isClose = isWithinProximity(position, targetPosition, 1);

      const newGuess: Guess = { color, isClose, position };
      const newGuesses = [...guesses, newGuess];
      setGuesses(newGuesses);

      if (color.toLowerCase() === targetColor.toLowerCase()) {
        setGameState("won");
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 3000);
      } else if (newGuesses.length >= 3) {
        setCurrentClue(3);
        setGameState("lost");
      } else {
        setCurrentClue(newGuesses.length + 1); // +1 because first clue is already visible
      }

      setTimeout(() => {
        setSelectedColor(null);
        setAnimateGuess(false);
      }, 100);
    }, 200);
  };

  const getColorBorderClass = (color: string) => {
    const guess = guesses.find((g) => g.color === color);

    // Show green border on correct answer after loss animation completes
    if (
      gameState === "lost" &&
      showAnswer &&
      color.toLowerCase() === targetColor.toLowerCase()
    ) {
      return "ring-4 ring-green-500 ring-offset-2 ring-offset-gray-100 dark:ring-offset-black scale-110 shadow-xl shadow-green-500/60";
    }

    if (!guess) return "";

    // Don't show guess borders while animating to center (only during animation)
    const isCorrectAndMoving =
      guess.color.toLowerCase() === targetColor.toLowerCase() &&
      movingToCenter &&
      !showAnswer;
    if (isCorrectAndMoving) return "";

    if (guess.color.toLowerCase() === targetColor.toLowerCase()) {
      return "ring-4 ring-green-500 ring-offset-2 ring-offset-gray-100 dark:ring-offset-black scale-110 shadow-xl shadow-green-500/60";
    } else if (guess.isClose) {
      return "ring-4 ring-yellow-500 ring-offset-2 ring-offset-gray-100 dark:ring-offset-black scale-105 shadow-lg shadow-yellow-500/50";
    } else {
      return "ring-4 ring-gray-800 dark:ring-gray-600 ring-offset-0 shadow-2xl shadow-gray-800/70 dark:shadow-gray-300/50 opacity-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-2 sm:p-3 lg:p-4 flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        {/* Header */}
        <div className="max-w-3xl w-full">
          <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-700 pb-3">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                COLORDLE
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                Guess the daily color in 3 attempts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                  Attempts
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums transition-all duration-300">
                  {guesses.length}
                  <span className="text-gray-400 dark:text-gray-600">/3</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowHowToPlay(true);
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-110"
                title="How to Play"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Clues Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 mb-3">
            <h2 className="text-xs]] font-semibold mb-2 text-gray-900 dark:text-white">
              Clues
            </h2>
            <div className="space-y-1.5">
              {clues.map((clue, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-md border transition-all duration-500 ${
                    idx < currentClue || gameState !== "playing"
                      ? "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 animate-slide-in"
                      : "bg-gray-100 dark:bg-gray-850 border-gray-200 dark:border-gray-800 opacity-40"
                  }`}
                >
                  <div className="text-m font-medium text-gray-900 dark:text-white">
                    {idx < currentClue || gameState !== "playing"
                      ? `${idx + 1}. ${clue}`
                      : `${idx + 1}. Locked`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Color Grid */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
            <div className="relative overflow-visible">
              <div className="grid grid-cols-20 gap-0.5 sm:gap-1 p-2 bg-gray-100 dark:bg-black rounded-lg">
                {colors.map((color, idx) => {
                  const isCorrectColor =
                    color.toLowerCase() === targetColor.toLowerCase();
                  const shouldAnimateLoss =
                    gameState === "lost" && isCorrectColor;
                  const shouldAnimateWin =
                    gameState === "won" && isCorrectColor;
                  const wasGuessed = guesses.some(
                    (g) => g.color.toLowerCase() === color.toLowerCase()
                  );

                  // Determine opacity after game ends
                  let opacityClass = "";
                  if (gameState === "won" || gameState === "lost") {
                    if (isCorrectColor) {
                      // Correct color always has full opacity
                      opacityClass = "!opacity-100";
                    } else if (!wasGuessed) {
                      // Non-guessed colors are dimmed
                      opacityClass = "opacity-40";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleColorClick(color)}
                      disabled={gameState !== "playing"}
                      className={`aspect-square rounded-sm hover:scale-125 hover:z-10 disabled:hover:scale-100 active:scale-95 ${getColorBorderClass(
                        color
                      )} ${
                        selectedColor === color
                          ? "scale-125 z-10 shadow-lg"
                          : ""
                      } ${
                        shouldAnimateLoss && !showAnswer
                          ? "ring-4 ring-green-500 ring-offset-1 ring-offset-gray-100 dark:ring-offset-black z-30 shadow-xl shadow-green-500/50"
                          : ""
                      } ${
                        shouldAnimateWin && celebrating
                          ? "ring-4 ring-green-500 ring-offset-2 ring-offset-gray-100 dark:ring-offset-black z-30 shadow-2xl shadow-green-500/70 scale-125 animate-pulse"
                          : ""
                      } ${
                        shouldAnimateLoss && jumpingAnswer
                          ? "animate-jump-twice !important"
                          : ""
                      } ${
                        shouldAnimateLoss && movingToCenter
                          ? "transition-opacity duration-300 opacity-0 z-30"
                          : "transition-all duration-300"
                      } ${
                        isCorrectColor &&
                        (gameState === "won" || gameState === "lost")
                          ? "z-30"
                          : ""
                      } ${opacityClass}`}
                      style={{
                        backgroundColor: color,
                      }}
                      title={color}
                    />
                  );
                })}
              </div>

              {/* Animated Answer Box - Loss */}
              {gameState === "lost" && movingToCenter && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div
                    className="animate-grow-and-show flex items-center justify-center rounded-lg shadow-2xl"
                    style={{ backgroundColor: targetColor }}
                  >
                    {showAnswer && (
                      <p
                        className="text-white font-bold text-lg px-6 py-4 drop-shadow-lg animate-fade-in"
                        style={{
                          textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        }}
                      >
                        {targetColor}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Win Message - Center of Board */}
              {gameState === "won" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div className="animate-grow-and-show-win bg-white dark:bg-gray-800 border-4 border-green-500 rounded-2xl shadow-2xl p-6 text-center">
                    <p className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2 animate-fade-in">
                      🎉 Correct!
                    </p>
                    <p
                      className="text-lg font-semibold text-gray-700 dark:text-gray-300 animate-fade-in"
                      style={{ animationDelay: "0.2s" }}
                    >
                      You guessed it in {guesses.length}{" "}
                      {guesses.length === 1 ? "try" : "tries"}!
                    </p>
                    <p
                      className="mt-3 text-sm text-green-600 dark:text-green-400 animate-fade-in"
                      style={{ animationDelay: "0.4s" }}
                    >
                      Come back tomorrow for a new challenge
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* How to Play Modal */}
        {showHowToPlay && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowHowToPlay(false);
              markInstructionsAsSeen();
            }}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                How to Play
              </h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm">
                <p>Guess the COLORDLE in 3 attempts.</p>

                <p>
                  Each guess must be a color from the grid. Click any color to
                  submit.
                </p>

                <p>After each guess, you'll receive feedback:</p>

                <div className="space-y-3 my-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded border-2 border-green-500"></div>
                    <span>Green border means you found the correct color!</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded border-2 border-yellow-500"></div>
                    <span>
                      Yellow border means you're very close (1 square away)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded border-2 border-gray-400"></div>
                    <span>Gray border means try again</span>
                  </div>
                </div>

                <p>Wrong guesses unlock helpful clues!</p>

                <p className="font-medium">
                  A new COLORDLE will be available each day!
                </p>
              </div>
              <button
                onClick={() => {
                  setShowHowToPlay(false);
                  markInstructionsAsSeen();
                }}
                className="mt-6 w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Start Playing
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2025 DailyPlay Studios
        </p>
      </footer>
    </div>
  );
}
