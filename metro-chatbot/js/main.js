const API_TOKEN = 'MDE5OWU3NDUtOTYzMC03OTA4LWFmODUtMTBhZmVmYWJhMWY5OjRiYTFhYzUxLWE1YWQtNDQ5YS1iNDBkLWJhYjZkY2UwZGZjMA==';

const systemPrompt = {
  role: "system",
  content: `Ты — AI-консультант по Московскому метрополитену. Отвечай вежливо, понятно и только на вопросы, связанные с метро. Если вопрос не по теме — вежливо откажись. Отвечай живым, человеческим языком, как сотрудник справочной службы.`
};

let messages = [systemPrompt];

// === TTS: Озвучка ответа ===
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ru-RU';
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

// === Голосовой ввод (STT) ===
const micBtn = document.getElementById('micBtn');
micBtn.addEventListener('click', startRecognition);

function startRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Ваш браузер не поддерживает распознавание речи.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'ru-RU';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onstart = () => {
    micBtn.innerText = "🎧";
  };

  recognition.onerror = (event) => {
    alert("Ошибка распознавания: " + event.error);
    micBtn.innerText = "🎤";
  };

  recognition.onend = () => {
    micBtn.innerText = "🎤";
  };

  recognition.onresult = (event) => {
    const result = event.results[0][0].transcript;
    document.getElementById('userInput').value = result;
  };
}

// === Отправка запроса в GigaChat ===
async function sendMessage() {
  const input = document.getElementById('userInput');
  const userText = input.value.trim();
  if (!userText) return;

  addMessage("Вы", userText, "user");
  messages.push({ role: "user", content: userText });
  input.value = '';

  const response = await fetch("https://gigachat.devices.sberbank.ru/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_TOKEN}`
    },
    body: JSON.stringify({
      model: "GigaChat",
      messages: messages,
      temperature: 0.7
    })
  });

  const data = await response.json();

  if (data.choices && data.choices[0]) {
    const botReply = data.choices[0].message.content;
    messages.push({ role: "assistant", content: botReply });
    addMessage("Бот", botReply, "bot");
    speak(botReply);
  } else {
    addMessage("Бот", "Произошла ошибка при получении ответа.", "bot");
  }
}

// === Отображение сообщений ===
function addMessage(sender, text, cssClass) {
  const chat = document.getElementById("chat");
  const messageEl = document.createElement("div");
  messageEl.className = `message ${cssClass}`;
  messageEl.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chat.appendChild(messageEl);
  chat.scrollTop = chat.scrollHeight;
}
