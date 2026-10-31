"""Sample statements must never mix with a user's own: the sample HDFC/Kotak accounts share their last 4 digits with a
real account, so the two sets overlap without matching row for row and every salary would be counted twice."""
import hashlib

from app import config
from app.db import connect, init_db

OWN_CSV = (b"Account No,50100123451234\n"
           b"Date,Narration,Withdrawal Amt,Deposit Amt,Closing Balance\n"
           b"01/09/2026,NEFT CR-MY OWN EMPLOYER-SALARY,,50000.00,150000.00\n"
           b"03/09/2026,UPI/RENT/MY LANDLORD,20000.00,,130000.00\n"
           b"05/09/2026,POS NETFLIX.COM,649.00,,129351.00\n")


def upload(client, data=OWN_CSV, name="mine.csv"):
    return client.post("/api/upload", files={"file": (name, data, "text/csv")})


def files(client):
    return [f["name"] for f in client.get("/api/statements").json()["files"]]


def test_uploading_your_own_file_removes_the_sample_statements_first(complete):
    assert len(files(complete)) == 3                                   # the sample statements are loaded
    r = upload(complete)
    assert r.status_code == 200 and r.json()["demoRemoved"] == 3
    assert files(complete) == ["mine.csv"]
    assert complete.get("/api/transactions").json()["total"] == 3      # nothing of the sample data is left
    accounts = [a for a in complete.get("/api/session").json()["accountList"] if a["type"] != "cash"]
    assert [a["last4"] for a in accounts] == ["1234"]                  # the sample Kotak account went with it


def test_the_users_own_rows_are_not_swallowed_as_duplicates_of_sample_rows(complete):
    r = upload(complete).json()
    assert r["newRows"] == 3 and r["duplicateRows"] == 0


def test_an_unreadable_upload_leaves_the_sample_data_alone(complete):
    r = upload(complete, b"not a statement at all", "junk.csv")
    assert r.status_code == 422
    assert len(files(complete)) == 3 and complete.get("/api/transactions").json()["total"] > 100


def test_nothing_is_removed_when_there_is_no_sample_data(client):
    assert upload(client).json()["demoRemoved"] == 0
    assert upload(client, OWN_CSV.replace(b"50100123451234", b"50100123459999"), "other.csv").json()["demoRemoved"] == 0
    assert sorted(files(client)) == ["mine.csv", "other.csv"]          # two of the user's own files stay together


def test_the_shared_demo_account_keeps_its_sample_data(anon):
    token = anon.post("/api/auth/demo").json()["token"]
    anon.headers["Authorization"] = f"Bearer {token}"
    before = len(files(anon))
    assert before > 0 and upload(anon).json()["demoRemoved"] == 0
    assert len(files(anon)) == before + 1


def test_sample_files_loaded_before_the_flag_existed_are_recognised(complete, db_path):
    with connect(db_path) as conn:
        conn.execute("UPDATE uploaded_files SET is_demo = 0")          # how an older database looks
        conn.commit()
        init_db(conn)                                                   # the migration runs on startup
        flagged = conn.execute("SELECT COUNT(*) AS n FROM uploaded_files WHERE is_demo = 1").fetchone()["n"]
    assert flagged == 3


def test_a_users_file_with_a_sample_files_name_is_not_treated_as_sample(client, db_path):
    upload(client, OWN_CSV, "bank_a_feb_jul.csv")                       # same name, different content
    with connect(db_path) as conn:
        init_db(conn)
        assert conn.execute("SELECT is_demo FROM uploaded_files").fetchone()["is_demo"] == 0
    assert upload(client, OWN_CSV.replace(b"649.00", b"700.00"), "second.csv").json()["demoRemoved"] == 0


def test_a_file_that_only_continues_the_sample_account_keeps_the_samples(complete):
    october = OWN_CSV.replace(b"01/09/2026", b"01/10/2026").replace(b"03/09/2026", b"03/10/2026").replace(b"05/09/2026", b"05/10/2026")
    r = upload(complete, october, "october.csv").json()
    assert r["demoRemoved"] == 0 and len(files(complete)) == 4          # "Upload October" adds to the sample data
