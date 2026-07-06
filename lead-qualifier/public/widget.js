/**
 * Embeddable chat widget.
 * On any client website, add:
 *   <script src="https://YOUR-DEPLOYED-URL/widget.js" async></script>
 * It renders a floating chat bubble in the bottom-right corner that talks
 * to this server's /api endpoints.
 */
(function () {
  var BASE = (function () {
    var s = document.currentScript;
    if (s && s.src) return new URL(s.src).origin;
    return "";
  })();

  var open = false, sessionId = null, started = false;

  var style = document.createElement("style");
  style.textContent =
    ".lqw-bubble{position:fixed;bottom:22px;right:22px;width:58px;height:58px;border-radius:50%;background:#4f46e5;color:#fff;border:0;font-size:26px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:999999}" +
    ".lqw-panel{position:fixed;bottom:92px;right:22px;width:min(360px,calc(100vw - 32px));height:min(520px,calc(100vh - 130px));background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.28);display:none;flex-direction:column;overflow:hidden;z-index:999999;font-family:system-ui,-apple-system,sans-serif}" +
    ".lqw-panel.open{display:flex}" +
    ".lqw-head{background:#4f46e5;color:#fff;padding:13px 16px;font-weight:600;font-size:15px}" +
    ".lqw-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f6f7fb}" +
    ".lqw-m{max-width:82%;padding:9px 12px;border-radius:12px;font-size:14px;line-height:1.4;white-space:pre-wrap}" +
    ".lqw-m.bot{background:#fff;border:1px solid #e4e6f0;align-self:flex-start}" +
    ".lqw-m.user{background:#4f46e5;color:#fff;align-self:flex-end}" +
    ".lqw-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e4e6f0;background:#fff}" +
    ".lqw-in{flex:1;padding:10px 12px;border:1px solid #e4e6f0;border-radius:9px;font-size:14px;outline:none}" +
    ".lqw-btn{background:#4f46e5;color:#fff;border:0;padding:10px 14px;border-radius:9px;font-weight:600;cursor:pointer}";
  document.head.appendChild(style);

  var bubble = document.createElement("button");
  bubble.className = "lqw-bubble";
  bubble.setAttribute("aria-label", "Open chat");
  bubble.textContent = "💬";

  var panel = document.createElement("div");
  panel.className = "lqw-panel";
  panel.innerHTML =
    '<div class="lqw-head">Chat with us</div>' +
    '<div class="lqw-msgs"></div>' +
    '<form class="lqw-form"><input class="lqw-in" placeholder="Type a message…" autocomplete="off"><button class="lqw-btn" type="submit">Send</button></form>';

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  var msgs = panel.querySelector(".lqw-msgs");
  var form = panel.querySelector(".lqw-form");
  var input = panel.querySelector(".lqw-in");

  function add(text, cls) {
    var el = document.createElement("div");
    el.className = "lqw-m " + cls;
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  bubble.addEventListener("click", function () {
    open = !open;
    panel.classList.toggle("open", open);
    bubble.textContent = open ? "✕" : "💬";
    if (open && !started) {
      started = true;
      fetch(BASE + "/api/session", { method: "POST" })
        .then(function (r) { return r.json(); })
        .then(function (d) { sessionId = d.sessionId; add(d.message, "bot"); })
        .catch(function () { add("Chat is unavailable right now.", "bot"); });
    }
    if (open) input.focus();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || !sessionId) return;
    add(text, "user");
    input.value = "";
    var typing = add("…", "bot");
    fetch(BASE + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId, message: text }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) { typing.remove(); add(d.reply || d.error || "Something went wrong.", "bot"); })
      .catch(function () { typing.remove(); add("Connection error — try again.", "bot"); });
  });
})();
