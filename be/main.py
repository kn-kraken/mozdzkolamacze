import uuid
from pathlib import Path
from fastapi import FastAPI, HTTPException, Cookie, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from chunking import extract_markdown, build_chunks

app = FastAPI()

IMAGES_DIR = Path(__file__).parent / "images"
IMAGES_DIR.mkdir(exist_ok=True)
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

PDF_PATH = Path(__file__).parent / "dsa.pdf"

sessions: dict[str, dict] = {}


class SummaryEvalRequest(BaseModel):
    summary: str


@app.post("/session")
def create_session(response: Response):
    session_id = str(uuid.uuid4())
    print(f"[session] Extracting markdown from {PDF_PATH}...")
    md = extract_markdown(str(PDF_PATH))
    print(f"[session] Markdown length: {len(md)} chars")
    chunks = build_chunks(md)
    print(f"[session] Built {len(chunks)} top-level chunks")
    sessions[session_id] = {"chunks": chunks}
    response.set_cookie(key="sessionId", value=session_id)
    return {"session_id": session_id, "chunks": len(chunks)}


@app.get("/chunks")
def get_chunks(sessionId: str = Cookie(default=None), session_id: str = None):
    sid = sessionId or session_id
    if not sid or sid not in sessions:
        raise HTTPException(status_code=401, detail="Brak sesji")
    return sessions[sid]["chunks"]


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