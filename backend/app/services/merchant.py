"""Pull a merchant name and a payment reference out of a bank narration."""
import re

# Prefixes banks add before the real name ("NEFT CR-ACME" -> "ACME").
PREFIX = re.compile(r"^(INTL POS|POS|NEFT CR-|NEFT/|IMPS CR-|ACH D-)\s*")
# A trailing code or number ("... CLIENT 3", "...-LN00482") is not part of the name.
TRAILING_CODE = re.compile(r"[-\s]+[A-Z]*\d+$")
REF = re.compile(r"[A-Za-z0-9-]{6,}")


def merchant_of(description):
    """'UPI/SWIGGY/9285415473' -> 'SWIGGY'; 'POS CROMA ELECTRONICS BLR' -> 'CROMA ELECTRONICS BLR'."""
    text = description.upper().strip()
    parts = text.split("/")
    if parts[0] == "UPI" and len(parts) > 1:
        return parts[1].strip()
    return TRAILING_CODE.sub("", PREFIX.sub("", text)).strip()


def ref_of(description):
    """The order/UPI reference: the last '/' segment if it looks like a code, else None."""
    parts = description.split("/")
    if len(parts) > 1 and REF.fullmatch(parts[-1].strip()):
        return parts[-1].strip()
    return None
