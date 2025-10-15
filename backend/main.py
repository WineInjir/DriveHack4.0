from sanic import Sanic
from sanic.request import Request
from sanic.response import json as sanic_json, HTTPResponse
import aiohttp
import os

app = Sanic("MetroChatBot")

@app.main_process_start
async def setup(_app, _):
    _app.ctx.gigachat_url = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"

    # переменные среды
    with open("token.txt", "r") as f:
        app.ctx.gigachat_key = f.read().decode()

@app.post("/api/chat")
async def proxy_gigachat(request: Request) -> HTTPResponse:
    try:
        payload = request.json

        async with aiohttp.ClientSession() as session:
            async with session.post(
                request.app.ctx.gigachat_url,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {request.app.ctx.gigachat_token}"
                },
                json=payload
            ) as resp:
                data = await resp.json()
                return sanic_json(data, status=resp.status)

    except Exception as e:
        return sanic_json({"error": str(e)}, status=500)


if __name__ == "__main__":
    app.run(os.getenv("HOST"), int(os.getenv("PORT")))