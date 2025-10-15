from sanic import Sanic
from sanic.request import Request
from sanic.response import HTTPResponse, text
import os, aiohttp, gigachat

app = Sanic("MetroChatBot")

'''
@app.main_process_start
async def main_process_start(*_):
    # константы
    app.ctx.gigachat_endpoint = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"

    # переменные среды
    with open("token.txt", "r") as f:
        app.ctx.gigachat_key = f.read().decode()
    
    # другое
    app.ctx.giga = gigachat.GigaChat()

@app.post("/api/chat")
async def index(request: Request) -> HTTPResponse:
    #  body: JSON.stringify({
    #   model: "GigaChat",
    #   messages: messages,
    #   temperature: 0.7
    # })
    async with aiohttp.request(
        method="POST",
        url=request.app.ctx.gigachat_endpoint,
        json={
            "model": "GigaChat",
            "messages": [],
            "temperature": 0.7,
        },
    ):
        pass

if __name__ == "__main__":
    app.run(os.getenv("HOST"), int(os.getenv("PORT")))
'''