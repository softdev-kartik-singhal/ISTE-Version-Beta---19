"""Pull a merchant name and a payment reference out of a bank narration."""
import re

# Prefixes banks add before the real name ("NEFT CR-ACME" -> "ACME").
PREFIX = re.compile(r"^(INTL POS|POS|NEFT CR-|NEFT/|IMPS CR-|ACH D-)\s*")
# A trailing code or number ("... CLIENT 3", "...-LN00482") is not part of the name.
TRAILING_CODE = re.compile(r"[-\s]+[A-Z]*\d+$")
REF = re.compile(r"[A-Za-z0-9-]{6,}")


# A masked card number a bank puts after "POS" ("POS 4123XXXXXXXX9999 FAKE MART"): not part of the name.
CARD_NUMBER = re.compile(r"^[0-9X*]{8,}\s+")


def upi_name(text):
    """HDFC statements write UPI payments as 'UPI-NAME-VPA@BANK-IFSC-REFERENCE-NOTE'. The name is the first part; a name
    has spaces ('SUNIL KUMAR SINGHAL') while the payment address, bank code and reference never do, so take parts from
    the start while they still look like a name. 'UPI-GOOGLE INDIA DIGITAL-GOOG-PAYMENTS@AXISBANK-...' -> 'GOOGLE INDIA DIGITAL'."""
    parts = text[len("UPI-"):].split("-")
    name = [parts[0]]
    for part in parts[1:]:
        if " " not in part.strip():
            break
        name.append(part)
    return "-".join(name).strip()


def merchant_of(description):
    """'UPI/SWIGGY/9285415473' -> 'SWIGGY'; 'UPI-SUNIL KUMAR-9876@PTYES-UTIB000-6150-SENT' -> 'SUNIL KUMAR';
    'POS CROMA ELECTRONICS BLR' -> 'CROMA ELECTRONICS BLR'."""
    text = description.upper().strip()
    parts = text.split("/")
    if parts[0] == "UPI" and len(parts) > 1:
        return parts[1].strip()
    if text.startswith("UPI-") and "@" in text:
        return upi_name(text)
    return TRAILING_CODE.sub("", CARD_NUMBER.sub("", PREFIX.sub("", text))).strip()


def ref_of(description):
    """The order/UPI reference: the last '/' segment if it looks like a code, else None."""
    parts = description.split("/")
    if len(parts) > 1 and REF.fullmatch(parts[-1].strip()):
        return parts[-1].strip()
    return None
