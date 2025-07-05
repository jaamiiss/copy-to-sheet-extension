let panel;

function createPanel() {
  panel = document.createElement("div");
  panel.id = "copy-to-sheet-panel";
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #ffffff;
    color: #333;
    border: 1px solid #ddd;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    z-index: 999999;
    width: 300px;
    font-size: 14px;
    font-family: sans-serif;
  `;
  panel.innerHTML = `
    <div id="cts-drag" style="
      cursor: move;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
      padding: 8px;
      border-radius: 8px 8px 0 0;
      font-weight: bold;
      text-align: center;
    ">
      📋 Copy to Sheet
    </div>
    <div style="margin-top: 12px;">
      <strong>Title:</strong> <span id="cts-title" style="color:#007bff;">(none)</span><br>
      <strong>Message:</strong> <span id="cts-message" style="color:#007bff;">(none)</span>
    </div>
    <div id="cts-status" style="
      margin-top:8px;
      font-size: 12px;
      color: green;
      display: none;
      text-align:center;
    ">✔️ Sent!</div>
    <div style="margin-top: 16px; text-align: center;">
      <button id="cts-submit" style="
        background:#007bff;
        color:white;
        border:none;
        border-radius:4px;
        padding:8px 12px;
        margin-right:8px;
        cursor:pointer;
        transition: background 0.3s;
      ">Submit</button>
      <button id="cts-hide" style="
        background:#6c757d;
        color:white;
        border:none;
        border-radius:4px;
        padding:8px 12px;
        cursor:pointer;
        transition: background 0.3s;
      ">Hide</button>
    </div>
  `;
  document.body.appendChild(panel);

  // fix initial position for dragging
  panel.style.top = panel.offsetTop + "px";
  panel.style.left = panel.offsetLeft + "px";
  panel.style.bottom = "";
  panel.style.right = "";
  panel.style.transform = "none";

  // button hover effects
  const submitBtn = document.getElementById("cts-submit");
  const hideBtn = document.getElementById("cts-hide");

  submitBtn.addEventListener("mouseenter", () => {
    submitBtn.style.background = "#0056b3";
  });
  submitBtn.addEventListener("mouseleave", () => {
    submitBtn.style.background = "#007bff";
  });

  hideBtn.addEventListener("mouseenter", () => {
    hideBtn.style.background = "#5a6268";
  });
  hideBtn.addEventListener("mouseleave", () => {
    hideBtn.style.background = "#6c757d";
  });

  submitBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "submit" });
  });

  hideBtn.addEventListener("click", () => {
    panel.style.display = "none";
  });

  makeDraggable(panel, document.getElementById("cts-drag"));
}

function makeDraggable(elmnt, handle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  handle.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

createPanel();

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "updatePanel") {
    document.getElementById("cts-title").textContent = msg.title || "(none)";
    document.getElementById("cts-message").textContent = msg.message || "(none)";
    panel.style.display = "block";
    document.getElementById("cts-status").style.display = "none";
  }
  if (msg.type === "confirmation") {
    const status = document.getElementById("cts-status");
    status.style.display = "block";
    setTimeout(() => {
      status.style.display = "none";
    }, 2000);
  }
});

