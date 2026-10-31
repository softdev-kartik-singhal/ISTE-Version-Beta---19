"""Rupee text for sentences the backend writes (flag reasons, insights): '₹1,20,000', matching the frontend."""


def inr(paise):
    """Whole rupees with Indian digit grouping: 12000000 paise -> '₹1,20,000'; negatives get a leading '-'."""
    rupees = round(abs(paise) / 100)
    digits = str(rupees)
    if len(digits) > 3:
        head, tail = digits[:-3], digits[-3:]
        groups = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        digits = ",".join([head, *groups, tail]) if head else ",".join([*groups, tail])
    return f"{'-' if paise < 0 else ''}₹{digits}"
