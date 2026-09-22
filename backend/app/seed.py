"""
Seed script to populate the database with 20 five-letter uppercase English words.
Run with: python -m app.seed
"""
import asyncio
from app.database import db

WORDS = [
    "AUDIO",
    "HOMER",
    "JOKER",
    "TOWER",
    "CRANE",
    "BLEND",
    "GHOST",
    "FLAME",
    "PRIDE",
    "STORM",
    "BRAVE",
    "CLOUD",
    "DREAM",
    "EARTH",
    "FRUIT",
    "GRAIN",
    "HOUSE",
    "KNIFE",
    "LIGHT",
    "MAGIC",
]


async def seed():
    """Seed the database with initial words."""
    await db.connect()

    print("Seeding words into the database...")

    for word_text in WORDS:
        existing = await db.word.find_unique(where={"text": word_text})
        if not existing:
            await db.word.create(data={"text": word_text})
            print(f"  Added: {word_text}")
        else:
            print(f"  Exists: {word_text}")

    # Create a default admin user if none exists
    admin = await db.user.find_first(where={"role": "ADMIN"})
    if not admin:
        from app.auth.utils import hash_password
        await db.user.create(
            data={
                "username": "Admin",
                "password": hash_password("Admin1$"),
                "role": "ADMIN",
            }
        )
        print("\n  Created default admin user: Admin / Admin1$")

    print("\nSeeding complete!")
    await db.disconnect()


if __name__ == "__main__":
    asyncio.run(seed())
