import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from app.auth.dependencies import require_admin
from app.database import db

router = APIRouter()


@router.get("/reports/daily")
async def daily_report(
    date: str = Query(None, description="Date in YYYY-MM-DD format"),
    user=Depends(require_admin),
):
    """
    Get daily aggregate report.
    Returns: date, total users who played, total correct guesses.
    """
    if date:
        report_date = datetime.strptime(date, "%Y-%m-%d")
    else:
        report_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    day_start = report_date.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)

    # Get all games for the day
    games = await db.game.find_many(
        where={
            "startedAt": {
                "gte": day_start,
                "lt": day_end,
            },
        },
        include={"user": True},
    )

    # Calculate stats
    unique_users = set()
    total_correct = 0
    total_games = len(games)

    for game in games:
        unique_users.add(game.userId)
        if game.status == "WON":
            total_correct += 1

    return {
        "date": day_start.strftime("%Y-%m-%d"),
        "total_users": len(unique_users),
        "total_games": total_games,
        "total_correct_guesses": total_correct,
        "total_incorrect": total_games - total_correct - sum(1 for g in games if g.status == "IN_PROGRESS"),
    }


@router.get("/reports/user/{user_id}")
async def user_report(
    user_id: int,
    date: str = Query(None, description="Date in YYYY-MM-DD format"),
    user=Depends(require_admin),
):
    """
    Get per-user report.
    Returns: date, words tried, number of words tried, correct guesses count.
    """
    if date:
        report_date = datetime.strptime(date, "%Y-%m-%d")
    else:
        report_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    day_start = report_date.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)

    # Get the target user
    target_user = await db.user.find_unique(where={"id": user_id})
    if not target_user:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Get user's games for the day
    games = await db.game.find_many(
        where={
            "userId": user_id,
            "startedAt": {
                "gte": day_start,
                "lt": day_end,
            },
        },
        include={
            "word": True,
            "guesses": {
                "order_by": {"attempt": "asc"},
            },
        },
        order={"startedAt": "asc"},
    )

    words_tried = []
    correct_guesses = 0

    for game in games:
        game_info = {
            "word": game.word.text,
            "status": game.status,
            "attempts": len(game.guesses),
            "guesses": [],
        }

        for guess in game.guesses:
            game_info["guesses"].append({
                "attempt": guess.attempt,
                "word": guess.word,
                "result": json.loads(guess.result),
            })

        if game.status == "WON":
            correct_guesses += 1

        words_tried.append(game_info)

    return {
        "date": day_start.strftime("%Y-%m-%d"),
        "user_id": user_id,
        "username": target_user.username,
        "number_of_words_tried": len(words_tried),
        "correct_guesses": correct_guesses,
        "words_tried": words_tried,
    }


@router.get("/users")
async def list_users(user=Depends(require_admin)):
    """List all users (for admin to select for reports)."""
    users = await db.user.find_many(
        order={"username": "asc"},
    )

    return [
        {
            "id": u.id,
            "username": u.username,
            "role": u.role,
            "created_at": u.createdAt.isoformat(),
        }
        for u in users
    ]
