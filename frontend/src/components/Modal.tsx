"use client";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "win" | "lose";
  message?: string;
}

export default function Modal({ isOpen, onClose, type, message }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">
          {type === "win" ? "You got it" : "Not this time"}
        </h2>
        <p className="modal__body">
          {message ||
            (type === "win"
              ? "You guessed the word correctly."
              : "You\u2019ve used all 5 guesses. Try again with a new word.")}
        </p>
        <button className="btn btn--primary" onClick={onClose}>
          {type === "win" ? "Play Again" : "Try Again"}
        </button>
      </div>
    </div>
  );
}
