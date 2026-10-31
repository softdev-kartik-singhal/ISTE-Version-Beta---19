"""Statement endpoints: upload a file, load the demo data, list what has been imported."""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.config import DEMO_DIR, MAX_UPLOAD_BYTES
from app.db import get_conn
from app.services.ingest import FileAlreadyUploaded, default_user_id, ingest
from app.services.parser import StatementRejected
from app.services.summary import statements_payload

router = APIRouter(prefix="/api")

DEMO_SETS = ("eight_months", "eight_months_complete", "short_2mo")


@router.post("/upload")
async def upload(file: UploadFile = File(...), conn=Depends(get_conn)):
    """Import one CSV/PDF statement. 422 = unreadable/unsupported, 409 = same file seen before."""
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, {"reason": f"File is larger than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB."})
    try:
        return ingest(conn, default_user_id(conn), file.filename or "", data)
    except FileAlreadyUploaded as e:
        raise HTTPException(409, {"reason": str(e)})
    except StatementRejected as e:
        raise HTTPException(422, {"reason": str(e)})


@router.post("/demo-data")
def load_demo_data(set: str = "eight_months", conn=Depends(get_conn)):
    """Import the bundled demo CSVs. Re-running reports each file as already uploaded."""
    if set not in DEMO_SETS:
        raise HTTPException(422, {"reason": f"Unknown demo set. Choose one of: {', '.join(DEMO_SETS)}."})
    user_id, results = default_user_id(conn), []
    for path in sorted((DEMO_DIR / set).glob("*.csv")):
        try:
            results.append({"file": path.name, "status": "imported", **ingest(conn, user_id, path.name, path.read_bytes())})
        except FileAlreadyUploaded:
            results.append({"file": path.name, "status": "already uploaded"})
    return {"set": set, "files": results}


@router.get("/statements")
def get_statements(conn=Depends(get_conn)):
    return statements_payload(conn, default_user_id(conn))
