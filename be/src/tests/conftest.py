import pytest

CONTENT = """
## Binary Search

Binary search is an efficient algorithm for finding an element in a sorted array.
It works by repeatedly halving the search space:

1. Compare the target value to the middle element.
2. If equal, return the index.
3. If the target is smaller, search the left half.
4. If the target is larger, search the right half.

Time complexity: O(log n). Space complexity: O(1) for the iterative version.
Binary search requires the array to be sorted beforehand — applying it to an
unsorted array produces incorrect results.
"""


@pytest.fixture
def content():
    return CONTENT.strip()