(function initOvalPath() {
  const presidents = window.PRESIDENTS || [];

  const picker = document.getElementById("president-picker");
  const pickerButton = document.getElementById("picker-button");
  const pickerCurrent = document.getElementById("picker-current");
  const pickerList = document.getElementById("picker-list");
  const symbolArt = document.getElementById("symbol-art");
  const symbolCaption = document.getElementById("symbol-caption");
  const nameEl = document.getElementById("pi-name");
  const termEl = document.getElementById("pi-term");
  const partyEl = document.getElementById("pi-party");
  const keywordsEl = document.getElementById("pi-keywords");
  const originEl = document.getElementById("note-origin");
  const legacyEl = document.getElementById("note-legacy");
  const lineageTrack = document.getElementById("lineage-track");

  if (!presidents.length) {
    document.body.innerHTML = "<p>データが見つかりませんでした。</p>";
    return;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function renderNameStack(jpName, enName) {
    return `<span class="name-stack"><span class="name-ja">${escapeHtml(jpName)}</span><span class="name-en">${escapeHtml(enName)}</span></span>`;
  }

  function renderPickerCurrent(president) {
    pickerCurrent.innerHTML = `<span class="name-stack"><span class="name-ja">${president.id}. ${escapeHtml(president.jpName)}</span><span class="name-en">${escapeHtml(president.name)}</span></span>`;
  }

  function buildPickerOptions() {
    pickerList.innerHTML = presidents
      .map(
        (p) => `<li role="option" aria-selected="false">
          <button type="button" class="picker-option" data-president-id="${p.id}">
            <span class="name-stack">
              <span class="name-ja">${p.id}. ${escapeHtml(p.jpName)}</span>
              <span class="name-en">${escapeHtml(p.name)}</span>
            </span>
          </button>
        </li>`
      )
      .join("");
  }

  function setPickerExpanded(isOpen) {
    pickerList.hidden = !isOpen;
    pickerButton.setAttribute("aria-expanded", String(isOpen));
  }

  function renderLineage(activeId) {
    lineageTrack.innerHTML = presidents
      .map((p) => {
        const activeClass = p.id === activeId ? " style=\"border-color:#b14f2f;background:#fff4e5\"" : "";
        return `<div class="lineage-item"${activeClass}>
          <span class="index">#${p.id}</span>
          ${renderNameStack(p.jpName, p.name)}
          <span class="axis">${p.axis}</span>
        </div>`;
      })
      .join("");
  }

  function renderPresident(id) {
    const president = presidents.find((p) => p.id === Number(id)) || presidents[0];

    renderPickerCurrent(president);
    symbolArt.textContent = president.symbol;
    symbolCaption.textContent = president.symbolCaption;
    nameEl.innerHTML = renderNameStack(president.jpName, president.name);
    termEl.textContent = president.term;
    partyEl.textContent = president.party;
    keywordsEl.textContent = president.keywords.join(" / ");
    originEl.textContent = president.origin;
    legacyEl.textContent = president.legacy;

    pickerList.querySelectorAll(".picker-option").forEach((optionEl) => {
      const isActive = Number(optionEl.dataset.presidentId) === president.id;
      optionEl.classList.toggle("active", isActive);
      optionEl.parentElement?.setAttribute("aria-selected", String(isActive));
    });

    renderLineage(president.id);
  }

  buildPickerOptions();
  renderPresident(presidents[0].id);

  pickerButton.addEventListener("click", () => {
    setPickerExpanded(pickerList.hidden);
  });

  pickerList.addEventListener("click", (event) => {
    const target = event.target.closest(".picker-option");
    if (!target) {
      return;
    }
    renderPresident(target.dataset.presidentId);
    setPickerExpanded(false);
  });

  document.addEventListener("click", (event) => {
    if (!picker.contains(event.target)) {
      setPickerExpanded(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setPickerExpanded(false);
    }
  });
})();
