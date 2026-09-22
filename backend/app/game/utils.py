import json


def compare_words(guess: str, target: str) -> list[str]:
    """
    Compare guessed word against the target word.
    Returns a list of 5 color strings: "green", "orange", or "grey".

    Algorithm:
    1. First pass: mark exact matches as "green"
    2. Second pass: for remaining letters, check if they exist
       in unmatched positions of the target (mark "orange" or "grey")
    """
    guess = guess.upper()
    target = target.upper()

    result = ["grey"] * 5
    target_chars = list(target)
    guess_chars = list(guess)

    # First pass: find exact matches (green)
    for i in range(5):
        if guess_chars[i] == target_chars[i]:
            result[i] = "green"
            target_chars[i] = None  # Mark as used
            guess_chars[i] = None  # Mark as matched

    # Second pass: find wrong-position matches (orange)
    for i in range(5):
        if guess_chars[i] is not None:
            for j in range(5):
                if target_chars[j] is not None and guess_chars[i] == target_chars[j]:
                    result[i] = "orange"
                    target_chars[j] = None  # Mark as used
                    break

    return result


def result_to_json(result: list[str]) -> str:
    """Convert result list to JSON string for storage."""
    return json.dumps(result)


def json_to_result(result_json: str) -> list[str]:
    """Convert JSON string back to result list."""
    return json.loads(result_json)
