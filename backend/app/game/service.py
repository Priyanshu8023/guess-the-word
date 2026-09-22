import json
import random
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from app.database import db
from app.game.utils import compare_words, result_to_json


async def get_today_games_count(user_id: int) -> int:
    """Get the number of games a user has started today."""
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    count = await db.game.count(
        where={
            "userId": user_id,
            "startedAt": {
                "gte": today_start,
                "lt": today_end,
            },
        }
    )
    return count


async def get_active_game(user_id: int):
    """Get the current in-progress game for a user."""
    game = await db.game.find_first(
        where={
            "userId": user_id,
            "status": "IN_PROGRESS",
        },
        include={
            "guesses": {
                "order_by": {"attempt": "asc"},
            },
            "word": True,
        },
    )
    return game


async def start_new_game(user_id: int):
    """Start a new game for the user."""
    # Check if user already has an active game
    active_game = await db.game.find_first(
        where={
            "userId": user_id,
            "status": "IN_PROGRESS",
        }
    )
    if active_game:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active game. Finish it first.",
        )

    # Check daily limit (max 3 games per day)
    today_count = await get_today_games_count(user_id)
    if today_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have reached the daily limit of 3 games.",
        )

    # Get all word IDs the user has already played today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    played_games = await db.game.find_many(
        where={
            "userId": user_id,
            "startedAt": {
                "gte": today_start,
                "lt": today_end,
            },
        },
        select={"wordId": True},
    )
    played_word_ids = [g.wordId for g in played_games]

    # Get available words (not played today)
    if played_word_ids:
        available_words = await db.word.find_many(
            where={
                "id": {"not_in": played_word_ids},
            }
        )
    else:
        available_words = await db.word.find_many()

    if not available_words:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No more words available. All words have been played today.",
        )

    # Pick a random word
    selected_word = random.choice(available_words)

    # Create the game
    game = await db.game.create(
        data={
            "userId": user_id,
            "wordId": selected_word.id,
        },
        include={
            "guesses": True,
            "word": True,
        },
    )

    return game


async def submit_guess(user_id: int, guessed_word: str):
    """Submit a guess for the active game."""
    guessed_word = guessed_word.upper().strip()

    # Validate guess format
    if len(guessed_word) != 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Guess must be exactly 5 letters.",
        )

    if not guessed_word.isalpha():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Guess must contain only letters.",
        )

    # Get active game
    game = await get_active_game(user_id)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active game found. Start a new game first.",
        )

    # Check max guesses (5)
    current_attempts = len(game.guesses)
    if current_attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum guesses reached for this game.",
        )

    # Compare the guess with the target word
    target_word = game.word.text.upper()
    result = compare_words(guessed_word, target_word)
    result_json = result_to_json(result)

    # Save the guess
    attempt_number = current_attempts + 1
    guess = await db.guess.create(
        data={
            "gameId": game.id,
            "attempt": attempt_number,
            "word": guessed_word,
            "result": result_json,
        }
    )

    # Check if the user won
    is_correct = guessed_word == target_word
    game_over = is_correct or attempt_number >= 5

    if game_over:
        new_status = "WON" if is_correct else "LOST"
        await db.game.update(
            where={"id": game.id},
            data={
                "status": new_status,
                "completedAt": datetime.utcnow(),
            },
        )

    return {
        "attempt": attempt_number,
        "word": guessed_word,
        "result": result,
        "is_correct": is_correct,
        "game_over": game_over,
        "status": "WON" if is_correct else ("LOST" if game_over else "IN_PROGRESS"),
    }
