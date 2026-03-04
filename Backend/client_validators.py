import re

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_REGEX = re.compile(r"^\d{1,15}$")  # up to 15 digits

def is_valid_email(email: str) -> bool:
    if not email:
        return True
    return bool(EMAIL_REGEX.match(email))

def is_valid_phone(phone: str) -> bool:
    if not phone:
        return True
    return bool(PHONE_REGEX.match(phone))
