/**
 * Utility functions for managing daily game state in localStorage
 */

export interface GameState {
  date: string;
  guesses: Array<{
    color: string;
    isClose: boolean;
    position: { row: number; col: number };
  }>;
  currentClue: number;
  gameStatus: "playing" | "won" | "lost";
  hasSeenInstructions: boolean;
}

const STORAGE_KEY = "colordle_game_state";

/**
 * Gets the current date string in YYYY-MM-DD format
 */
export function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/**
 * Loads game state from localStorage
 * Returns null if no state exists or if it's a new day
 */
export function loadGameState(): GameState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const gameState: GameState = JSON.parse(stored);
    const today = getTodayString();

    // If it's a new day, clear old state
    if (gameState.date !== today) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return gameState;
  } catch (error) {
    console.error("Error loading game state:", error);
    return null;
  }
}

/**
 * Saves game state to localStorage with today's date
 */
export function saveGameState(state: Omit<GameState, "date">): void {
  if (typeof window === "undefined") return;

  try {
    const gameState: GameState = {
      ...state,
      date: getTodayString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  } catch (error) {
    console.error("Error saving game state:", error);
  }
}

/**
 * Clears the game state from localStorage
 */
export function clearGameState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Checks if the user has already seen instructions today
 */
export function hasSeenInstructionsToday(): boolean {
  const state = loadGameState();
  return state?.hasSeenInstructions ?? false;
}

/**
 * Marks that the user has seen instructions today
 */
export function markInstructionsAsSeen(): void {
  const state = loadGameState();
  if (state) {
    saveGameState({
      ...state,
      hasSeenInstructions: true,
    });
  } else {
    // First visit today, create minimal state
    saveGameState({
      guesses: [],
      currentClue: 1,
      gameStatus: "playing",
      hasSeenInstructions: true,
    });
  }
}
