import pytest
from src.evaluation import evaluate_summary, PASS_THRESHOLD, _DIMENSIONS


# 1. Kompletne, poprawne streszczenie — powinno przejść
def test_good_summary_passes(content):
    summary = (
        "Binary search finds an element in a sorted array by halving the search space "
        "each step: compare to the middle, then recurse left or right. "
        "It runs in O(log n) time and O(1) space, but requires the array to be sorted."
    )
    result = evaluate_summary(content, summary)
    assert result is None, f"Expected None (pass), got feedback: {result}"


# 2. Puste streszczenie — powinno oblać
def test_empty_summary_fails(content):
    result = evaluate_summary(content, "I don't know.")
    assert result is not None
    assert "scores" in result
    avg = sum(result["scores"].values()) / len(result["scores"])
    assert avg < PASS_THRESHOLD


# 3. Streszczenie z błędem faktycznym (zła złożoność) — consistency powinno być niskie
def test_factually_wrong_summary_fails(content):
    summary = (
        "Binary search works on unsorted arrays and has O(n log n) time complexity. "
        "It compares each element one by one until it finds the target."
    )
    result = evaluate_summary(content, summary)
    assert result is not None
    assert result["scores"]["consistency"] <= 2, (
        f"Expected low consistency score, got {result['scores']['consistency']}"
    )


# 4. Kopiuj-wklej oryginału — conciseness powinno być niskie
def test_copy_paste_summary_fails(content):
    result = evaluate_summary(content, content)  # verbatim copy
    assert result is not None
    assert result["scores"]["conciseness"] <= 2, (
        f"Expected low conciseness score, got {result['scores']['conciseness']}"
    )


# 5. Struktura odpowiedzi — wszystkie wymagane pola i wymiary są obecne
def test_feedback_structure(content):
    summary = "It searches."  # zbyt lakoniczne, na pewno obleje
    result = evaluate_summary(content, summary)

    assert result is not None
    assert set(result.keys()) == {"scores", "feedback", "tip"}

    assert set(result["scores"].keys()) == set(_DIMENSIONS.keys())
    for score in result["scores"].values():
        assert 1 <= score <= 5

    assert isinstance(result["feedback"], list)
    assert len(result["feedback"]) == len(_DIMENSIONS)
    for item in result["feedback"]:
        assert {"dimension", "score", "note", "example"} <= set(item.keys())

    assert isinstance(result["tip"], str)
    assert len(result["tip"]) > 0