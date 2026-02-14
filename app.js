(function initOvalPath() {
  const presidents = window.PRESIDENTS || [];

  const picker = document.getElementById("president-picker");
  const controlsEl = document.querySelector(".controls");
  const tabNoteButton = document.getElementById("tab-note");
  const tabLineageButton = document.getElementById("tab-lineage");
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
  const cardEl = document.getElementById("president-card");
  const lineageViewEl = document.getElementById("lineage-view");

  if (!presidents.length) {
    document.body.innerHTML = "<p>データが見つかりませんでした。</p>";
    return;
  }

  let filteredPresidents = [...presidents];
  let activePresidentId = presidents[0].id;
  let selectedEra = "all";
  let activeView = "note";
  const eraMetaMap = {
    all: { years: "", name: "全時代", presidents: "1-47代" },
    建国期: { years: "1789-1841", name: "建国期", presidents: "1-8代" },
    拡張と分断前夜: { years: "1841-1861", name: "拡張と分断前夜", presidents: "9-15代" },
    南北戦争と再建: { years: "1861-1881", name: "南北戦争と再建", presidents: "16-20代" },
    産業化と改革: { years: "1881-1901", name: "産業化と改革", presidents: "21-25代" },
    進歩主義時代: { years: "1901-1921", name: "進歩主義時代", presidents: "26-28代" },
    戦間期と大恐慌: { years: "1921-1945", name: "戦間期と大恐慌", presidents: "29-32代" },
    冷戦と戦後再編: { years: "1945-1981", name: "冷戦と戦後再編", presidents: "33-39代" },
    保守化とグローバル化: { years: "1981-2009", name: "保守化とグローバル化", presidents: "40-43代" },
    現代アメリカ: { years: "2009-現在", name: "現代アメリカ", presidents: "44-47代" }
  };

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
      `<li role="option" aria-selected="false"><button type="button" class="era-option" data-era-value="all">${renderEraLabel(
        "all"
      )}</button></li>`,
      ...eras.map(
        (era) =>
          `<li role="option" aria-selected="false"><button type="button" class="era-option" data-era-value="${escapeHtml(
            era
          )}">${renderEraLabel(era)}</button></li>`
      )
    ].join("");
  }

  function renderEraLabel(eraValue) {
    const meta = eraMetaMap[eraValue] || { years: "", name: eraValue, presidents: "" };
    const yearsHtml = meta.years ? `<span class="era-years">${escapeHtml(meta.years)}</span>` : "";
    const nameHtml = `<span class="era-name">${escapeHtml(meta.name)}</span>`;
    const rangeHtml = meta.presidents ? `<span class="era-presidents">${escapeHtml(meta.presidents)}</span>` : "";
    return `<span class="era-label">${yearsHtml}${nameHtml}${rangeHtml}</span>`;
  }

  function renderEraCurrent() {
    eraCurrent.innerHTML = renderEraLabel(selectedEra);
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

  function setActiveView(view) {
    activeView = view;
    const showNote = view === "note";
    cardEl.hidden = !showNote;
    lineageViewEl.hidden = showNote;
    tabNoteButton.classList.toggle("active", showNote);
    tabLineageButton.classList.toggle("active", !showNote);
  }

  function scrollToLineageTop() {
    if (!lineageViewEl) {
      return;
    }
    const controlsHeight = controlsEl ? controlsEl.offsetHeight : 0;
    const top = lineageViewEl.getBoundingClientRect().top + window.scrollY - controlsHeight - 6;
    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "smooth"
    });
  }

  function scrollToImageTop() {
    if (!cardEl) {
      return;
    }
    const controlsHeight = controlsEl ? controlsEl.offsetHeight : 0;
    const top = cardEl.getBoundingClientRect().top + window.scrollY - controlsHeight - 6;
    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "smooth"
    });
  }

  function renderPresident(id, options = {}) {
    const { scroll = false, forceScroll = false } = options;
    const president = presidents.find((p) => p.id === Number(id)) || presidents[0];
    if (!president) {
      return;
    }

    const previousPresidentId = activePresidentId;
    const hasChanged = president.id !== previousPresidentId;
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

    if (scroll && (hasChanged || forceScroll)) {
      if (activeView === "note") {
        scrollToImageTop();
      } else {
        scrollToLineageTop();
      }
    }
  }

  function applyEraFilter(options = {}) {
    const { scroll = false } = options;
    const previousPresidentId = activePresidentId;
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
    const changedByFilter = previousPresidentId !== activePresidentId;
    renderPresident(activePresidentId, { scroll, forceScroll: changedByFilter });
    setPickerExpanded(false);
    setEraExpanded(false);
  }

  buildEraOptions();
  applyEraFilter();
  setActiveView("note");

  eraButton.addEventListener("click", () => {
    setEraExpanded(eraList.hidden);
  });

  eraList.addEventListener("click", (event) => {
    const target = event.target.closest(".era-option");
    if (!target) {
      return;
    }
    selectedEra = target.dataset.eraValue || "all";
    applyEraFilter({ scroll: true });
  });

  pickerButton.addEventListener("click", () => {
    setPickerExpanded(pickerList.hidden);
  });

  pickerList.addEventListener("click", (event) => {
    const target = event.target.closest(".picker-option");
    if (!target) {
      return;
    }
    renderPresident(Number(target.dataset.presidentId), { scroll: true });
    setPickerExpanded(false);
  });

  tabNoteButton.addEventListener("click", () => {
    setActiveView("note");
    scrollToImageTop();
  });

  tabLineageButton.addEventListener("click", () => {
    setActiveView("lineage");
    renderLineage(activePresidentId);
    scrollToLineageTop();
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
