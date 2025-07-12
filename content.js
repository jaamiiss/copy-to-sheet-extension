let panel;
let overrideState = {
  title: false,
  message: false,
  date: false
};

const fieldSelectors = {};

function loadFieldMappings(callback) {
  chrome.storage.sync.get("fieldMappings", (data) => {
    Object.assign(fieldSelectors, data.fieldMappings || {});
    callback();
  });
}

function showBlockedBanner() {
  const banner = document.createElement("div");
  banner.className = "cts-debug-banner";
  banner.textContent = "⚠️ Panel not shown: domain not allowed (strict mode)";
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 4000);
}

function createMonthSelect() {
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(navigator.language || "en", { month: "long" }).format(new Date(2020, i))
  );

  return (
    '<select id="cts-month"><option value="">Month</option>' +
    monthNames
      .map((name, idx) => {
        const val = String(idx + 1).padStart(2, "0");
        return `<option value="${val}">${name}</option>`;
      })
      .join("") +
    '</select>'
  );
}

function setButtonLoading(button, loading = true) {
  if (!button) return;
  if (loading) {
    button.classList.add("loading");
  } else {
    button.classList.remove("loading");
  }
}

function showStatus(type = "success") {
  const overlay = document.getElementById("cts-overlay");
  if (!overlay) return;

  const isSuccess = type === "success";

  overlay.innerHTML = `
    <div class="cts-status-icon">
      ${isSuccess ? `
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="success-icon">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
      ` : `
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="error-icon">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      `}
    </div>
    <div class="cts-status-text">${isSuccess ? "Sent!" : "Submit failed"}</div>
  `;

  overlay.classList.remove("success", "error");
  overlay.classList.add(type);
  overlay.style.display = "flex";

  setTimeout(() => {
    overlay.style.display = "none";
  }, 2500);
}

function createPanel() {
  panel = document.createElement("div");
  panel.id = "copy-to-sheet-panel";

  const monthSelectHTML = createMonthSelect();

  panel.innerHTML = `
    <div id="cts-drag">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" class="cts-icon">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Copy to Sheet
    </div>

    <div style="margin-top: 12px;">
      <label for="cts-title"><strong>Title</strong></label>
      <div id="cts-title" class="cts-editable" contenteditable="true">(none)</div>

      <label for="cts-message"><strong>Message</strong></label>
      <div id="cts-message" class="cts-editable" contenteditable="true">(none)</div>

      <label for="cts-month"><strong>Date</strong></label>
      <div class="cts-date-row">
        ${monthSelectHTML}
        <input id="cts-day" type="number" min="1" max="31" placeholder="Day" />
      </div>
    </div>

    <div style="margin-top: 16px; text-align: center;">
      <button id="cts-submit" class="cts-button cts-submit" title="Submit">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </button>
      <button id="cts-reset" class="cts-button secondary" title="Reset Fields">
        <svg class="cts-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="1 4 1 10 7 10"></polyline>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
        </svg>
      </button>
      <button id="cts-hide" class="cts-button secondary" title="Hide Panel">
        <svg class="cts-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div id="cts-overlay"></div>
  `;

  document.body.appendChild(panel);

  const submitBtn = document.getElementById("cts-submit");
  const titleEl = document.getElementById("cts-title");
  const msgEl = document.getElementById("cts-message");

  submitBtn.addEventListener("click", () => {
  const title = titleEl.innerText.trim();
  const message = msgEl.innerText.trim();
  const month = document.getElementById("cts-month").value;
  let day = document.getElementById("cts-day").value.trim();

  if (day.length === 1) day = "0" + day;

  let date = "";
  if (
    month &&
    day &&
    /^[0-9]{2}$/.test(day) &&
    parseInt(day) >= 1 &&
    parseInt(day) <= 31
  ) {
    date = `2025-${month}-${day}T00:00:00+08:00`;
  }

  setButtonLoading(submitBtn, true);

  try {
    chrome.runtime.sendMessage(
      { type: "submit", title, message, date },
      (response) => {
        setButtonLoading(submitBtn, false);
        if (chrome.runtime.lastError || response?.error) {
          showStatus("error");
        } else {
          showStatus("success");
        }
      }
    );
  } catch (err) {
    setButtonLoading(submitBtn, false);
    showStatus("error");
    console.warn("Extension context invalidated. Submit skipped.", err);
  }
});

  document.getElementById("cts-reset").addEventListener("click", () => {
    overrideState = { title: false, message: false, date: false };
    localStorage.removeItem("overrideState");
    console.log("🔄 Manual override flags reset.");
    extractContent();
  });

  [
    { id: "cts-title", stateKey: "title" },
    { id: "cts-message", stateKey: "message" },
    { id: "cts-month", stateKey: "date" },
    { id: "cts-day", stateKey: "date" }
  ].forEach(({ id, stateKey }) => {
    const el = document.getElementById(id);
    if (el) {
      const evt = id === "cts-month" ? "change" : "input";
      el.addEventListener(evt, () => {
        if (id === "cts-title" || id === "cts-message") {
          overrideState[stateKey] = el.innerText.trim() !== "" && el.innerText.trim() !== "(none)";
        } else {
          overrideState[stateKey] = true;
        }
        localStorage.setItem("overrideState", JSON.stringify(overrideState));
      });
    }
  });

  document.getElementById("cts-hide").addEventListener("click", () => {
    panel.style.display = "none";
  });

  makeDraggable(panel, document.getElementById("cts-drag"));
}

function makeDraggable(elmnt, handle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  handle.onmousedown = (e) => {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  };

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (!panel) return;

  const titleEl = document.getElementById("cts-title");
  const messageEl = document.getElementById("cts-message");

  if (msg.type === "updatePanel") {
    if (msg.title !== undefined && (!overrideState.title || titleEl.textContent === "(none)") && msg.preserve !== "title") {
      titleEl.textContent = msg.title || "(none)";
      if (msg.title && msg.title !== "(none)") overrideState.title = true;
    }
    if (msg.message !== undefined && (!overrideState.message || messageEl.textContent === "(none)") && msg.preserve !== "message") {
      messageEl.textContent = msg.message || "(none)";
      if (msg.message && msg.message !== "(none)") overrideState.message = true;
    }
    panel.style.display = "block";
  }

  if (msg.type === "confirmation") {
    console.log("✅ Received confirmation message");
  }
  
  if (msg.type === "showStatus") {
  showStatus(msg.message || "", msg.statusType || "success");
}
});

function extractContent() {
  console.log("🔍 Running extractContent...");

  setTimeout(() => {
    const hostname = location.hostname.replace(/^www\./, "");
    const mapping = fieldSelectors[hostname] || {};

    let titleSel = mapping.title || "h1, .gh-article-title";
    let msgSel = mapping.message || "blockquote";

    let title = "";
    let message = "";

    const titleEl = document.querySelector(titleSel);
    if (titleEl) title = titleEl.innerText.trim();

    const msgEl = document.querySelector(msgSel);
    if (msgEl) {
      let fullText = msgEl.innerText.trim();
      fullText = fullText.replace(/^\["“”]+|["“”]+$/g, "");
      message = fullText.split(/\n|<br>| - /)[0].trim();
    }

    const panelTitleEl = document.getElementById("cts-title");
    const panelMsgEl = document.getElementById("cts-message");

    if (!overrideState.title && title && panelTitleEl) {
      panelTitleEl.textContent = title;
    }
    if (!overrideState.message && message && panelMsgEl) {
      panelMsgEl.textContent = message;
    }

    if (panel) panel.style.display = "block";
    console.log("🖼️ Panel auto-filled from auto-populate.");
  }, 1000);
}

chrome.storage.sync.get(
  ["allowedDomains", "autoPopulateEnabled", "strictInjection", "debugMode"],
  (data) => {
    const allowed = data.allowedDomains || [];
    const autoPopulate = data.autoPopulateEnabled ?? true;
    const strict = data.strictInjection ?? false;
    const debugMode = data.debugMode ?? false;
    const hostname = location.hostname.replace(/^www\./, "");

    const isAllowed = allowed.some((domain) => hostname.endsWith(domain));

    console.log("🧠 Domains allowed:", allowed);
    console.log("🌐 Current hostname:", hostname);
    console.log("⚙️ Auto-populate enabled:", autoPopulate);
    console.log("🔒 Strict injection enabled:", strict);
    console.log("🐞 Debug mode:", debugMode);
    console.log("🔍 Is allowed domain:", isAllowed);

    if (strict && !isAllowed) {
      console.log("🚫 Panel injection blocked by strict mode.");
      if (debugMode) showBlockedBanner();
      return;
    }

    const savedOverride = localStorage.getItem("overrideState");
    if (savedOverride) overrideState = JSON.parse(savedOverride);

    loadFieldMappings(() => {
      createPanel();
      if (isAllowed && autoPopulate) {
        console.log("✅ Domain matched and auto-populate enabled. Extracting content...");
        extractContent();
      } else {
        console.log("⏭️ Panel injected but auto-populate skipped.");
      }
    });
  }
);