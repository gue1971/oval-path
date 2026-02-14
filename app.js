(function initOvalPath() {
  const presidents = window.PRESIDENTS || [];

  const picker = document.getElementById("president-picker");
  const eraFilter = document.getElementById("era-filter");
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
    eraFilter.innerHTML = `<option value="all">全時代</option>${eras
      .map((era) => `<option value="${escapeHtml(era)}">${escapeHtml(era)}</option>`)
      .join("")}`;
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
    document.body.style.overflowY = isOpen ? "hidden" : "";
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
    const selectedEra = eraFilter.value;
    filteredPresidents =
      selectedEra === "all" ? [...presidents] : presidents.filter((p) => p.era === selectedEra);
    if (!filteredPresidents.length) {
      filteredPresidents = [...presidents];
    }
    if (!filteredPresidents.some((p) => p.id === activePresidentId)) {
      activePresidentId = filteredPresidents[0].id;
    }
    buildPickerOptions();
    renderPresident(activePresidentId);
    setPickerExpanded(false);
  }

  buildEraOptions();
  eraFilter.value = "all";
  applyEraFilter();

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

  eraFilter.addEventListener("change", () => {
    applyEraFilter();
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
