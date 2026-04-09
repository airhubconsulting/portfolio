// ============================================================
// _chat.js — shared chatbot widget logic
// Included by all pages. Calls /chat (Cloudflare Pages Function)
// ============================================================
(function () {
  let chatHistory = [];
  let questionCount = 0;
  const MAX_Q = 50;

  const toggle = document.getElementById("chat-toggle");
  const panel  = document.getElementById("chat-panel");
  if (!toggle || !panel) return;

  toggle.addEventListener("click", () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) document.getElementById("chat-input")?.focus();
  });
  document.getElementById("chat-close-btn")?.addEventListener("click", () => panel.classList.remove("open"));

  document.querySelectorAll(".suggestion-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      sendMessage(btn.textContent.trim());
      document.getElementById("chat-suggestions").style.display = "none";
    });
  });

  const input   = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  input?.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); sendMessage(input.value.trim()); } });
  sendBtn?.addEventListener("click", () => sendMessage(input?.value.trim() || ""));

  function addMsg(text, role) {
    const el = document.createElement("div");
    el.className = `chat-msg ${role}`;
    el.textContent = text;
    const msgs = document.getElementById("chat-messages");
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  async function sendMessage(text) {
    if (!text) return;
    if (questionCount >= MAX_Q) {
      addMsg("You've reached today's limit — email Angela directly at angelaguo18@gmail.com 😊", "bot");
      if (input) input.disabled = true;
      if (sendBtn) sendBtn.disabled = true;
      return;
    }
    if (input) input.value = "";
    questionCount++;
    addMsg(text, "user");
    const thinking = addMsg("thinking...", "bot thinking");
    chatHistory.push({ role: "user", content: text });

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: chatHistory.slice(-6) })
      });
      const data = await res.json();
      thinking.remove();

      if (data.error === "rate_limited" || data.error === "monthly_limit") {
        addMsg(data.message, "bot");
        if (input) input.disabled = true;
        if (sendBtn) sendBtn.disabled = true;
        return;
      }

      const reply = data.reply || "Something went wrong — email Angela at angelaguo18@gmail.com";
      addMsg(reply, "bot");
      chatHistory.push({ role: "assistant", content: reply });

      if (questionCount >= MAX_Q) {
        addMsg("That's 3 questions for this visit. Email Angela at angelaguo18@gmail.com to keep the conversation going.", "bot");
      }
    } catch {
      thinking.remove();
      addMsg("Couldn't connect right now — email Angela at angelaguo18@gmail.com", "bot");
    }
  }
})();
