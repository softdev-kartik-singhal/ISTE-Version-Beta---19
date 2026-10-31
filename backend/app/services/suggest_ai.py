"""Step 2 of "Suggestions for you": ask the AI model. It receives ONLY the anonymous profile JSON.

The provider is chosen in config.py: Gemini (needs SMARTGULLAK_GEMINI_API_KEY in the environment) or a local Ollama
model (nothing leaves the machine). Plain urllib is used so no extra library is needed. Any failure raises AIUnavailable
and the caller falls back to the rule-based suggestions.
"""
import json
import urllib.error
import urllib.request

from app import config
from app.services.suggest_rules import ALLOWED, HORIZONS


class AIUnavailable(Exception):
    """No key configured, network error, timeout, bad status or an unreadable answer."""


SYSTEM_PROMPT = f"""You are a financial education assistant for Indian users.
You receive a small anonymous profile (bands and labels only) and suggest product TYPES, never specific products.

Rules:
- product_type must be exactly one of: {json.dumps(ALLOWED, ensure_ascii=False)}.
- Never name any bank, fund house, insurer, scheme brand or app. Never promise or quote returns, rates or percentages.
- Order: first any high-cost debt, then the emergency fund, then insurance cover, then goal-based saving and investing.
- Suggest Sukanya Samriddhi only if about_you.has_daughter is true.
- why_it_fits: 1-2 short plain sentences that refer only to labels in the profile.
- what_to_check: one short line, for example "Compare lock-in and premature withdrawal rules".

Reply with strict JSON only, in this shape, with at most {config.MAX_SUGGESTIONS} suggestions:
{{"suggestions": [{{"product_type": "...", "priority": 1, "why_it_fits": "...", "what_to_check": "...",
"risk_level": "low|medium|high", "suits_goal_horizon": "{'|'.join(HORIZONS)}"}}]}}"""


def post_json(url, body, headers):
    """POST JSON and return the parsed JSON reply, or raise AIUnavailable."""
    request = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", **headers})
    try:
        with urllib.request.urlopen(request, timeout=config.AI_TIMEOUT_SECONDS) as reply:
            return json.load(reply)
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as err:
        raise AIUnavailable(str(err)) from err


def call_gemini(profile):
    if not config.GEMINI_API_KEY:
        raise AIUnavailable("No Gemini API key is set.")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{config.GEMINI_MODEL}:generateContent"
    body = {"systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "contents": [{"role": "user", "parts": [{"text": json.dumps(profile, ensure_ascii=False)}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2}}
    reply = post_json(url, body, {"x-goog-api-key": config.GEMINI_API_KEY})  # the key travels in a header, not the URL
    try:
        return reply["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError) as err:
        raise AIUnavailable("Unexpected Gemini reply.") from err


def call_ollama(profile):
    body = {"model": config.OLLAMA_MODEL, "stream": False, "format": "json",
            "messages": [{"role": "system", "content": SYSTEM_PROMPT},
                         {"role": "user", "content": json.dumps(profile, ensure_ascii=False)}]}
    try:
        return post_json(f"{config.OLLAMA_URL}/api/chat", body, {})["message"]["content"]
    except (KeyError, TypeError) as err:
        raise AIUnavailable("Unexpected Ollama reply.") from err


def ask_ai(profile):
    """Send the profile, return the model's answer as parsed JSON. Raises AIUnavailable on any problem."""
    text = call_ollama(profile) if config.AI_PROVIDER == "ollama" else call_gemini(profile)
    try:
        return json.loads(text)
    except (TypeError, ValueError) as err:
        raise AIUnavailable("The answer was not valid JSON.") from err
