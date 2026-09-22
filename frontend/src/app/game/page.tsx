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

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"win" | "lose">("win");
  const [modalMessage, setModalMessage] = useState("");

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
      setGamesRemaining(
        status.games_remaining_today ?? 3 - (status.games_played_today ?? 0)
      );

      if (status.has_active_game) {
        setGuesses(status.guesses || []);
        setAttemptsRemaining(status.attempts_remaining);
      }
    } catch {
      setError("Could not load game status. Try refreshing.");
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
      setError("Enter a 5-letter word.");
      return;
    }

    if (!/^[A-Za-z]+$/.test(currentGuess)) {
      setError("Letters only.");
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

        setTimeout(() => {
          if (result.is_correct) {
            setModalType("win");
            setModalMessage(
              `You guessed it in ${result.attempt} ${result.attempt === 1 ? "try" : "tries"}.`
            );
          } else {
            setModalType("lose");
            setModalMessage("The word was " + result.word + ". Try again with a new word.");
          }
          setShowModal(true);
        }, 500);
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
      <div className="page">
        <Navbar />
        <div className="loading" style={{ flex: 1 }}>
          <div className="spinner" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />

      <div className="main">
        <div className="game">
          {/* Status line */}
          <p className="game__meta">
            {hasActiveGame ? (
              <>
                Attempt <strong>{guesses.length + 1}</strong> of{" "}
                <strong>5</strong>
                {" · "}
                {gamesRemaining} game{gamesRemaining !== 1 ? "s" : ""} left
                today
              </>
            ) : (
              <>
                {gamesRemaining} game{gamesRemaining !== 1 ? "s" : ""} remaining
                today
              </>
            )}
          </p>

          {error && <div className="alert alert--error">{error}</div>}

          {!hasActiveGame ? (
            gamesRemaining > 0 ? (
              <div className="game__start">
                <h2 className="game__start-title">Ready to play?</h2>
                <p className="game__start-desc">
                  Guess a 5-letter word in 5 tries.
                </p>

                <div className="game__legend">
                  <span className="game__legend-item">
                    <span
                      className="game__legend-swatch"
                      style={{ background: "var(--correct)" }}
                    />
                    Correct
                  </span>
                  <span className="game__legend-item">
                    <span
                      className="game__legend-swatch"
                      style={{ background: "var(--present)" }}
                    />
                    Wrong spot
                  </span>
                  <span className="game__legend-item">
                    <span
                      className="game__legend-swatch"
                      style={{ background: "var(--absent)" }}
                    />
                    Not in word
                  </span>
                </div>

                <button
                  className="btn btn--primary"
                  onClick={handleStartGame}
                >
                  Start new game
                </button>
              </div>
            ) : (
              <p className="game__limit">
                You&rsquo;ve played all 3 games for today. Come back tomorrow.
              </p>
            )
          ) : (
            <>
              <GameBoard
                guesses={guesses}
                currentGuess={currentGuess}
                maxAttempts={5}
              />

              <div className="guess">
                <input
                  type="text"
                  className="guess__input"
                  value={currentGuess}
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/[^a-zA-Z]/g, "")
                      .toUpperCase()
                      .slice(0, 5);
                    setCurrentGuess(val);
                  }}
                  placeholder="Type a word…"
                  maxLength={5}
                  autoFocus
                  disabled={submitting}
                  aria-label="Your guess"
                />
                <button
                  className="btn btn--primary btn--block"
                  onClick={handleSubmitGuess}
                  disabled={currentGuess.length !== 5 || submitting}
                >
                  {submitting ? "Checking…" : "Submit"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        type={modalType}
        message={modalMessage}
      />
    </div>
  );
}
