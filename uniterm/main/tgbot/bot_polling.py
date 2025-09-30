from telegram.ext import Application, CommandHandler
import asyncio

async def start_command(update, context):
    await update.message.reply_text("Бот запущен!")

def main():
    application = Application.builder().token("7469176367:AAGfahwS0uuPQX0zLb2JfTsvcd9YglCfEk0").build()

    application.add_handler(CommandHandler("start", start_command))
    
    print("Бот запущен...")
    application.run_polling()

if __name__ == "__main__":
    main() 