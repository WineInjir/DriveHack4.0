from sanic import Sanic
from sanic.request import Request
from sanic.response import HTTPResponse, text
import os

app = Sanic("MetroChatBot")

@app.main_process_start
async def main_process_start(*_):
    # константы
    app.ctx.gigachat_endpoint = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"

    app.ctx.gigachat_key = os.getenv("GIGACHAT_KEY")

@app.post("/api/chat")
async def index(request: Request) -> HTTPResponse:
    return text("Hello world")

if __name__ == "__main__":
    app.run(os.getenv("HOST"), int(os.getenv("PORT")))
