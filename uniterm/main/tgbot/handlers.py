from telegram.ext import CommandHandler, MessageHandler, filters

def setup_handlers(application):
    application.add_handler(CommandHandler("start", start_command))
    
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

async def start_command(update, context):
    await update.message.reply_text("Привет! Я бот для уведомлений о заявках.")

async def handle_message(update, context):
    text = update.message.text
    await update.message.reply_text(f"Вы написали: {text}")