"""Build a minimal one-page text PDF for tests (no PDF-writing library needed)."""


def make_pdf(lines):
    esc = lambda s: s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    body = "BT /F1 10 Tf 40 780 Td 14 TL\n" + "\n".join(f"({esc(l)}) Tj T*" for l in lines) + "\nET"
    objects = [
        "<</Type/Catalog/Pages 2 0 R>>",
        "<</Type/Pages/Kids[3 0 R]/Count 1>>",
        "<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>",
        f"<</Length {len(body)}>>\nstream\n{body}\nendstream",
        "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
    ]
    out, offsets = "%PDF-1.4\n", []
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n{obj}\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    out += "".join(f"{o:010d} 00000 n \n" for o in offsets)
    out += f"trailer\n<</Size {len(objects) + 1}/Root 1 0 R>>\nstartxref\n{xref}\n%%EOF\n"
    return out.encode("latin-1")


def make_positioned_pdf(pages, size=(612, 792), font_size=8):
    """A multi-page PDF where every text piece sits at an exact spot: pages = [[(x, y_from_top, text), ...], ...].
    Lets tests mimic a real bank table (columns by x, wrapped lines by y) without any real statement."""
    esc = lambda s: s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    width, height = size
    n = len(pages)
    page_ids = [3 + 2 * i for i in range(n)]
    font_id = 3 + 2 * n
    objects = {1: "<</Type/Catalog/Pages 2 0 R>>",
               2: f"<</Type/Pages/Kids[{' '.join(f'{p} 0 R' for p in page_ids)}]/Count {n}>>",
               font_id: "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>"}
    for pid, items in zip(page_ids, pages):
        body = "\n".join(f"BT /F1 {font_size} Tf {x} {height - y} Td ({esc(t)}) Tj ET" for x, y, t in items)
        objects[pid] = (f"<</Type/Page/Parent 2 0 R/MediaBox[0 0 {width} {height}]/Contents {pid + 1} 0 R"
                        f"/Resources<</Font<</F1 {font_id} 0 R>>>>>>")
        objects[pid + 1] = f"<</Length {len(body)}>>\nstream\n{body}\nendstream"
    out, offsets = "%PDF-1.4\n", []
    for i in range(1, font_id + 1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n{objects[i]}\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {font_id + 1}\n0000000000 65535 f \n" + "".join(f"{o:010d} 00000 n \n" for o in offsets)
    out += f"trailer\n<</Size {font_id + 1}/Root 1 0 R>>\nstartxref\n{xref}\n%%EOF\n"
    return out.encode("latin-1")
