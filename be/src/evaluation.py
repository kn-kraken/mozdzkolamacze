import json
import os

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

PASS_THRESHOLD = 3.5

_DIMENSIONS = {
    "consistency": {
        "name": "Consistency (zgodność faktyczna)",
        "definition": "Does the summary contain only information present in the original? No hallucinations, distortions, or invented facts?",
        "scale": (
            "1 = Significant factual errors or information absent from the original\n"
            "2 = Some inaccuracies or unsupported claims\n"
            "3 = Mostly accurate, minor imprecisions\n"
            "4 = Accurate, only trivial issues\n"
            "5 = Perfectly consistent with the original"
        ),
    },
    "relevance": {
        "name": "Relevance (trafność doboru)",
        "definition": "Did the student select the most important information, not marginal details?",
        "scale": (
            "1 = Covers only peripheral details, misses the main point\n"
            "2 = Covers some key points but omits most important ones\n"
            "3 = Covers the main point but misses some important aspects\n"
            "4 = Covers most key points with minor omissions\n"
            "5 = Perfectly captures the essential content"
        ),
    },
    "coherence": {
        "name": "Coherence (spójność)",
        "definition": "Does the summary read as a logical whole? Do sentences connect meaningfully?",
        "scale": (
            "1 = Disjointed, hard to follow\n"
            "2 = Some logical flow but significant gaps\n"
            "3 = Mostly coherent with some awkward transitions\n"
            "4 = Well-structured with minor flow issues\n"
            "5 = Perfectly coherent and well-organized"
        ),
    },
    "fluency": {
        "name": "Fluency (płynność językowa)",
        "definition": "Is the summary grammatically correct, well-written, and easy to read?",
        "scale": (
            "1 = Serious grammar or syntax errors\n"
            "2 = Noticeable errors that impede reading\n"
            "3 = Understandable but with some errors\n"
            "4 = Well-written with minor issues\n"
            "5 = Fluent, grammatically correct, clear"
        ),
    },
    "conciseness": {
        "name": "Conciseness (zwięzłość)",
        "definition": "Is the summary actually shorter and denser than the original? Does the student paraphrase in their own words rather than copy phrases?",
        "scale": (
            "1 = Largely copied from the original, no compression\n"
            "2 = Mostly copied with minor edits\n"
            "3 = Mix of paraphrase and copying\n"
            "4 = Mostly paraphrased, some borrowed phrases\n"
            "5 = Fully paraphrased in student's own words, well-compressed"
        ),
    },
}

_DIM_PROMPT = """You are evaluating one dimension of a student's summary of a technical book section.

DIMENSION: {name}
Definition: {definition}

Scale:
{scale}

Original section:
---
{content}
---

Student's summary:
---
{summary}
---

Instructions:
1. Reason through this dimension step by step (2-4 sentences).
2. Cite a specific phrase from the student's summary that best illustrates your assessment (or null if none).
3. Give your score (integer 1-5).
4. Write a one-sentence feedback note in the same language as the student's summary.

Respond ONLY in this JSON format:
{{
  "reasoning": "...",
  "example": "quoted phrase or null",
  "score": N,
  "feedback": "..."
}}"""

_TIP_PROMPT = """Based on these evaluation results for a student's summary, write ONE short actionable improvement tip (1-2 sentences) in the same language as the student's summary.

Scores: {scores}
Feedback notes: {feedbacks}

Tip:"""


def _llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_KEY"),
    )


def _eval_dimension(dim_key: str, content: str, summary: str) -> dict:
    dim = _DIMENSIONS[dim_key]
    prompt = _DIM_PROMPT.format(
        name=dim["name"],
        definition=dim["definition"],
        scale=dim["scale"],
        content=content[:4000],
        summary=summary,
    )
    response = _llm().invoke([HumanMessage(content=prompt)])
    raw = response.content.strip()
    # strip markdown fences if model wraps in ```json
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def evaluate_summary(chunk_content: str, summary: str) -> dict | None:
    """
    Returns None if the summary passes, or a structured feedback dict if it fails.
    """
    results = {}
    for dim_key in _DIMENSIONS:
        results[dim_key] = _eval_dimension(dim_key, chunk_content, summary)

    scores = {k: v["score"] for k, v in results.items()}
    avg = sum(scores.values()) / len(scores)

    if avg >= PASS_THRESHOLD:
        return None

    feedbacks = {k: v["feedback"] for k, v in results.items()}
    tip_response = _llm().invoke([
        HumanMessage(content=_TIP_PROMPT.format(
            scores=scores,
            feedbacks=feedbacks,
        ))
    ])

    return {
        "scores": scores,
        "feedback": [
            {
                "dimension": _DIMENSIONS[k]["name"],
                "score": v["score"],
                "note": v["feedback"],
                "example": v["example"],
            }
            for k, v in results.items()
        ],
        "tip": tip_response.content.strip(),
    }