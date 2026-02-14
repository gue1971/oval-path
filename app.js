(function initOvalPath() {
  const presidents = window.PRESIDENTS || [];

  const picker = document.getElementById("president-picker");
  const eraPicker = document.getElementById("era-picker");
  const eraButton = document.getElementById("era-button");
  const eraCurrent = document.getElementById("era-current");
  const eraList = document.getElementById("era-list");
  const pickerButton = document.getElementById("picker-button");
  const pickerCurrent = document.getElementById("picker-current");
  const pickerList = document.getElementById("picker-list");
  const symbolArt = document.getElementById("symbol-art");
  const symbolCaption = document.getElementById("symbol-caption");
  const rankEl = document.getElementById("pi-rank");
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

  let filteredPresidents = [...presidents];
  let activePresidentId = presidents[0].id;
  let selectedEra = "all";

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

  function formatPresidencyLabel(president) {
    const numbers =
      Array.isArray(president.presidencyNumbers) && president.presidencyNumbers.length
        ? president.presidencyNumbers
        : [president.id];
    const uniqueSorted = [...new Set(numbers.map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
    if (uniqueSorted.length === 1 && uniqueSorted[0] === 1) {
      return "初代";
    }
    return `第${uniqueSorted.join("・")}代`;
  }

  function renderTerm(termValue) {
    if (Array.isArray(termValue)) {
      return termValue.map((line) => `<span class="term-line">${escapeHtml(line)}</span>`).join("");
    }
    return `<span class="term-line">${escapeHtml(termValue)}</span>`;
  }

  function renderPickerCurrent(president) {
    pickerCurrent.innerHTML = `<span class="picker-name-row"><span class="picker-index">${president.id}.</span><span class="name-stack"><span class="name-ja">${escapeHtml(president.jpName)}</span><span class="name-en">${escapeHtml(president.name)}</span></span></span>`;
  }

  function buildEraOptions() {
    const eras = [...new Set(presidents.map((p) => p.era).filter(Boolean))];
    eraList.innerHTML = [
      `<li role="option" aria-selected="false"><button type="button" class="era-option" data-era-value="all">全時代</button></li>`,
      ...eras.map(
        (era) =>
          `<li role="option" aria-selected="false"><button type="button" class="era-option" data-era-value="${escapeHtml(
            era
          )}">${escapeHtml(era)}</button></li>`
      )
    ].join("");
  }

  function renderEraCurrent() {
    const buttonLabel = selectedEra === "all" ? "全時代" : selectedEra;
    eraCurrent.textContent = buttonLabel;
    eraList.querySelectorAll(".era-option").forEach((optionEl) => {
      const isActive = optionEl.dataset.eraValue === selectedEra;
      optionEl.classList.toggle("active", isActive);
      optionEl.parentElement?.setAttribute("aria-selected", String(isActive));
    });
  }

  function syncScrollLock() {
    const hasOpenList = !pickerList.hidden || !eraList.hidden;
    document.body.style.overflowY = hasOpenList ? "hidden" : "";
  }

  function setEraExpanded(isOpen) {
    eraList.hidden = !isOpen;
    eraButton.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      setPickerExpanded(false);
    }
    syncScrollLock();
  }

  function buildPickerOptions() {
    pickerList.innerHTML = filteredPresidents
      .map(
        (p) => `<li role="option" aria-selected="false">
          <button type="button" class="picker-option" data-president-id="${p.id}">
            <span class="picker-name-row">
              <span class="picker-index">${p.id}.</span>
              <span class="name-stack">
                <span class="name-ja">${escapeHtml(p.jpName)}</span>
                <span class="name-en">${escapeHtml(p.name)}</span>
              </span>
            </span>
          </button>
        </li>`
      )
      .join("");
  }

  function setPickerExpanded(isOpen) {
    pickerList.hidden = !isOpen;
    pickerButton.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      setEraExpanded(false);
    }
    syncScrollLock();
  }

  function renderLineage(activeId) {
    lineageTrack.innerHTML = filteredPresidents
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
    if (!president) {
      return;
    }

    activePresidentId = president.id;
    renderPickerCurrent(president);
    symbolArt.textContent = president.symbol;
    symbolCaption.textContent = president.symbolCaption;
    rankEl.textContent = formatPresidencyLabel(president);
    nameEl.innerHTML = renderNameStack(president.jpName, president.name);
    termEl.innerHTML = renderTerm(president.term);
    partyEl.textContent = president.party;
    keywordsEl.innerHTML = `<ul class="keyword-list">${president.keywords
      .map((keyword) => `<li>${escapeHtml(keyword)}</li>`)
      .join("")}</ul>`;
    originEl.textContent = president.origin;
    legacyEl.textContent = president.legacy;

    pickerList.querySelectorAll(".picker-option").forEach((optionEl) => {
      const isActive = Number(optionEl.dataset.presidentId) === president.id;
      optionEl.classList.toggle("active", isActive);
      optionEl.parentElement?.setAttribute("aria-selected", String(isActive));
    });

    renderLineage(president.id);
  }

  function applyEraFilter() {
    filteredPresidents =
      selectedEra === "all" ? [...presidents] : presidents.filter((p) => p.era === selectedEra);
    if (!filteredPresidents.length) {
      filteredPresidents = [...presidents];
    }
    if (!filteredPresidents.some((p) => p.id === activePresidentId)) {
      activePresidentId = filteredPresidents[0].id;
    }
    buildPickerOptions();
    renderEraCurrent();
    renderPresident(activePresidentId);
    setPickerExpanded(false);
    setEraExpanded(false);
  }

  buildEraOptions();
  applyEraFilter();

  eraButton.addEventListener("click", () => {
    setEraExpanded(eraList.hidden);
  });

  eraList.addEventListener("click", (event) => {
    const target = event.target.closest(".era-option");
    if (!target) {
      return;
    }
    selectedEra = target.dataset.eraValue || "all";
    applyEraFilter();
  });

  pickerButton.addEventListener("click", () => {
    setPickerExpanded(pickerList.hidden);
  });

  pickerList.addEventListener("click", (event) => {
    const target = event.target.closest(".picker-option");
    if (!target) {
      return;
    }
    renderPresident(Number(target.dataset.presidentId));
    setPickerExpanded(false);
  });

  document.addEventListener("click", (event) => {
    if (!picker.contains(event.target)) {
      setPickerExpanded(false);
    }
    if (!eraPicker.contains(event.target)) {
      setEraExpanded(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setPickerExpanded(false);
      setEraExpanded(false);
    }
  });
})();
