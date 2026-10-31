"""Statement endpoints: upload a file, load the demo data, list what has been imported."""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.config import DEMO_DIR, MAX_UPLOAD_BYTES
from app.db import get_conn
from app.deps import current_user_id
from app.services.ingest import FileAlreadyUploaded, clear_statements, has_statements, ingest
from app.services.parser import StatementRejected
from app.services.recurring import refresh_recurring
from app.services.transfers import match_transfers
from app.services.summary import statements_payload

router = APIRouter(prefix="/api")

DEMO_SETS = ("eight_months", "eight_months_complete", "short_2mo")


@router.post("/upload")
async def upload(file: UploadFile = File(...), conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    """Import one CSV/PDF statement. 422 = unreadable/unsupported, 409 = same file seen before."""
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, {"reason": f"File is larger than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB."})
    try:
        return ingest(conn, user_id, file.filename or "", data)
    except FileAlreadyUploaded as e:
        raise HTTPException(409, {"reason": str(e)})
    except StatementRejected as e:
        raise HTTPException(422, {"reason": str(e)})


@router.post("/demo-data")
def load_demo_data(set: str = "eight_months", replace: bool = False, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    """Import the bundled demo CSVs. Never adds on top of existing statements: if the user has any,
    409 HAS_STATEMENTS is returned unless replace=true, which clears them first."""
    if set not in DEMO_SETS:
        raise HTTPException(422, {"reason": f"Unknown demo set. Choose one of: {', '.join(DEMO_SETS)}."})
    if has_statements(conn, user_id):
        if not replace:
            raise HTTPException(409, {"reason": "You already have statements. Replace them with the demo data?", "code": "HAS_STATEMENTS"})
        clear_statements(conn, user_id)
        conn.commit()
    results = []
    for path in sorted((DEMO_DIR / set).glob("*.csv")):
        try:
            results.append({"file": path.name, "status": "imported", **ingest(conn, user_id, path.name, path.read_bytes())})
        except FileAlreadyUploaded:
            results.append({"file": path.name, "status": "already uploaded"})
    return {"set": set, "replaced": replace, "files": results}


@router.delete("/statements/{file_id}")
def delete_statement(file_id: int, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    """Remove one imported file and the transactions it brought in; transfers and recurring are recomputed."""
    if not conn.execute("SELECT 1 FROM uploaded_files WHERE id = ? AND user_id = ?", (file_id, user_id)).fetchone():
        raise HTTPException(404, {"reason": "Statement not found."})
    conn.execute("DELETE FROM transactions WHERE file_id = ?", (file_id,))
    conn.execute("DELETE FROM uploaded_files WHERE id = ?", (file_id,))
    conn.execute("UPDATE transactions SET kind = 'normal' WHERE kind = 'transfer' AND account_id IN"
                 " (SELECT id FROM accounts WHERE user_id = ?)", (user_id,))  # pairs may have lost a side: match again
    match_transfers(conn, user_id)
    refresh_recurring(conn, user_id)
    conn.commit()
    return statements_payload(conn, user_id)


@router.get("/statements")
def get_statements(conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    return statements_payload(conn, user_id)
