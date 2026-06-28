(() => {
  const textOf = (el) => (el?.textContent || "").trim();

  function bindNextDestinationPanel() {
    const objective = document.getElementById("play-objective");
    const area = document.getElementById("play-area");
    const next = document.getElementById("next-destination-label");
    const nextArea = document.getElementById("next-destination-area");
    if (!objective || !next) return;

    const update = () => {
      const objectiveText = textOf(objective);
      const areaText = textOf(area);
      next.textContent = objectiveText || "現在の目的を確認中";
      if (nextArea) nextArea.textContent = areaText || "AURELIA";
    };

    const observer = new MutationObserver(update);
    observer.observe(objective, { childList: true, characterData: true, subtree: true });
    if (area) observer.observe(area, { childList: true, characterData: true, subtree: true });
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindNextDestinationPanel, { once: true });
  } else {
    bindNextDestinationPanel();
  }
})();
