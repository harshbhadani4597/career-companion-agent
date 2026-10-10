import time
import uuid
import random
import base64
from typing import Dict, Tuple, Optional

# Alphanumeric characters excluding easily confused characters (0/O, 1/l/I)
SAFE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

# In-memory store: captcha_id -> { "answer": str, "expires_at": float }
_CAPTCHA_STORE: Dict[str, Dict] = {}

# Simple IP rate limiting: ip -> [timestamp, ...]
_RATE_LIMIT_STORE: Dict[str, list] = {}

def clean_expired_captchas():
    """Removes captchas that have exceeded their 5-minute lifespan."""
    now = time.time()
    expired = [cid for cid, item in _CAPTCHA_STORE.items() if item["expires_at"] < now]
    for cid in expired:
        _CAPTCHA_STORE.pop(cid, None)

def generate_svg_captcha_markup(text: str, width: int = 190, height: int = 54) -> str:
    """
    Generates a secure, noise-distorted SVG CAPTCHA image on the server.
    Includes background distortion, bezier noise curves, random dots, and character rotations.
    """
    chars = list(text)
    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="Security CAPTCHA challenge">'
    ]
    # Background
    svg.append(f'<rect width="100%" height="100%" fill="#1e293b" rx="8" />')

    # Background grid lines
    for gx in range(15, width, 25):
        svg.append(f'<line x1="{gx}" y1="0" x2="{gx}" y2="{height}" stroke="rgba(51, 65, 85, 0.4)" stroke-width="1" />')

    # Curved noise lines (bezier curves)
    colors = ["#6366f1", "#818cf8", "#38bdf8", "#ec4899", "#f59e0b"]
    for _ in range(5):
        x1, y1 = random.randint(0, width), random.randint(0, height)
        x2, y2 = random.randint(0, width), random.randint(0, height)
        cx, cy = random.randint(0, width), random.randint(0, height)
        color = random.choice(colors)
        svg.append(f'<path d="M{x1},{y1} Q{cx},{cy} {x2},{y2}" stroke="{color}" stroke-opacity="0.5" stroke-width="2" fill="none" />')

    # Random noise dots
    for _ in range(50):
        rx, ry = random.randint(2, width - 2), random.randint(2, height - 2)
        r = random.uniform(1.0, 2.2)
        svg.append(f'<circle cx="{rx}" cy="{ry}" r="{r:.1f}" fill="rgba(148, 163, 184, 0.4)" />')

    # Distorted and rotated characters
    char_slot_width = (width - 20) / len(chars)
    text_colors = ["#f8fafc", "#e2e8f0", "#93c5fd", "#c4b5fd", "#fed7aa"]
    
    for i, char in enumerate(chars):
        cx = 16 + (i * char_slot_width) + random.uniform(-2, 3)
        cy = random.uniform(34, 40)
        rotation = random.uniform(-22, 22)
        font_size = random.randint(24, 28)
        color = random.choice(text_colors)
        
        # Add character with transform rotation around its coordinate
        svg.append(
            f'<text x="{cx:.1f}" y="{cy:.1f}" '
            f'font-family="monospace, Courier New, sans-serif" '
            f'font-size="{font_size}" font-weight="bold" '
            f'fill="{color}" '
            f'transform="rotate({rotation:.1f}, {cx + 6:.1f}, {cy - 8:.1f})" '
            f'filter="drop-shadow(1px 1px 1px rgba(0,0,0,0.5))">'
            f'{char}</text>'
        )

    svg.append('</svg>')
    return ''.join(svg)

def create_captcha(length: int = 6, ttl_seconds: int = 180) -> Tuple[str, str]:
    """
    Generates a new CAPTCHA.
    Returns:
        (captcha_id, data_uri_image)
    The answer is stored server-side only in memory with a 3-minute TTL.
    """
    clean_expired_captchas()
    
    # 5-6 characters
    text = ''.join(random.choices(SAFE_CHARS, k=length))
    captcha_id = str(uuid.uuid4())
    
    _CAPTCHA_STORE[captcha_id] = {
        "answer": text,
        "expires_at": time.time() + ttl_seconds
    }

    svg_content = generate_svg_captcha_markup(text)
    b64_svg = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
    data_uri = f"data:image/svg+xml;base64,{b64_svg}"

    return captcha_id, data_uri

def verify_captcha(captcha_id: Optional[str], user_input: Optional[str]) -> Tuple[bool, str]:
    """
    Verifies user-supplied text against the server-stored CAPTCHA answer.
    Enforces:
    - Single-use: invalidates the captcha on the first check whether it succeeds or fails.
    - Case-insensitive comparison.
    - Expiration check (2-3 min TTL).
    Returns (is_valid, error_message).
    """
    clean_expired_captchas()

    if not captcha_id or captcha_id not in _CAPTCHA_STORE:
        return False, "CAPTCHA challenge has expired or is invalid. Please enter the new CAPTCHA."

    entry = _CAPTCHA_STORE.pop(captcha_id)  # Single-use: always pop

    now = time.time()
    if now > entry["expires_at"]:
        return False, "CAPTCHA expired. Please enter the new characters shown."

    if not user_input or not isinstance(user_input, str):
        return False, "Please enter the characters shown in the CAPTCHA."

    expected = entry["answer"].strip().upper()
    received = user_input.strip().upper()

    if expected != received:
        return False, "Incorrect CAPTCHA characters. Please try again."

    return True, "Valid"

def check_rate_limit(ip: str, max_requests: int = 30, window_seconds: int = 60) -> bool:
    """
    Simple in-memory sliding window rate limiter.
    Returns True if allowed, False if exceeded.
    """
    now = time.time()
    timestamps = _RATE_LIMIT_STORE.get(ip, [])
    # Filter out entries older than window
    timestamps = [t for t in timestamps if now - t < window_seconds]
    if len(timestamps) >= max_requests:
        _RATE_LIMIT_STORE[ip] = timestamps
        return False
    timestamps.append(now)
    _RATE_LIMIT_STORE[ip] = timestamps
    return True
