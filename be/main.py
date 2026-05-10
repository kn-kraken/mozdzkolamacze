import json
import uuid
from pathlib import Path
from fastapi import FastAPI, HTTPException, Cookie, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from chunking import extract_markdown, build_chunks, evaluate_summary

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IMAGES_DIR = Path(__file__).parent / "images"
IMAGES_DIR.mkdir(exist_ok=True)
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

PDF_PATH = Path(__file__).parent / "dsa.pdf"
CHUNKS_CACHE = Path(__file__).parent / "chunks.json"

sessions: dict[str, dict] = {}


class SummaryEvalRequest(BaseModel):
    summary: str


def _find_chunk(chunks: list, chunk_id: str) -> dict | None:
    for c in chunks:
        if c["id"] == chunk_id:
            return c
        for ch in c.get("children", []):
            if ch["id"] == chunk_id:
                return ch
    return None


def _load_chunks() -> list:
    if CHUNKS_CACHE.exists():
        print("[session] Loading chunks from chunks.json cache")
        return json.loads(CHUNKS_CACHE.read_text())
    print(f"[session] Extracting markdown from {PDF_PATH}...")
    md = extract_markdown(str(PDF_PATH))
    print(f"[session] Markdown length: {len(md)} chars, building chunks...")
    chunks = build_chunks(md)
    CHUNKS_CACHE.write_text(json.dumps(chunks, ensure_ascii=False, indent=2))
    print(f"[session] Built {len(chunks)} chunks, saved to chunks.json")
    return chunks


@app.post("/session")
def create_session(response: Response):
    session_id = str(uuid.uuid4())
    chunks = _load_chunks()
    sessions[session_id] = {"chunks": chunks}
    response.set_cookie(key="sessionId", value=session_id)
    return {"session_id": session_id, "chunks": len(chunks)}


@app.get("/chunks")
def get_chunks(sessionId: str = Cookie(default=None), session_id: str = None):
    sid = sessionId or session_id
    if not sid or sid not in sessions:
        raise HTTPException(status_code=401, detail="Brak sesji")
    chunks = sessions[sid]["chunks"]
    return [
        {
            "id": c["id"],
            "title": c["title"],
            "children": [{"id": ch["id"], "title": ch["title"]} for ch in c["children"]],
        }
        for c in chunks
    ]


@app.get("/chunk/{chunk_id}")
def get_chunk(chunk_id: str, sessionId: str = Cookie(default=None), session_id: str = None):
    sid = sessionId or session_id
    if not sid or sid not in sessions:
        raise HTTPException(status_code=401, detail="Brak sesji")
    chunk = _find_chunk(sessions[sid]["chunks"], chunk_id)
    if not chunk:
        raise HTTPException(status_code=404, detail="Nieznany chunk")
    return Response(content=chunk["content"], media_type="text/markdown")


@app.post("/chunk/{chunk_id}/summary-evaluation")
def eval_summary(
    chunk_id: str,
    req: SummaryEvalRequest,
    sessionId: str = Cookie(default=None),
    session_id: str = None,
):
    sid = sessionId or session_id
    if not sid or sid not in sessions:
        raise HTTPException(status_code=401, detail="Brak sesji")
    chunk = _find_chunk(sessions[sid]["chunks"], chunk_id)
    if not chunk:
        raise HTTPException(status_code=404, detail="Nieznany chunk")
    hint = evaluate_summary(chunk["content"], req.summary)
    if hint:
        raise HTTPException(status_code=400, detail={"hint": hint})
    return {}
