import uuid
from pathlib import Path
from fastapi import FastAPI, HTTPException, Cookie, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from chunking import extract_text_from_pdf

app = FastAPI()

IMAGES_DIR = Path(__file__).parent / "images"
IMAGES_DIR.mkdir(exist_ok=True)
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

PDF_PATH = Path(__file__).parent / "fastapi.pdf"

sessions: dict[str, dict] = {}


def _stub_chunks() -> list:
    chunk_id = str(uuid.uuid4())
    return [
        {
            "id": chunk_id,
            "title": "Dokument",
            "start": {"page": 1, "height": 0.0},
            "end": {"page": 1, "height": 1.0},
            "children": [],
        }
    ]


class SummaryEvalRequest(BaseModel):
    summary: str


@app.post("/session")
def create_session(response: Response):
    session_id = str(uuid.uuid4())
    doc = extract_text_from_pdf(str(PDF_PATH))
    sessions[session_id] = {
        "doc": doc,
        "chunks": _stub_chunks(),
    }
    response.set_cookie(key="sessionId", value=session_id)
    return {}


@app.get("/chunks")
def get_chunks(sessionId: str = Cookie(default=None)):
    if not sessionId or sessionId not in sessions:
        raise HTTPException(status_code=401, detail="Brak sesji")
    session = sessions[sessionId]
    return {
        "chunks": session["chunks"],
        "full_text": session["doc"]["full_text"],
        "pages": session["doc"]["pages"],
    }


@app.post("/chunk/{chunk_id}/summary-evaluation")
def evaluate_summary(
    chunk_id: str,
    req: SummaryEvalRequest,
    sessionId: str = Cookie(default=None),
):
    if not sessionId or sessionId not in sessions:
        raise HTTPException(status_code=401, detail="Brak sesji")
    chunks = sessions[sessionId]["chunks"]
    all_ids = {c["id"] for c in chunks} | {
        ch["id"] for c in chunks for ch in c.get("children", [])
    }
    if chunk_id not in all_ids:
        raise HTTPException(status_code=404, detail="Nieznany chunk")
    return {}