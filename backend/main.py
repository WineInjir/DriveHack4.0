from sanic import Sanic
from sanic.request import Request
from sanic.response import HTTPResponse, text
import os, aiohttp
from gigachat import GigaChat

app = Sanic("MetroChatBot")


@app.main_process_start
async def main_process_start(*_):
    app.ctx.gigachat_token = GigaChat(credentials="MDE5OWU3NDUtOTYzMC03OTA4LWFmODUtMTBhZmVmYWJhMWY5OmQxMjMzOTdiLTllZDQtNDIwNS1iMDQwLTljZjk0OGE1YzlkMw==",)
    app.ctx.gigachat_request_token = app.ctx.gigachat_token.get_token()

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
    app.run("127.0.0.1", 8080)