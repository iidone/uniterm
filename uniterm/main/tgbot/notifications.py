import requests
import json

def send_telegram_message(message_text):
    bot_token = "7469176367:AAGfahwS0uuPQX0zLb2JfTsvcd9YglCfEk0"
    chat_ids = ["921948607", "557068409"]
    
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

    results = {
        'success': False,
        'sent_count': 0,
        'errors': []
    }
    
    for chat_id in chat_ids:
        data = {
            "chat_id": chat_id,
            "text": message_text,
            "parse_mode": "Markdown"
        }
        
        try:
            print(f"Отправляем в Telegram для chat_id {chat_id}")
            response = requests.post(url, data=data, timeout=10)
            print(f"Статус ответа: {response.status_code}")
            
            if response.status_code == 200:
                results['sent_count'] += 1
                print(f"✅ Сообщение отправлено в {chat_id}")
            else:
                error_msg = f"HTTP {response.status_code} для {chat_id}"
                print(f"❌ {error_msg}")
                results['errors'].append(error_msg)
                
        except Exception as e:
            error_msg = f"Ошибка отправки в {chat_id}: {e}"
            print(f"❌ {error_msg}")
            results['errors'].append(error_msg)

    results['success'] = results['sent_count'] > 0
    
    print(f"Telegram result: {results}")
    return results