"use client";

import Tile from "./Tile";

interface GuessData {
  attempt: number;
  word: string;
  result: string[];
}

interface GameBoardProps {
  guesses: GuessData[];
  currentGuess: string;
  maxAttempts: number;
}

export default function GameBoard({
  guesses,
  currentGuess,
  maxAttempts,
}: GameBoardProps) {
  const rows = [];

  for (let i = 0; i < maxAttempts; i++) {
    const tiles = [];

    if (i < guesses.length) {
      const guess = guesses[i];
      for (let j = 0; j < 5; j++) {
        tiles.push(
          <Tile
            key={`${i}-${j}`}
            letter={guess.word[j] || ""}
            state={guess.result[j] as "green" | "orange" | "grey"}
          />
        );
      }
    } else if (i === guesses.length) {
      for (let j = 0; j < 5; j++) {
        tiles.push(
          <Tile
            key={`${i}-${j}`}
            letter={currentGuess[j] || ""}
            state={currentGuess[j] ? "filled" : "empty"}
          />
        );
      }
    } else {
      for (let j = 0; j < 5; j++) {
        tiles.push(<Tile key={`${i}-${j}`} letter="" state="empty" />);
      }
    }

    rows.push(
      <div key={i} className="board__row">
        {tiles}
      </div>
    );
  }

  return <div className="board">{rows}</div>;
}
