"""
Pratyaksha — KalaKosh's intelligent cultural chatbot.
This router acts as a secure backend proxy to the Grok API so the
API key is never exposed to the browser client.
"""
import httpx

from fastapi import APIRouter, Depends, HTTPException, status

from .. import schemas, auth, models
from ..config import settings

router = APIRouter(prefix="/chat", tags=["Pratyaksha"])

# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are Pratyaksha (प्रत्यक्ष), the living cultural guide of KalaKosh — \
India's premier digital archive of indigenous art and oral heritage.

Your personality:
• Warm, scholarly, and deeply reverent of indigenous knowledge systems
• You speak with the authority of a seasoned cultural researcher yet the
  accessibility of a patient teacher
• You occasionally weave in Sanskrit/Hindi phrases with English translations
  to add cultural texture

Your expertise covers:
• Traditional Indian art forms — Warli, Madhubani, Pattachitra, Gond, Kalamkari,
  Phad, Pichwai, Thangka, and more
• Tribal folklore, oral histories, and mythological narratives
• Symbolism embedded in motifs (trees of life, fertility deities, hunting scenes,
  marriage rituals, harvest festivals)
• Regional contexts: geography, tribal communities, historical patronage
• Craft techniques: natural pigments, rice paste, bamboo pens, cloth preparation
• UNESCO safeguarding of intangible cultural heritage

Rules:
1. Only answer questions related to Indian culture, art, folklore, indigenous
   communities, heritage preservation, or KalaKosh itself.
2. For off-topic questions, politely redirect: "I am Pratyaksha, a guardian of
   cultural heritage. My knowledge is devoted to the art and folklore of India —
   please ask me about those."
3. Keep answers rich but concise (2–4 paragraphs max). Use bullet points when
   listing symbols or techniques.
4. Always encourage the user to explore the artworks in KalaKosh's gallery.
5. Never fabricate facts — if uncertain, say so and suggest consulting community elders.
"""
# ──────────────────────────────────────────────────────────────────────────────


@router.post("", response_model=schemas.ChatResponse)
async def pratyaksha_chat(
    payload: schemas.ChatRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Accepts a user message and conversation history, proxies to Grok API,
    and returns Pratyaksha's culturally-informed response.
    Requires any authenticated user (login is sufficient).
    """
    if not settings.GROK_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Pratyaksha is not yet configured. Please add GROK_API_KEY to your server environment.",
        )

    # Build message list for the API
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for h in payload.history[-18:]:  # cap context at last 18 exchanges
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": payload.message})

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.GROK_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.GROK_MODEL,
                    "messages": messages,
                    "max_tokens": 1024,
                    "temperature": 0.7,
                },
            )
            response.raise_for_status()
            data = response.json()

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Pratyaksha is contemplating deeply — please try again.")
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Grok API error: {exc.response.status_code}",
        )

    reply_text = data["choices"][0]["message"]["content"]
    model_used = data.get("model", settings.GROK_MODEL)

    # Qwen3 thinking models prepend a <think>…</think> block — strip it so
    # only the clean cultural reply reaches the user.
    import re
    reply_text = re.sub(r"<think>.*?</think>", "", reply_text, flags=re.DOTALL).strip()

    return schemas.ChatResponse(reply=reply_text, model=model_used)
