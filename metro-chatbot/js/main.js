// === MetroChatBot Beautiful Frontend ===

// --- элементы интерфейса ---
const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// --- действия ---
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// --- добавление сообщений ---
function addMessage(sender, text, cls) {
  const el = document.createElement("div");
  el.className = `message ${cls}`;
  el.innerHTML = `<div class="sender">${sender}</div><div class="bubble">${escapeHtml(
    text
  ).replace(/\n/g, "<br>")}</div>`;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
  return el;
}

// --- набор текста по буквам ---
async function typeText(el, fullText, delay = 35) {
  el.innerHTML = "";
  for (let i = 0; i < fullText.length; i++) {
    el.innerHTML += escapeHtml(fullText[i]);
    chat.scrollTop = chat.scrollHeight;
    await new Promise((r) => setTimeout(r, delay));
  }
}

// --- TTS воспроизведение ---
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ru-RU";
  u.rate = 1;
  u.pitch = 1;
  u.volume = 1;
  const voices = speechSynthesis.getVoices();
  if (voices.length) u.voice = voices.find((v) => v.lang.startsWith("ru")) || voices[0];
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// --- основная логика отправки ---
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage("Вы", text, "user");
  input.value = "";

  const botMsg = addMessage("Бот", "🧠 Думаю...", "bot");
  const bubble = botMsg.querySelector(".bubble");

  try {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
    });

    if (!resp.ok) throw new Error("Сервер не ответил");

    const data = await resp.json();
    if (data.reply) {
      bubble.textContent = "";
      await typeText(bubble, data.reply);
      speak(data.reply);
    } else if (data.error) {
      bubble.innerHTML = `<span class="error">⚠️ ${escapeHtml(data.error)}</span>`;
    } else {
      bubble.innerHTML = `<span class="error">⚠️ Неизвестная ошибка</span>`;
    }
  } catch (err) {
    bubble.innerHTML = `<span class="error">⚠️ Не удалось связаться с сервером.</span>`;
  }
}

function escapeHtml(unsafe) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
