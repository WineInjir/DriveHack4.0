from sanic import Sanic
from sanic.request import Request
from sanic.response import HTTPResponse, text
import os, aiohttp, json, pathlib

app = Sanic("MetroChatBot")

STATIC_DIR = (pathlib.Path(__file__) / "../../metro-chatbot").resolve()
print(f"Static: {STATIC_DIR}")
app.static("/", str(STATIC_DIR), name="index_static")

@app.post("/api/chat")
async def index(request: Request) -> HTTPResponse:
    data = request.json
    print(json.dumps(data))
    return text("missing")

if __name__ == "__main__":
    app.run("127.0.0.2", 8080)
