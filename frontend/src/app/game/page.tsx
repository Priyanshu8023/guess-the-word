"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import GameBoard from "@/components/GameBoard";
import Modal from "@/components/Modal";
import {
  isAuthenticated,
  startGame,
  submitGuess,
  getGameStatus,
} from "@/lib/api";

interface GuessData {
  attempt: number;
  word: string;
  result: string[];
}

export default function GamePage() {
  const router = useRouter();
  const [guesses, setGuesses] = useState<GuessData[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [hasActiveGame, setHasActiveGame] = useState(false);
  const [gamesRemaining, setGamesRemaining] = useState(3);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"win" | "lose">("win");
  const [modalMessage, setModalMessage] = useState("");

  // Check auth
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadGameStatus();
  }, [router]);

  const loadGameStatus = async () => {
    try {
      const status = await getGameStatus();
      setHasActiveGame(status.has_active_game);
      setGamesRemaining(status.games_remaining_today ?? 3 - (status.games_played_today ?? 0));

      if (status.has_active_game) {
        setGuesses(status.guesses || []);
        setAttemptsRemaining(status.attempts_remaining);
      }
    } catch {
      setError("Failed to load game status.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    setError("");
    try {
      await startGame();
      setHasActiveGame(true);
      setGuesses([]);
      setCurrentGuess("");
      setAttemptsRemaining(5);
      await loadGameStatus();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start game";
      setError(errorMessage);
    }
  };

  const handleSubmitGuess = useCallback(async () => {
    if (currentGuess.length !== 5) {
      setError("Please enter a 5-letter word.");
      return;
    }

    if (!/^[A-Za-z]+$/.test(currentGuess)) {
      setError("Only letters are allowed.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const result = await submitGuess(currentGuess.toUpperCase());

      const newGuess: GuessData = {
        attempt: result.attempt,
        word: result.word,
        result: result.result,
      };

      setGuesses((prev) => [...prev, newGuess]);
      setCurrentGuess("");
      setAttemptsRemaining((prev) => prev - 1);

      if (result.game_over) {
        setHasActiveGame(false);

        // Small delay so the tiles animate before showing modal
        setTimeout(() => {
          if (result.is_correct) {
            setModalType("win");
            setModalMessage("You guessed the word correctly! Amazing! 🎉");
          } else {
            setModalType("lose");
            setModalMessage(
              "You've used all 5 guesses. Don't give up, try again!"
            );
          }
          setShowModal(true);
        }, 600);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit guess";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [currentGuess]);

  const handleModalClose = () => {
    setShowModal(false);
    loadGameStatus();
  };

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showModal || !hasActiveGame || submitting) return;

      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmitGuess();
      } else if (e.key === "Backspace") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < 5) {
        setCurrentGuess((prev) => prev + e.key.toUpperCase());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentGuess, showModal, hasActiveGame, submitting, handleSubmitGuess]);

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading" style={{ flex: 1 }}>
          <div className="spinner"></div>
          Loading game...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />

      <div className="main-content">
        <div className="game-container">
          {/* Game info badges */}
          <div className="game-info">
            <span className="game-badge">
              Games remaining today: <strong>{gamesRemaining}</strong>
            </span>
            {hasActiveGame && (
              <span className="game-badge">
                Attempts left: <strong>{attemptsRemaining}</strong>
              </span>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {!hasActiveGame ? (
            /* No active game — show start button */
            <div className="card" style={{ textAlign: "center", marginTop: 20 }}>
              <div className="card-header">
                <h2>🎮 Ready to Play?</h2>
                <p>
                  Guess the 5-letter word in 5 attempts. Letters are shown in
                  uppercase.
                </p>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <span className="game-badge">🟩 Correct position</span>
                  <span className="game-badge">🟧 Wrong position</span>
                  <span className="game-badge">⬜ Not in word</span>
                </div>
              </div>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleStartGame}
                disabled={gamesRemaining <= 0}
              >
                {gamesRemaining > 0
                  ? "Start New Game"
                  : "Daily Limit Reached"}
              </button>
            </div>
          ) : (
            /* Active game — show board and input */
            <>
              <GameBoard
                guesses={guesses}
                currentGuess={currentGuess}
                maxAttempts={5}
              />

              <div className="input-section">
                <input
                  type="text"
                  className="guess-input"
                  value={currentGuess}
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/[^a-zA-Z]/g, "")
                      .toUpperCase()
                      .slice(0, 5);
                    setCurrentGuess(val);
                  }}
                  placeholder="Type your guess..."
                  maxLength={5}
                  autoFocus
                  disabled={submitting}
                />
                <button
                  className="btn btn-primary btn-block"
                  onClick={handleSubmitGuess}
                  disabled={currentGuess.length !== 5 || submitting}
                >
                  {submitting ? "Checking..." : "Submit Guess"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Win/Loss Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        type={modalType}
        message={modalMessage}
      />
    </div>
  );
}
