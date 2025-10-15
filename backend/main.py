from sanic import Sanic
from sanic.request import Request
from sanic.response import HTTPResponse, text
import os, aiohttp, json

app = Sanic("MetroChatBot")

@app.post("/api/chat")
async def index(request: Request) -> HTTPResponse:
    data = request.json
    print(json.dumps(data))

if __name__ == "__main__":
    app.run("127.0.0.2", 8080)
