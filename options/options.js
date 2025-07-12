document.addEventListener("DOMContentLoaded", () => {
  const allowedDomainsTextarea = document.getElementById("allowedDomains");
  const autoPopulateCheckbox = document.getElementById("autoPopulate");
  const strictCheckbox = document.getElementById("strictInjection");
  const debugCheckbox = document.getElementById("debugMode");
  const saveBtn = document.getElementById("saveBtn");
  const statusDiv = document.getElementById("status");
  const mappingList = document.getElementById("mappingList");
  const addMappingBtn = document.getElementById("addMappingBtn");
  const inlineAddBtn = document.getElementById("inlineAddBtn");
  const newDomainSelect = document.getElementById("newDomain");
  const newTitleSelector = document.getElementById("newTitleSelector");
  const newMessageSelector = document.getElementById("newMessageSelector");
  const toggleMappingsBtn = document.getElementById("toggleMappingsBtn");
  const fieldMappingsContainer = document.getElementById("fieldMappingsContainer");

  toggleMappingsBtn.addEventListener("click", () => {
    const isVisible = fieldMappingsContainer.style.display === "block";
    fieldMappingsContainer.style.display = isVisible ? "none" : "block";
  });

  [newDomainSelect, newTitleSelector, newMessageSelector].forEach((el) =>
    el.addEventListener("input", () => {
      const allFilled =
        newDomainSelect.value &&
        newTitleSelector.value.trim() &&
        newMessageSelector.value.trim();
      inlineAddBtn.disabled = !allFilled;
    })
  );

  function renderMappings(mappings = {}) {
    mappingList.innerHTML = "";
    Object.entries(mappings).forEach(([domain, sel]) => {
      const wrapper = document.createElement("div");
      wrapper.className = "mapping-item";
      wrapper.innerHTML = `
        <strong>${domain}</strong><br>
        Title Selector: <input type="text" class="titleSelector" data-domain="${domain}" value="${sel.title || ""}" /><br>
        Message Selector: <input type="text" class="messageSelector" data-domain="${domain}" value="${sel.message || ""}" /><br>
        <button class="removeMappingBtn" data-domain="${domain}">Remove</button>
      `;
      mappingList.appendChild(wrapper);
    });

    mappingList.querySelectorAll(".removeMappingBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const domain = btn.dataset.domain;
        chrome.storage.sync.get("fieldMappings", (data) => {
          const updated = data.fieldMappings || {};
          delete updated[domain];
          chrome.storage.sync.set({ fieldMappings: updated }, () => {
            renderMappings(updated);
          });
        });
      });
    });
  }

  chrome.storage.sync.get(
    ["allowedDomains", "autoPopulateEnabled", "strictInjection", "debugMode", "fieldMappings"],
    (data) => {
      const allowedDomains = data.allowedDomains || [];

      allowedDomainsTextarea.value = allowedDomains.join(", ");
      autoPopulateCheckbox.checked = data.autoPopulateEnabled !== false;
      strictCheckbox.checked = data.strictInjection === true;
      debugCheckbox.checked = data.debugMode === true;

      newDomainSelect.innerHTML = '<option value="">Select domain</option>';
      allowedDomains.forEach((domain) => {
        const opt = document.createElement("option");
        opt.value = domain;
        opt.textContent = domain;
        newDomainSelect.appendChild(opt);
      });

      renderMappings(data.fieldMappings || {});
    }
  );

  addMappingBtn.addEventListener("click", () => {
    const domain = prompt("Enter domain (e.g. micropreneur.life)");
    if (!domain) return;

    const titleSel = prompt("Title selector for this domain?", "h1");
    const msgSel = prompt("Message selector for this domain?", "blockquote");

    chrome.storage.sync.get("fieldMappings", (data) => {
      const updated = data.fieldMappings || {};
      updated[domain] = { title: titleSel, message: msgSel };
      chrome.storage.sync.set({ fieldMappings: updated }, () => {
        renderMappings(updated);
      });
    });
  });

  inlineAddBtn.addEventListener("click", () => {
    const domain = newDomainSelect.value.trim();
    const titleSel = newTitleSelector.value.trim();
    const msgSel = newMessageSelector.value.trim();

    if (!domain || !titleSel || !msgSel) {
      alert("Please select a domain and fill both selectors.");
      return;
    }

    chrome.storage.sync.get("fieldMappings", (data) => {
      const updated = data.fieldMappings || {};
      updated[domain] = { title: titleSel, message: msgSel };
      chrome.storage.sync.set({ fieldMappings: updated }, () => {
        renderMappings(updated);
        newTitleSelector.value = "";
        newMessageSelector.value = "";
        inlineAddBtn.disabled = true;
      });
    });
  });

  saveBtn.addEventListener("click", () => {
    const domains = allowedDomainsTextarea.value
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    const updatedMappings = {};
    mappingList.querySelectorAll(".titleSelector").forEach((input) => {
      const domain = input.dataset.domain;
      updatedMappings[domain] = updatedMappings[domain] || {};
      updatedMappings[domain].title = input.value.trim();
    });
    mappingList.querySelectorAll(".messageSelector").forEach((input) => {
      const domain = input.dataset.domain;
      updatedMappings[domain] = updatedMappings[domain] || {};
      updatedMappings[domain].message = input.value.trim();
    });

    chrome.storage.sync.set(
      {
        allowedDomains: domains,
        autoPopulateEnabled: autoPopulateCheckbox.checked,
        strictInjection: strictCheckbox.checked,
        debugMode: debugCheckbox.checked,
        fieldMappings: updatedMappings
      },
      () => {
        statusDiv.textContent = "Settings saved!";
        setTimeout(() => (statusDiv.textContent = ""), 2000);
      }
    );
  });
});