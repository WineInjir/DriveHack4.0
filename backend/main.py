from sanic import Sanic
from sanic.response import text

app = Sanic("MetroChatBot")

@app.get("/")
async def index(req):
    return text("Hello world")

app.run("127.0.0.1:8080")
