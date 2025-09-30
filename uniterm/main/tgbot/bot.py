import os
from telegram import Bot
from django.conf import settings

bot = Bot(token="7469176367:AAGfahwS0uuPQX0zLb2JfTsvcd9YglCfEk0")


async def get_updates():
    updates = await bot.get_updates()
    for update in update:
        print(f"Chat ID: {update.message.chat_id}")