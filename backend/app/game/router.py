import json
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.auth.dependencies import get_current_user
from app.database import db
from app.game.service import start_new_game, submit_guess, get_active_game, get_today_games_count

router = APIRouter()


class GuessRequest(BaseModel):
    word: str


class GuessResponse(BaseModel):
    attempt: int
    word: str
    result: list[str]
    is_correct: bool
    game_over: bool
    status: str


@router.post("/start")
async def start_game(user=Depends(get_current_user)):
    """Start a new guessing game."""
    game = await start_new_game(user.id)
    return {
        "game_id": game.id,
        "message": "Game started! Guess the 5-letter word.",
        "attempts_remaining": 5,
    }


@router.post("/guess", response_model=GuessResponse)
async def make_guess(request: GuessRequest, user=Depends(get_current_user)):
    """Submit a guess for the current game."""
    result = await submit_guess(user.id, request.word)
    return GuessResponse(**result)


@router.get("/status")
async def game_status(user=Depends(get_current_user)):
    """Get the current game status and all guesses."""
    game = await get_active_game(user.id)

    if not game:
        today_count = await get_today_games_count(user.id)
        return {
            "has_active_game": False,
            "games_played_today": today_count,
            "games_remaining_today": max(0, 3 - today_count),
        }

    guesses = []
    for g in game.guesses:
        guesses.append({
            "attempt": g.attempt,
            "word": g.word,
            "result": json.loads(g.result),
        })

    return {
        "has_active_game": True,
        "game_id": game.id,
        "status": game.status,
        "attempts_used": len(game.guesses),
        "attempts_remaining": 5 - len(game.guesses),
        "guesses": guesses,
    }


@router.get("/history")
async def game_history(user=Depends(get_current_user)):
    """Get the user's game history for today."""
    from datetime import datetime, timedelta

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    games = await db.game.find_many(
        where={
            "userId": user.id,
            "startedAt": {
                "gte": today_start,
                "lt": today_end,
            },
        },
        include={
            "guesses": {
                "order_by": {"attempt": "asc"},
            },
            "word": True,
        },
        order={"startedAt": "desc"},
    )

    history = []
    for game in games:
        guesses = []
        for g in game.guesses:
            guesses.append({
                "attempt": g.attempt,
                "word": g.word,
                "result": json.loads(g.result),
            })

        history.append({
            "game_id": game.id,
            "status": game.status,
            "word": game.word.text if game.status != "IN_PROGRESS" else "???",
            "attempts": len(game.guesses),
            "guesses": guesses,
            "started_at": game.startedAt.isoformat(),
            "completed_at": game.completedAt.isoformat() if game.completedAt else None,
        })

    return {
        "games_today": len(history),
        "games_remaining": max(0, 3 - len(history)),
        "history": history,
    }
