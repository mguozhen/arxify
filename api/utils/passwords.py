"""Password hashing — pbkdf2-sha256 via stdlib (no external dep)."""
from __future__ import annotations

import hashlib
import hmac
import secrets


ITERATIONS = 240_000   # OWASP 2024 recommendation for PBKDF2-SHA256


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    """Return (hash_hex, salt_hex). Generates fresh salt if not provided."""
    if salt is None:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        ITERATIONS,
    )
    return dk.hex(), salt


def verify_password(password: str, stored_hash: str, stored_salt: str) -> bool:
    if not stored_hash or not stored_salt:
        return False
    computed, _ = hash_password(password, stored_salt)
    return hmac.compare_digest(computed, stored_hash)
