document.addEventListener("DOMContentLoaded", () => {
  // --- элементы ---
  const chat = document.getElementById("chat");
  const input = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const micBtn = document.getElementById("micBtn");

  const dotsBtn = document.getElementById("dotsBtn");
  const sidePanel = document.getElementById("sidePanel");
  const closeSide = document.getElementById("closeSide");

  const themeToggle = document.getElementById("themeToggle");
  const themeLabel = document.getElementById("themeLabel");
  const enterToggle = document.getElementById("enterToggle");
  const ttsToggle = document.getElementById("ttsToggle");

  const firstModal = document.getElementById("firstModal");
  const modalEnterYes = document.getElementById("modalEnterYes");
  const modalEnterNo = document.getElementById("modalEnterNo");
  const modalTtsYes = document.getElementById("modalTtsYes");
  const modalTtsNo = document.getElementById("modalTtsNo");
  const modalConfirm = document.getElementById("modalConfirm");

  const githubLink = document.getElementById("githubLink");

  const LS = {
    theme: "metro_theme", 
    enter: "metro_enter_send",
    tts: "metro_tts", 
    firstSeen: "metro_first_seen",
  };

  function defaults() {
    return {
      theme: localStorage.getItem(LS.theme) || "dark",
      enter: localStorage.getItem(LS.enter) === null ? "1" : localStorage.getItem(LS.enter),
      tts: localStorage.getItem(LS.tts) === null ? "1" : localStorage.getItem(LS.tts),
    };
  }

  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.classList.add("light");
      localStorage.setItem(LS.theme, "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem(LS.theme, "dark");
    }
    updateThemeLabel();
  }

  function updateThemeLabel() {
    const cur = document.documentElement.classList.contains("light") ? "light" : "dark";
    themeLabel.textContent = cur === "light" ? "Тёмная тема" : "Светлая тема";
    themeToggle.checked = cur === "light";
  }

  function updateEnterBehaviorUI() {
    const enabled = enterToggle.checked;
    if (enabled) {
      input.setAttribute("placeholder", "Введите сообщение... (Enter — отправить, Shift+Enter — перенос)");
    } else {
      input.setAttribute("placeholder", "Введите сообщение... (Enter — перенос, Ctrl/Cmd+Enter — отправить)");
    }
    localStorage.setItem(LS.enter, enabled ? "1" : "0");
  }

  function ttsEnabled() {
    return ttsToggle.checked;
  }

  function loadSettingsToUI() {
    const cfg = defaults();
    applyTheme(cfg.theme);
    enterToggle.checked = cfg.enter === "1";
    ttsToggle.checked = cfg.tts === "1";
    updateEnterBehaviorUI();
  }

  dotsBtn.addEventListener("click", () => {
    sidePanel.classList.toggle("open");
    sidePanel.setAttribute("aria-hidden", sidePanel.classList.contains("open") ? "false" : "true");
  });
  closeSide.addEventListener("click", () => {
    sidePanel.classList.remove("open");
    sidePanel.setAttribute("aria-hidden", "true");
  });

  themeToggle.addEventListener("change", (e) => {
    applyTheme(e.target.checked ? "light" : "dark");
  });

  enterToggle.addEventListener("change", (e) => {
    updateEnterBehaviorUI();
  });

  ttsToggle.addEventListener("change", (e) => {
    localStorage.setItem(LS.tts, e.target.checked ? "1" : "0");
  });

  function showFirstModalIfNeeded() {
    const seen = localStorage.getItem(LS.firstSeen);
    if (!seen) {
      const cfg = defaults();
      setModalEnterSelection(cfg.enter === "1");
      setModalTtsSelection(cfg.tts === "1");
      firstModal.classList.remove("hidden");
    }
  }

  let modalEnterChoice = null;
  let modalTtsChoice = null;

  function setModalEnterSelection(enabled) {
    modalEnterChoice = enabled ? "1" : "0";
    modalEnterYes.classList.toggle("selected", enabled);
    modalEnterNo.classList.toggle("selected", !enabled);
  }
  function setModalTtsSelection(enabled) {
    modalTtsChoice = enabled ? "1" : "0";
    modalTtsYes.classList.toggle("selected", enabled);
    modalTtsNo.classList.toggle("selected", !enabled);
  }

  modalEnterYes.addEventListener("click", () => setModalEnterSelection(true));
  modalEnterNo.addEventListener("click", () => setModalEnterSelection(false));
  modalTtsYes.addEventListener("click", () => setModalTtsSelection(true));
  modalTtsNo.addEventListener("click", () => setModalTtsSelection(false));

  modalConfirm.addEventListener("click", () => {
    if (modalEnterChoice === null) {
      modalEnterChoice = defaults().enter;
    }
    if (modalTtsChoice === null) {
      modalTtsChoice = defaults().tts;
    }
    localStorage.setItem(LS.enter, modalEnterChoice);
    localStorage.setItem(LS.tts, modalTtsChoice);
    localStorage.setItem(LS.firstSeen, "1");

    enterToggle.checked = modalEnterChoice === "1";
    ttsToggle.checked = modalTtsChoice === "1";
    updateEnterBehaviorUI();

    firstModal.classList.add("hidden");
  });

  let recognition = null;
  let isRecording = false;
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = "ru-RU";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      input.value = text;
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      micBtn.classList.remove("recording");
      isRecording = false;
    };
  } else {
    micBtn.disabled = true;
    micBtn.title = "Распознавание речи не поддерживается в этом браузере";
  }

  micBtn.addEventListener("mousedown", startRecording);
  micBtn.addEventListener("mouseup", stopRecording);
  micBtn.addEventListener("touchstart", (e) => { e.preventDefault(); startRecording(); });
  micBtn.addEventListener("touchend", (e) => { e.preventDefault(); stopRecording(); });

  function startRecording() {
    if (!recognition || isRecording) return;
    isRecording = true;
    micBtn.classList.add("recording");
    try { recognition.start(); } catch (err) { console.warn(err); }
  }
  function stopRecording() {
    if (!recognition || !isRecording) return;
    recognition.stop();
    micBtn.classList.remove("recording");
    isRecording = false;
  }
  
  function escapeHtml(unsafe) {
    return unsafe
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function addMessage(sender, text, cls) {
    const el = document.createElement("div");
    el.className = `message ${cls}`;
    el.innerHTML = `<div class="sender">${sender}</div><div class="bubble">${escapeHtml(text).replace(/\n/g,"<br>")}</div>`;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
    return el;
  }

  async function typeText(el, fullText, delay = 25) {
    el.innerHTML = "";
    for (let i = 0; i < fullText.length; i++) {
      el.innerHTML += escapeHtml(fullText[i]);
      chat.scrollTop = chat.scrollHeight;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  function speak(text) {
    if (!ttsEnabled()) return;
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ru-RU";
    u.rate = 1;
    u.pitch = 1;
    u.volume = 1;
    const voices = speechSynthesis.getVoices();
    if (voices.length) u.voice = voices.find(v => v.lang && v.lang.startsWith("ru")) || voices[0];
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  function ttsEnabled() {
    return ttsToggle.checked;
  }

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

  input.addEventListener("keydown", (e) => {
    const enterMode = localStorage.getItem(LS.enter);
    const enterEnabled = enterMode === null ? true : enterMode === "1";

    if (enterEnabled) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    } else {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    }
  });

  sendBtn.addEventListener("click", sendMessage);

  loadSettingsToUI();
  showFirstModalIfNeeded();

  if ("speechSynthesis" in window) speechSynthesis.getVoices();

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") sidePanel.classList.remove("open");
  });
});
