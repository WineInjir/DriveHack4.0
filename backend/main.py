from sanic import Sanic
from sanic.response import json, file
import aiohttp, pathlib, uuid, traceback, base64, tempfile, os
from gtts import gTTS
from datetime import datetime

# ==============================
# 🔧 НАСТРОЙКИ
# ==============================
CLIENT_ID = "0199e745-9630-7908-af85-10afefaba1f9"
CLIENT_SECRET = "08a0b6ae-0d81-4829-b6ec-0ca91aa08553"

OAUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
CHAT_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"

SYSTEM_PROMPT = (
    "Ты — дружелюбный помощник Московского метрополитена 🚇. "
    "Отвечай естественно, вежливо и кратко, помогай прокладывать маршруты и отвечай на вопросы."
    "Отвечай как человек, никаких обьяснений в скобочках и пост скриптумов, ты должен отвечать как в диалоге, коротко и только ро делу, желательно без никакой лишней информации"
)

# ==============================
# ⚙️ ПУТИ
# ==============================
BASE_DIR = pathlib.Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
STATIC_DIR = pathlib.Path("metro-chatbot")  # Абсолютный путь
TOKEN_FILE = BASE_DIR / "token.txt"
LOG_FILE = BASE_DIR / "server.log"

app = Sanic("MetroChatBot")

print(f"📁 BASE_DIR: {BASE_DIR}")
print(f"📁 STATIC_DIR: {STATIC_DIR}")
print(f"📄 TOKEN_FILE: {TOKEN_FILE}")
print(f"🪵 LOG_FILE: {LOG_FILE}")

# Проверим наличие index.html
index_path = STATIC_DIR / "index.html"
if not index_path.exists():
    print(f"⚠️ Файл index.html не найден! Ожидается по пути: {index_path}")
else:
    print(f"✅ Найден index.html: {index_path}")

# ==============================
# 🧾 ЛОГИРОВАНИЕ
# ==============================
def write_log(message: str):
    """Записывает события в server.log"""
    time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{time}] {message}\n")
    print(message)

# ==============================
# 🌐 РОУТЫ
# ==============================
@app.get("/")
async def root(request):
    """Главная страница"""
    if not index_path.exists():
        write_log("❌ index.html не найден при запросе на /")
        return json({"error": f"Файл index.html не найден по пути {index_path}"}, status=404)
    write_log("➡️ Отправлен index.html пользователю")
    return await file(str(index_path))

# Раздача статики (имена уникальны)
app.static("/css", str(STATIC_DIR / "css"), name="css_static")
app.static("/js", str(STATIC_DIR / "js"), name="js_static")
app.static("/audio", tempfile.gettempdir(), name="audio_static")

# ==============================
# 🔑 Получение токена
# ==============================
async def get_access_token():
    auth_string = f"{CLIENT_ID}:{CLIENT_SECRET}"
    auth_b64 = base64.b64encode(auth_string.encode()).decode()

    headers = {
        "Authorization": f"Basic {auth_b64}",
        "RqUID": str(uuid.uuid4()),
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {"scope": "GIGACHAT_API_PERS"}

    write_log("🔐 Получение нового access_token...")

    async with aiohttp.ClientSession() as session:
        async with session.post(OAUTH_URL, headers=headers, data=data, ssl=False) as resp:
            text = await resp.text()
            if resp.status != 200:
                write_log(f"❌ Ошибка при получении токена ({resp.status}): {text}")
                raise Exception(f"Ошибка при получении токена ({resp.status}): {text}")
            j = await resp.json()
            token = j.get("access_token")
            if not token:
                raise Exception(f"Не удалось извлечь access_token: {text}")
            TOKEN_FILE.write_text(token)
            write_log("✅ access_token получен и сохранён.")
            return token

# ==============================
# 💬 Обработка чата
# ==============================
@app.post("/api/chat")
async def chat(request):
    try:
        data = request.json or {}
        msgs = data.get("messages", [])
        user_text = msgs[-1]["content"] if msgs else ""
        write_log(f"💬 Запрос от пользователя: {user_text}")

        # Получаем токен
        token = TOKEN_FILE.read_text().strip() if TOKEN_FILE.exists() else ""
        if not token or len(token) < 10:
            write_log("⚠️ Токен отсутствует или повреждён — создаю новый...")
            token = await get_access_token()

        payload = {
            "model": "GigaChat",
            "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + msgs,
            "temperature": 0.6,
            "max_tokens": 700,
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "X-Request-ID": str(uuid.uuid4()),
        }

        async with aiohttp.ClientSession() as s:
            async with s.post(CHAT_URL, json=payload, headers=headers, ssl=False) as r:
                text = await r.text()
                if r.status != 200:
                    if r.status == 401:
                        write_log("⚠️ Токен истёк — получаю новый...")
                        token = await get_access_token()
                        headers["Authorization"] = f"Bearer {token}"
                        async with s.post(CHAT_URL, json=payload, headers=headers, ssl=False) as r2:
                            answer = await r2.json(content_type=None)
                    else:
                        write_log(f"❌ Ошибка GigaChat ({r.status}): {text}")
                        raise Exception(f"GigaChat ответил ошибкой {r.status}: {text}")
                else:
                    answer = await r.json(content_type=None)

        bot_text = answer["choices"][0]["message"]["content"]
        write_log(f"🤖 Ответ бота: {bot_text[:100]}...")

        # 🎤 Озвучка через gTTS
        tts = gTTS(bot_text, lang="ru")
        temp_audio = os.path.join(tempfile.gettempdir(), f"voice_{uuid.uuid4()}.mp3")
        tts.save(temp_audio)
        write_log(f"🎧 Аудио сохранено: {temp_audio}")

        return json({
            "reply": bot_text,
            "audio_url": f"/audio/{os.path.basename(temp_audio)}"
        })

    except Exception as e:
        err = f"❌ Ошибка /api/chat: {e}"
        write_log(err)
        write_log(traceback.format_exc())
        return json({"error": str(e)}, status=500)

# ==============================
# 🚀 ЗАПУСК
# ==============================
if __name__ == "__main__":
    write_log("🚀 Сервер MetroChatBot запущен на http://127.0.0.1:8080")
    app.run(host="127.0.0.1", port=8080, single_process=True, access_log=True)
