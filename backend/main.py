from sanic import Sanic
from sanic.response import text

app = Sanic("MetroChatBot")

@app.post("/api/chat")
async def index(req):
    return text("Hello world")
