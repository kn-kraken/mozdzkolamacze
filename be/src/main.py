import json
import uuid
from pathlib import Path
from fastapi import FastAPI, HTTPException, Cookie, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from src.chunking import extract_markdown, build_chunks
from src.evaluation import evaluate_summary

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

PDF_PATH = Path(__file__).parent / "data/dsa.pdf"
CHUNKS_CACHE = Path(__file__).parent / "data/chunks.json"

sessions: dict[str, dict] = {}


class SummaryEvalRequest(BaseModel):
    summary: str


def _find_chunk(chunks: list, chunk_id: str) -> dict | None:
    for c in chunks:
        if c["id"] == chunk_id:
            return c
        found = _find_chunk(c.get("children", []), chunk_id)
        if found:
            return found
    return None


def _load_chunks() -> list:
    if CHUNKS_CACHE.exists():
        print("[session] Loading chunks from chunks.json cache")
        return json.loads(CHUNKS_CACHE.read_text(encoding='utf-8')) 
    
    print(f"[session] Extracting markdown from {PDF_PATH}...")
    md = extract_markdown(str(PDF_PATH))
    
    print(f"[session] Markdown length: {len(md)} chars, building chunks...")
    chunks = build_chunks(md)
    
    CHUNKS_CACHE.write_text(json.dumps(chunks, ensure_ascii=False, indent=2), encoding='utf-8')
    
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
    def strip_content(items):
        return [
            {
                "id": c["id"],
                "title": c["title"],
                "children": strip_content(c.get("children", [])),
            }
            for c in items
        ]
    return strip_content(chunks)


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
    feedback = evaluate_summary(chunk["content"], req.summary)
    if feedback:
        raise HTTPException(status_code=400, detail=feedback)
    return {}