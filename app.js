(function initOvalPath() {
  const presidents = window.PRESIDENTS || [];

  const controlsEl = document.querySelector(".controls");
  const toggleAllErasButton = document.getElementById("toggle-all-eras");
  const backToLineageButton = document.getElementById("back-to-lineage");
  const symbolArt = document.getElementById("symbol-art");
  const symbolCaption = document.getElementById("symbol-caption");
  const rankEl = document.getElementById("pi-rank");
  const nameEl = document.getElementById("pi-name");
  const termEl = document.getElementById("pi-term");
  const partyEl = document.getElementById("pi-party");
  const keywordsEl = document.getElementById("pi-keywords");
  const infoModalEl = document.getElementById("info-modal");
  const infoModalBackdropEl = document.getElementById("info-modal-backdrop");
  const infoModalTitleEl = document.getElementById("info-modal-title");
  const infoModalBodyEl = document.getElementById("info-modal-body");
  const infoModalCloseEl = document.getElementById("info-modal-close");
  const originEl = document.getElementById("note-origin");
  const legacyEl = document.getElementById("note-legacy");
  const lineageTrack = document.getElementById("lineage-track");
  const cardEl = document.getElementById("president-card");
  const visualCardEl = document.getElementById("visual-card");
  const textCardEl = document.getElementById("text-card");
  const lineageViewEl = document.getElementById("lineage-view");
  const historyStateLineage = { view: "lineage" };

  if (!presidents.length) {
    document.body.innerHTML = "<p>データが見つかりませんでした。</p>";
    return;
  }

  let activePresidentId = presidents[0].id;
  let activeView = "lineage";
  let activeDetailCard = "visual";
  let touchStartX = 0;
  let touchStartY = 0;
  let isTrackingSwipeBack = false;
  const expandedEras = new Set([presidents[0].era]);

  const eraMetaMap = {
    建国期: { years: "1789-1841", presidents: "1-8代" },
    拡張と分断前夜: { years: "1841-1861", presidents: "9-15代" },
    南北戦争と再建: { years: "1861-1881", presidents: "16-20代" },
    産業化と改革: { years: "1881-1901", presidents: "21-25代" },
    進歩主義時代: { years: "1901-1921", presidents: "26-28代" },
    戦間期と大恐慌: { years: "1921-1945", presidents: "29-32代" },
    冷戦と戦後再編: { years: "1945-1981", presidents: "33-39代" },
    保守化とグローバル化: { years: "1981-2009", presidents: "40-43代" },
    現代アメリカ: { years: "2009-現在", presidents: "44-47代" }
  };
  const eraNames = [...new Set(presidents.map((p) => p.era).filter(Boolean))];

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
        const isExpanded = expandedEras.has(group.era);
        const eraBodyId = `lineage-era-body-${slugifyName(group.era)}`;
        const items = group.presidents
          .map((p) => {
            const activeClass = p.id === activeId ? ' style="border-color:#b14f2f;background:#fff4e5"' : "";
            const slug = slugifyName(p.name);
            const imagePath = `./assets/presidents/${slug}.png`;
            return `<button type="button" class="lineage-item" data-president-id="${p.id}"${activeClass}>
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
            </button>`;
          })
          .join("");

        return `<section class="lineage-era-group" data-era="${escapeHtml(group.era)}">
          <button
            type="button"
            class="lineage-era-toggle"
            data-era-toggle="${escapeHtml(group.era)}"
            aria-expanded="${isExpanded ? "true" : "false"}"
            aria-controls="${eraBodyId}"
          >
            <span class="lineage-era-header">${eraYears}${eraName}${eraRange}</span>
            <span class="lineage-era-caret" aria-hidden="true">${isExpanded ? "▾" : "▸"}</span>
          </button>
          <div id="${eraBodyId}" class="lineage-era-body" ${isExpanded ? "" : "hidden"}>
            ${eraPoint}
            <div class="lineage-era-list">${items}</div>
          </div>
        </section>`;
      })
      .join("");

    updateToggleAllButtonLabel();
  }

  function getActivePresident() {
    return presidents.find((p) => p.id === activePresidentId) || presidents[0];
  }

  function buildSymbolModalHtml(president) {
    const paragraphs = [
      `このイラストのモチーフは「${president.symbolCaption}」です。${president.jpName}をひと目で思い出せるように選んでいます。`,
      `背景や遺産の詳しい説明は、別カードでゆっくり読めます。`
    ];
    return paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join("");
  }

  function splitSentences(text) {
    return String(text || "")
      .replaceAll(/\s+/g, " ")
      .match(/[^。！？]+[。！？]?/g)
      ?.map((s) => s.trim())
      .filter((s) => s.length >= 14) || [];
  }

  function keywordTokens(keyword) {
    const raw = String(keyword || "").trim();
    const parts = raw
      .split(/[・\s/／,，]/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);
    return [raw, ...parts].filter(Boolean);
  }

  function scoreSentence(sentence, tokens) {
    let score = 0;
    for (const token of tokens) {
      if (sentence.includes(token)) {
        score += token.length >= 4 ? 6 : 4;
      }
    }
    if (/法|戦争|外交|選挙|改革|危機|経済|統治|再建|連邦|州|安全保障|公民権/.test(sentence)) {
      score += 2;
    }
    return score;
  }

  function selectKeywordSentences(president, keyword, maxCount = 2) {
    const tokens = keywordTokens(keyword);
    const pool = [...splitSentences(president.origin), ...splitSentences(president.legacy)];
    const ranked = pool
      .map((sentence) => ({ sentence, score: scoreSentence(sentence, tokens) }))
      .sort((a, b) => b.score - a.score);

    const selected = [];
    for (const item of ranked) {
      if (!item.sentence || selected.includes(item.sentence)) {
        continue;
      }
      if (item.score <= 0 && selected.length > 0) {
        continue;
      }
      selected.push(item.sentence);
      if (selected.length >= maxCount) {
        break;
      }
    }

    if (selected.length < maxCount) {
      for (const sentence of pool) {
        if (!selected.includes(sentence)) {
          selected.push(sentence);
          if (selected.length >= maxCount) {
            break;
          }
        }
      }
    }
    return selected.slice(0, maxCount);
  }

  function buildKeywordModalHtml(president, keyword) {
    const lines = selectKeywordSentences(president, keyword, 2);
    const heading = `「${keyword}」について`;
    const paragraphs = [`${president.jpName}（${president.term}）`, ...lines];
    return `<p>${escapeHtml(heading)}</p>${paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join("")}`;
  }

  function openInfoModal(title, htmlContent) {
    if (!infoModalEl || !infoModalTitleEl || !infoModalBodyEl) {
      return;
    }
    infoModalTitleEl.textContent = title;
    infoModalBodyEl.innerHTML = htmlContent;
    infoModalEl.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeInfoModal() {
    if (!infoModalEl) {
      return;
    }
    infoModalEl.hidden = true;
    document.body.style.overflow = "";
  }

  function areAllErasExpanded() {
    return eraNames.every((era) => expandedEras.has(era));
  }

  function updateToggleAllButtonLabel() {
    if (!toggleAllErasButton) {
      return;
    }
    const collapseAll = areAllErasExpanded();
    toggleAllErasButton.textContent = collapseAll ? "⊟" : "⊞";
    const label = collapseAll ? "すべて閉じる" : "すべて開く";
    toggleAllErasButton.setAttribute("aria-label", label);
    toggleAllErasButton.setAttribute("title", label);
  }

  function scrollLineageToPresident(presidentId) {
    const itemEl = lineageTrack.querySelector(`[data-president-id="${presidentId}"]`);
    if (itemEl) {
      itemEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    }
    return false;
  }

  function setActiveView(view) {
    activeView = view;
    const showNote = view === "note";
    const showLineage = view === "lineage";
    cardEl.hidden = !showNote;
    lineageViewEl.hidden = !showLineage;
    backToLineageButton.hidden = !showNote;
    if (toggleAllErasButton) {
      toggleAllErasButton.hidden = !showLineage;
    }
  }

  function setActiveDetailCard(cardName) {
    activeDetailCard = cardName === "text" ? "text" : "visual";
    if (visualCardEl) {
      visualCardEl.hidden = activeDetailCard !== "visual";
    }
    if (textCardEl) {
      textCardEl.hidden = activeDetailCard !== "text";
    }
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

  function renderPresident(id) {
    const president = presidents.find((p) => p.id === Number(id)) || presidents[0];
    if (!president) {
      return;
    }

    activePresidentId = president.id;
    renderSymbolVisual(president);
    symbolCaption.textContent = president.symbolCaption;
    rankEl.textContent = formatPresidencyLabel(president);
    nameEl.innerHTML = renderNameStack(president.jpName, president.name);
    termEl.innerHTML = renderTerm(president.term);
    partyEl.textContent = president.party;
    keywordsEl.innerHTML = `<ul class="keyword-list">${president.keywords
      .map(
        (keyword, index) =>
          `<li><button type="button" class="keyword-trigger" data-keyword-index="${index}">${escapeHtml(keyword)}</button></li>`
      )
      .join("")}</ul>`;
    originEl.textContent = president.origin;
    legacyEl.textContent = president.legacy;

    renderLineage(president.id);
  }

  function showLineageView({ scroll = true } = {}) {
    setActiveView("lineage");
    renderLineage(activePresidentId);
    if (scroll) {
      if (!scrollLineageToPresident(activePresidentId)) {
        scrollToLineageTop();
      }
    }
  }

  function showNoteView(presidentId, { pushHistory = false } = {}) {
    renderPresident(presidentId);
    setActiveView("note");
    setActiveDetailCard("visual");
    scrollToImageTop();
    if (pushHistory) {
      window.history.pushState({ view: "note", presidentId: Number(presidentId) }, "");
    }
  }

  function goBackToLineage() {
    if (window.history.state?.view === "note") {
      window.history.back();
      return;
    }
    showLineageView();
  }

  renderPresident(activePresidentId);
  setActiveView("lineage");
  window.history.replaceState(historyStateLineage, "");

  lineageTrack.addEventListener("click", (event) => {
    const toggle = event.target.closest(".lineage-era-toggle");
    if (toggle) {
      const eraName = toggle.dataset.eraToggle;
      if (!eraName) {
        return;
      }
      if (expandedEras.has(eraName)) {
        expandedEras.delete(eraName);
      } else {
        expandedEras.add(eraName);
      }
      renderLineage(activePresidentId);
      return;
    }

    const item = event.target.closest(".lineage-item");
    if (!item) {
      return;
    }
    const selectedId = Number(item.dataset.presidentId);
    showNoteView(selectedId, { pushHistory: true });
  });

  toggleAllErasButton?.addEventListener("click", () => {
    if (areAllErasExpanded()) {
      expandedEras.clear();
    } else {
      eraNames.forEach((era) => expandedEras.add(era));
    }
    renderLineage(activePresidentId);
  });

  backToLineageButton.addEventListener("click", () => {
    goBackToLineage();
  });

  visualCardEl?.addEventListener("click", () => {
    if (activeView !== "note") {
      return;
    }
    setActiveDetailCard("text");
  });

  textCardEl?.addEventListener("click", () => {
    if (activeView !== "note") {
      return;
    }
    setActiveDetailCard("visual");
    scrollToImageTop();
  });

  symbolCaption.addEventListener("click", (event) => {
    event.stopPropagation();
    const president = getActivePresident();
    openInfoModal(`${president.jpName} の象徴`, buildSymbolModalHtml(president));
  });

  keywordsEl.addEventListener("click", (event) => {
    const trigger = event.target.closest(".keyword-trigger");
    if (!trigger) {
      return;
    }
    event.stopPropagation();
    const president = getActivePresident();
    const index = Number(trigger.dataset.keywordIndex);
    const keyword = president.keywords[index];
    if (!keyword) {
      return;
    }
    openInfoModal(`${president.jpName} のキーワード`, buildKeywordModalHtml(president, keyword));
  });

  infoModalCloseEl?.addEventListener("click", closeInfoModal);
  infoModalBackdropEl?.addEventListener("click", closeInfoModal);

  cardEl.addEventListener(
    "touchstart",
    (event) => {
      if (activeView !== "note" || !event.touches.length) {
        isTrackingSwipeBack = false;
        return;
      }
      const touch = event.touches[0];
      isTrackingSwipeBack = touch.clientX <= 28;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    },
    { passive: true }
  );

  cardEl.addEventListener(
    "touchend",
    (event) => {
      if (!isTrackingSwipeBack || !event.changedTouches.length) {
        return;
      }
      isTrackingSwipeBack = false;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = Math.abs(touch.clientY - touchStartY);
      if (deltaX > 72 && deltaY < 48 && deltaX > deltaY * 1.3) {
        goBackToLineage();
      }
    },
    { passive: true }
  );

  window.addEventListener("popstate", (event) => {
    closeInfoModal();
    if (event.state?.view === "note") {
      showNoteView(event.state.presidentId ?? activePresidentId);
      return;
    }
    showLineageView();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeInfoModal();
    }
  });
})();
