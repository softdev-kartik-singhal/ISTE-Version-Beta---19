"""A synthetic HDFC-style e-statement (fake person, fake numbers) laid out like the real one:
masked account number, repeated page header, a column table with wrapped narrations (one piece ABOVE its date line),
'0.00' in empty amount cells, footers, and the STATEMENT SUMMARY on the last page. No real statement is used."""
from tests.make_pdf import make_positioned_pdf

X = {"date": 30, "narration": 80, "ref": 280, "value_date": 345, "withdrawal": 400, "deposit": 465, "balance": 530}


def page_header(page_no, columns=True):
    lines = ["HDFC BANK Ltd.", f"Page No .: {page_no}", "MR TEST PERSON", "12 FAKE STREET, TESTVILLE",
             "JOINT HOLDERS :", "Account Branch : TESTVILLE", "A/C Open Date : 01/01/2020", "Account Status : Regular",
             "Statement From : 19/09/26 TO : 18/10/26", "Account number : 50XXXXXXXX9661"]
    items = [(30, 30 + 12 * i, t) for i, t in enumerate(lines)]
    header_y = 30 + 12 * len(lines) + 10
    if not columns:  # like the real statement: later pages have no column header; rows start where it was
        return items, header_y
    items += [(X["date"], header_y, "Date"), (X["narration"], header_y, "Narration"), (X["ref"], header_y, "Chq./Ref No."),
              (X["value_date"], header_y, "Value Dt"), (X["withdrawal"], header_y, "Withdrawal Amt."),
              (X["deposit"], header_y, "Deposit Amt."), (X["balance"], header_y, "Closing Balance*")]
    return items, header_y + 20


def row(y, date, narration_lines, ref, withdrawal, deposit, balance, above=()):
    """One transaction: `above` narration lines sit over the date line, the rest start on it and wrap below."""
    items = [(X["narration"], y - 10 * (len(above) - i), t) for i, t in enumerate(above)]
    items += [(X["date"], y, date), (X["ref"], y, ref), (X["value_date"], y, date),
              (X["withdrawal"] + 5, y, withdrawal), (X["deposit"] + 5, y, deposit), (X["balance"] + 5, y, balance)]
    items += [(X["narration"], y + 10 * i, t) for i, t in enumerate(narration_lines)]
    return items


FOOTER = ["*Closing balance includes funds earmarked for hold and uncleared funds",
          "Contents of this statement will be considered correct if no error is reported within 30 days of receipt.",
          "State account branch GSTN: 00FAKE0000F0Z0", "HDFC Bank GSTIN number details are available at the bank website.",
          "Generation Date : 18/10/26"]


def footer(start):
    return [(30, start + 12 * i, t) for i, t in enumerate(FOOTER)]


SUMMARY = ["STATEMENT SUMMARY :-", "Opening Balance Dr Count Cr Count Debits Credits Closing Balance",
           "10,000.00 3 2 6,750.50 51,500.00 54,749.50"]


def build(summary=SUMMARY, last_balance="54,749.50", drop_last_row=False):
    p1, y = page_header(1)
    # Row 1: narration wraps mid-token (line ends in '-'), so it is joined with no space.
    p1 += row(y, "19/09/26", ["UPI-FAKE GROCER-fakegrocer@okbank-", "BANK0000001-123456789012-GROCERIES"],
              "0000123456789012", "1,250.50", "0.00", "8,749.50")
    # Row 2: part of the narration is printed ABOVE the date line.
    p1 += row(y + 35, "21/09/26", ["PVT LTD-SALARY"], "NEFT0000000001", "0.00", "50,000.00", "58,749.50",
              above=["NEFT CR-ACME SOFTWARE"])
    p1 += row(y + 60, "25/09/26", ["ATW-512345XXXXXX1234-S1ANBG12-", "MG ROAD"], "0000000000000000", "2,000.00", "0.00", "56,749.50")
    p1 += footer(y + 100)

    p2, y = page_header(2, columns=False)
    # Row 4: an ordinary word wrap (no joiner at the end), so a space is added.
    p2 += row(y, "02/10/26", ["POS 4123XXXXXXXX9999", "FAKE MART"], "0000000000000000", "3,500.00", "0.00", "53,249.50")
    # Row 5 (below): a full 40-character line cut mid-word, the way HDFC wraps, so no space is added.
    if not drop_last_row:
        p2 += row(y + 35, "10/10/26", ["IMPS-123456-FRIEND NAME-REFUND FOR DINNE", "R"], "123456", "0.00", "1,500.00", last_balance)
    p2 += [(30, y + 70 + 12 * i, t) for i, t in enumerate(summary)]
    p2 += [(30, y + 120, "**END OF STATEMENT**")] + footer(y + 135)
    return make_positioned_pdf([p1, p2])
