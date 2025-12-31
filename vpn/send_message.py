import os
import httpx
from pydantic import BaseModel

BOT_TOKEN = os.getenv("TOKEN_BOT", "")
TELEGRAM_API = "https://api.telegram.org/bot{token}/{method}"

class SendMessageIn(BaseModel):
    user_ids: list[int]
    text: str


async def tg_send_message(chat_id: int, text: str) -> None:

    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN не задан")

    url = TELEGRAM_API.format(token=BOT_TOKEN, method="sendMessage")
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(url, json=payload)

    if r.status_code != 200:
        raise RuntimeError(f"Telegram HTTP error {r.status_code}: {r.text}")

    data = r.json()
    if not data.get("ok"):
        raise RuntimeError(f"Telegram API error: {data}")

