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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">{type === "win" ? "🎉" : "😔"}</div>
        <h2>
          {type === "win" ? "Congratulations!" : "Better Luck Next Time"}
        </h2>
        <p>
          {message ||
            (type === "win"
              ? "You guessed the word correctly! Great job!"
              : "You've used all 5 guesses. Don't give up, try again!")}
        </p>
        <button className="btn btn-primary" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
