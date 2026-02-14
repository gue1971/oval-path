(function initOvalPath() {
  const presidents = window.PRESIDENTS || [];

  const picker = document.getElementById("president-picker");
  const controlsEl = document.querySelector(".controls");
  const tabNoteButton = document.getElementById("tab-note");
  const tabLineageButton = document.getElementById("tab-lineage");
  const tabGalleryButton = document.getElementById("tab-gallery");
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
  const galleryViewEl = document.getElementById("gallery-view");
  const galleryGridEl = document.getElementById("gallery-grid");

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

  function slugifyName(name) {
    return String(name)
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/^-+|-+$/g, "");
  }

  function renderSymbolVisual(president) {
    const slug = slugifyName(president.name);
    const imagePath = `./assets/presidents/${slug}.png`;
    const img = document.createElement("img");
    img.className = "president-art";
    img.alt = `${president.jpName} (${president.name})`;
    img.loading = "eager";
    img.decoding = "async";
    img.src = imagePath;
    img.addEventListener("error", () => {
      symbolArt.textContent = president.symbol;
      symbolArt.classList.remove("symbol-art-image");
    });
    symbolArt.innerHTML = "";
    symbolArt.appendChild(img);
    symbolArt.classList.add("symbol-art-image");
  }

  function renderNameStack(jpName, enName) {
    return `<span class="name-stack"><span class="name-ja">${escapeHtml(jpName)}</span><span class="name-en">${escapeHtml(enName)}</span></span>`;
  }

  function getPartyKey(partyName) {
    const name = String(partyName || "");
    if (name.includes("民主共和党")) return "demrep";
    if (name.includes("ホイッグ党")) return "whig";
    if (name.includes("民主党")) return "dem";
    if (name.includes("共和党")) return "gop";
    if (name.includes("連邦党") || name.includes("連邦派")) return "fed";
    return "other";
  }

  function getPartyLabel(partyName) {
    const key = getPartyKey(partyName);
    const labelMap = {
      fed: "連邦党系",
      demrep: "民主共和",
      dem: "民主党",
      whig: "ホイッグ",
      gop: "共和党",
      other: "無所属系"
    };
    return { key, label: labelMap[key] || "その他" };
  }

  function renderPartyChip(partyName) {
    const party = getPartyLabel(partyName);
    return `<span class="party-chip party-${party.key}">${escapeHtml(party.label)}</span>`;
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
    pickerCurrent.innerHTML = `<span class="picker-row-with-party"><span class="picker-name-row"><span class="picker-index">${president.id}.</span><span class="name-stack"><span class="name-ja">${escapeHtml(president.jpName)}</span><span class="name-en">${escapeHtml(president.name)}</span></span></span>${renderPartyChip(
      president.party
    )}</span>`;
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
            <span class="picker-row-with-party">
              <span class="picker-name-row">
                <span class="picker-index">${p.id}.</span>
                <span class="name-stack">
                  <span class="name-ja">${escapeHtml(p.jpName)}</span>
                  <span class="name-en">${escapeHtml(p.name)}</span>
                </span>
              </span>
              ${renderPartyChip(p.party)}
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
    const axisMapByEra = {
      建国期: { "中央集権寄り": "連邦主導", "州権寄り": "州権重視", 中間: "調停" },
      拡張と分断前夜: { "中央集権寄り": "連邦統合", "州権寄り": "州主権", 中間: "妥協志向" },
      南北戦争と再建: { "中央集権寄り": "連邦介入", "州権寄り": "州自治", 中間: "再建調整" },
      産業化と改革: { "中央集権寄り": "規制強化", "州権寄り": "市場自律", 中間: "漸進改革" },
      進歩主義時代: { "中央集権寄り": "改革推進", "州権寄り": "抑制志向", 中間: "制度調整" },
      戦間期と大恐慌: { "中央集権寄り": "国家介入", "州権寄り": "小さな政府", 中間: "限定介入" },
      冷戦と戦後再編: { "中央集権寄り": "連邦主導", "州権寄り": "分権志向", 中間: "現実調整" },
      保守化とグローバル化: { "中央集権寄り": "安全保障主導", "州権寄り": "市場重視", 中間: "中道路線" },
      現代アメリカ: { "中央集権寄り": "制度拡張", "州権寄り": "反制度志向", 中間: "分極調整" }
    };
    const eraPointMap = {
      建国期: "国家の土台づくりと、連邦と州の役割分担が中心課題。",
      拡張と分断前夜: "領土拡大の成功と引き換えに、奴隷制対立が先鋭化。",
      南北戦争と再建: "国家の再統合と公民権保護を、どこまで連邦が担うかが争点。",
      産業化と改革: "急成長する資本主義を、規制と市場のどちらで制御するか。",
      進歩主義時代: "社会問題への改革介入と、制度の持続可能性のバランス。",
      戦間期と大恐慌: "小さな政府志向から、危機時の国家介入拡大への転換。",
      冷戦と戦後再編: "対外抑止と国内改革を同時に進める複合統治の時代。",
      保守化とグローバル化: "市場重視の再編と、国際秩序管理の現実外交が並行。",
      現代アメリカ: "分極社会で制度運用の安定と、支持基盤政治の両立が課題。"
    };

    const renderAxisLabel = (president) => {
      const byEra = axisMapByEra[president.era];
      if (!byEra) {
        return president.axis;
      }
      return byEra[president.axis] || president.axis;
    };

    const eraGroups = presidents.reduce((groups, president) => {
      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.era !== president.era) {
        groups.push({ era: president.era, presidents: [president] });
      } else {
        lastGroup.presidents.push(president);
      }
      return groups;
    }, []);

    lineageTrack.innerHTML = eraGroups
      .map((group) => {
        const eraMeta = eraMetaMap[group.era] || { years: "", presidents: "" };
        const eraYears = eraMeta.years ? `<span class="lineage-era-years">${escapeHtml(eraMeta.years)}</span>` : "";
        const eraName = `<span class="lineage-era-name">${escapeHtml(group.era)}</span>`;
        const eraRange = eraMeta.presidents
          ? `<span class="lineage-era-range">${escapeHtml(eraMeta.presidents)}</span>`
          : "";
        const eraPoint = eraPointMap[group.era]
          ? `<p class="lineage-era-point">${escapeHtml(eraPointMap[group.era])}</p>`
          : "";
        const items = group.presidents
          .map((p) => {
            const activeClass = p.id === activeId ? " style=\"border-color:#b14f2f;background:#fff4e5\"" : "";
            const slug = slugifyName(p.name);
            const imagePath = `./assets/presidents/${slug}.png`;
            return `<div class="lineage-item" data-president-id="${p.id}"${activeClass}>
              <span class="index party-${getPartyKey(p.party)}">#${p.id}</span>
              <span class="lineage-main">
                ${renderNameStack(p.jpName, p.name)}
                <span class="axis-row">
                  ${renderPartyChip(p.party)}
                  <span class="axis">${escapeHtml(renderAxisLabel(p))}</span>
                </span>
              </span>
              <img
                class="lineage-thumb"
                src="${escapeHtml(imagePath)}"
                alt="${escapeHtml(p.jpName)}"
                loading="lazy"
                decoding="async"
              />
            </div>`;
          })
          .join("");
        return `<section class="lineage-era-group" data-era="${escapeHtml(group.era)}">
          <div class="lineage-era-header">${eraYears}${eraName}${eraRange}</div>
          ${eraPoint}
          <div class="lineage-era-list">${items}</div>
        </section>`;
      })
      .join("");
  }

  function renderGallery() {
    galleryGridEl.innerHTML = presidents
      .map((p) => {
        const slug = slugifyName(p.name);
        const imagePath = `./assets/presidents/${slug}.png`;
        const partyKey = getPartyKey(p.party);
        const activeClass = p.id === activePresidentId ? " active" : "";
        return `<button type="button" class="gallery-item party-${partyKey}${activeClass}" data-president-id="${p.id}">
          <img src="${escapeHtml(imagePath)}" alt="${escapeHtml(p.jpName)}" loading="lazy" decoding="async" />
          <span class="gallery-name">${escapeHtml(p.jpName)}</span>
          <span class="gallery-name-en">${escapeHtml(p.name)}</span>
        </button>`;
      })
      .join("");
  }

  function scrollLineageToPresident(presidentId) {
    const itemEl = lineageTrack.querySelector(`[data-president-id="${presidentId}"]`);
    if (itemEl) {
      itemEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    }
    return false;
  }

  function scrollLineageToEra(eraName) {
    const eraEl = [...lineageTrack.querySelectorAll("[data-era]")].find(
      (el) => el.dataset.era === eraName
    );
    if (eraEl) {
      eraEl.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    }
    return false;
  }

  function setActiveView(view) {
    activeView = view;
    const showNote = view === "note";
    const showLineage = view === "lineage";
    const showGallery = view === "gallery";
    cardEl.hidden = !showNote;
    lineageViewEl.hidden = !showLineage;
    galleryViewEl.hidden = !showGallery;
    tabNoteButton.classList.toggle("active", showNote);
    tabLineageButton.classList.toggle("active", showLineage);
    tabGalleryButton.classList.toggle("active", showGallery);
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
    const { scroll = false, forceScroll = false, scrollTarget = "president" } = options;
    const president = presidents.find((p) => p.id === Number(id)) || presidents[0];
    if (!president) {
      return;
    }

    const previousPresidentId = activePresidentId;
    const hasChanged = president.id !== previousPresidentId;
    activePresidentId = president.id;
    renderPickerCurrent(president);
    renderSymbolVisual(president);
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
    renderGallery();

    if (scroll && (hasChanged || forceScroll)) {
      if (activeView === "note") {
        scrollToImageTop();
      } else {
        const didJump =
          scrollTarget === "era" && selectedEra !== "all"
            ? scrollLineageToEra(selectedEra)
            : scrollLineageToPresident(president.id);
        if (!didJump) {
          scrollToLineageTop();
        }
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
    renderPresident(activePresidentId, {
      scroll,
      forceScroll: changedByFilter || (scroll && activeView === "lineage"),
      scrollTarget: selectedEra === "all" ? "president" : "era"
    });
    setPickerExpanded(false);
    setEraExpanded(false);
  }

  buildEraOptions();
  applyEraFilter();
  setActiveView("note");
  renderGallery();

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
    if (!scrollLineageToPresident(activePresidentId)) {
      scrollToLineageTop();
    }
  });

  tabGalleryButton.addEventListener("click", () => {
    setActiveView("gallery");
    renderGallery();
  });

  galleryGridEl.addEventListener("click", (event) => {
    const target = event.target.closest(".gallery-item");
    if (!target) {
      return;
    }
    const selectedId = Number(target.dataset.presidentId);
    renderPresident(selectedId);
    setActiveView("note");
    scrollToImageTop();
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
