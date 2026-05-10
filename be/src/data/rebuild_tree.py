"""
Reads flat chunks.json and rebuilds it as a proper tree based on section numbering.
Missing parent nodes are created synthetically.
"""
import json
import re
import uuid
from pathlib import Path

PATH = Path(__file__).parent / "chunks.json"


def parse_num(title: str) -> tuple[int, ...] | None:
    """
    Match real section numbers only:
      "2 Linked Lists"   → (2,)       top-level chapter (digit + space + letter)
      "2.1 Singly ..."   → (2, 1)     sub-section (digit.digit + space)
      "2.1.3 Insertion"  → (2, 1, 3)  sub-sub-section

    Reject list items and code snippets:
      "4. All primitive..." → None     (digit + period + space → list item)
      "1) algorithm ..."   → None     (digit + paren → code)
    """
    t = title.strip()
    # Multi-level: "1.2", "1.2.3", ... followed by a space
    m = re.match(r"^(\d+(?:\.\d+)+)(?= )", t)
    if m:
        return tuple(int(x) for x in m.group(1).split("."))
    # Single-level: digit followed by space then a letter (chapter heading)
    m = re.match(r"^(\d+)(?= [A-Za-z])", t)
    if m:
        return (int(m.group(1)),)
    return None


def build_tree(flat: list[dict]) -> list[dict]:
    # Index all numbered chunks; discard unrecognised ones
    numbered: dict[tuple, dict] = {}
    unnumbered: list[dict] = []

    for chunk in flat:
        num = parse_num(chunk["title"])
        chunk["children"] = chunk.get("children") or []
        if num:
            numbered[num] = chunk
        # drop garbage chunks (list items / code snippets parsed as headers)

    # Ensure every required ancestor exists
    all_nums = list(numbered.keys())
    for num in all_nums:
        for depth in range(1, len(num)):
            ancestor = num[:depth]
            if ancestor not in numbered:
                numbered[ancestor] = {
                    "id": str(uuid.uuid4()),
                    "title": ".".join(str(x) for x in ancestor),
                    "content": "",
                    "children": [],
                }

    # Wire children to parents
    for num, chunk in sorted(numbered.items()):
        if len(num) > 1:
            parent_num = num[:-1]
            parent = numbered[parent_num]
            if chunk not in parent["children"]:
                parent["children"].append(chunk)

    # Top-level = depth-1 nodes, sorted by number
    top = [chunk for num, chunk in sorted(numbered.items()) if len(num) == 1]
    return top + unnumbered


flat = json.loads(PATH.read_text(encoding="utf-8"))
tree = build_tree(flat)
PATH.write_text(json.dumps(tree, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Done — {len(tree)} top-level chunks")
for c in tree:
    print(f"  {c['title']} ({len(c['children'])} children)")