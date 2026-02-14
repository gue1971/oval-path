(function initOvalPath() {
  const presidents = window.PRESIDENTS || [];

  const select = document.getElementById("president-select");
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

  function buildSelectOptions() {
    select.innerHTML = presidents
      .map(
        (p) =>
          `<option value="${p.id}">${p.id}. ${p.jpName} (${p.name})</option>`
      )
      .join("");
  }

  function renderLineage(activeId) {
    lineageTrack.innerHTML = presidents
      .map((p) => {
        const activeClass = p.id === activeId ? " style=\"border-color:#b14f2f;background:#fff4e5\"" : "";
        return `<div class="lineage-item"${activeClass}>
          <span class="index">#${p.id}</span>
          <span>${p.jpName}</span>
          <span class="axis">${p.axis}</span>
        </div>`;
      })
      .join("");
  }

  function renderPresident(id) {
    const president = presidents.find((p) => p.id === Number(id)) || presidents[0];

    symbolArt.textContent = president.symbol;
    symbolCaption.textContent = president.symbolCaption;
    nameEl.textContent = `${president.jpName} / ${president.name}`;
    termEl.textContent = president.term;
    partyEl.textContent = president.party;
    keywordsEl.textContent = president.keywords.join(" / ");
    originEl.textContent = president.origin;
    legacyEl.textContent = president.legacy;

    renderLineage(president.id);
  }

  buildSelectOptions();
  select.value = String(presidents[0].id);
  renderPresident(select.value);

  select.addEventListener("change", (event) => {
    renderPresident(event.target.value);
  });
})();
