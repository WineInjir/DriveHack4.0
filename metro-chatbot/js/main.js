let messages = [];

// 🎤 Настройка кнопки голосового ввода
const micBtn = document.getElementById("micBtn");
micBtn.addEventListener("click", startRecognition);

// 🚀 Голосовой ввод с анимацией печати
function startRecognition() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Ваш браузер не поддерживает распознавание речи.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "ru-RU";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onstart = () => {
    micBtn.innerText = "🎧"; // Активная иконка
  };

  recognition.onerror = (event) => {
    alert("Ошибка распознавания: " + event.error);
    micBtn.innerText = "🎤";
  };

  recognition.onend = () => {
    micBtn.innerText = "🎤"; // Вернуть иконку
  };

  recognition.onresult = (event) => {
    const result = event.results[0][0].transcript;
    const input = document.getElementById("userInput");
    input.value = "";
    typeTextToInput(input, result); // Анимация печати
  };
}

// ✨ Анимация печати текста в поле
function typeTextToInput(inputElement, text, speed = 50) {
  let index = 0;
  function type() {
    if (index < text.length) {
      inputElement.value += text.charAt(index);
      index++;
      setTimeout(type, speed);
    }
  }
  type();
}

// 🗣️ Озвучивание текста
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ru-RU";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

// 📤 Отправка сообщения на локальный сервер
async function sendMessage() {
  const input = document.getElementById("userInput");
  const userText = input.value.trim();
  if (!userText) return;

  addMessage("Вы", userText, "user");
  messages.push({ role: "user", content: userText });
  input.value = "";

  try {
    // Логируем отправляемые данные
    console.log("Отправка на сервер:", {
      messages: messages
    });

    // Отправляем запрос на сервер
    const response = await fetch("http://127.0.0.1:8080/api/chat", { // Обрати внимание, URL локальный
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: messages // отправляем сообщения для обработки
      })
    });

    const data = await response.json(); // получаем ответ от сервера

    if (data.choices && data.choices[0]) {
      const botReply = data.choices[0].message.content;
      messages.push({ role: "assistant", content: botReply });
      addMessage("Бот", botReply, "bot");
      speak(botReply); // Озвучиваем ответ
    } else {
      addMessage("Бот", "Произошла ошибка при получении ответа от сервера.", "bot");
    }
  } catch (error) {
    // Обработка ошибок
    addMessage("Бот", "Ошибка сети или сервера. Попробуйте позже.", "bot");
    console.error("Ошибка отправки:", error);
  }
}

// 🧱 Добавление сообщения в чат
function addMessage(sender, text, cssClass) {
  const chat = document.getElementById("chat");
  const messageEl = document.createElement("div");    
  messageEl.className = `message ${cssClass}`;
  messageEl.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chat.appendChild(messageEl);
  chat.scrollTop = chat.scrollHeight;
}
