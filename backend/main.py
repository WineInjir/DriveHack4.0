from sanic import Sanic
from sanic.request import Request
from sanic.response import HTTPResponse, text
import os, aiohttp, gigachat

app = Sanic("MetroChatBot")

@app.post("/api/chat")
async def index(request: Request) -> HTTPResponse:
    pass

if __name__ == "__main__":
    app.run(os.getenv("HOST"), int(os.getenv("PORT")))
