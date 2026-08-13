const DEFAULT_ITEMS = ["頭獎", "二獎", "三獎", "再接再厲", "小禮物", "幸運加碼", "請喝飲料", "神秘獎"];
const COLORS = ["#f97316", "#facc15", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#14b8a6", "#a855f7"];
const STORAGE_ITEMS = "wheel_lottery_items";
const STORAGE_HISTORY = "wheel_lottery_history";

const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const applyBtn = document.getElementById("applyBtn");
const sampleBtn = document.getElementById("sampleBtn");
const resetBtn = document.getElementById("resetBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const itemsInput = document.getElementById("itemsInput");
const resultText = document.getElementById("resultText");
const statusText = document.getElementById("statusText");
const historyList = document.getElementById("historyList");
const toast = document.getElementById("toast");

let items = loadItems();
let history = loadHistory();
let rotation = 0;
let isSpinning = false;

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_ITEMS));
    if (Array.isArray(saved) && saved.length >= 2) return saved;
  } catch (error) {
    console.warn("讀取項目失敗", error);
  }
  return DEFAULT_ITEMS;
}

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_HISTORY));
    if (Array.isArray(saved)) return saved;
  } catch (error) {
    console.warn("讀取紀錄失敗", error);
  }
  return [];
}

function saveItems() {
  localStorage.setItem(STORAGE_ITEMS, JSON.stringify(items));
}

function saveHistory() {
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history.slice(0, 30)));
}

function normalizeItems(text) {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 60);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1600);
}

function syncInput() {
  itemsInput.value = items.join("\n");
}

function fitCanvas() {
  const size = 720;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = size * ratio;
  canvas.height = size * ratio;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawWheel();
}

function drawWheel() {
  const size = 720;
  const center = size / 2;
  const radius = center - 18;
  const angle = (Math.PI * 2) / items.length;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(rotation);

  items.forEach((item, index) => {
    const start = index * angle - Math.PI / 2;
    const end = start + angle;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = COLORS[index % COLORS.length];
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + angle / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = getFont(item, items.length);
    ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
    ctx.shadowBlur = 4;
    ctx.fillText(shorten(item), radius - 36, 0);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(0, 0, 78, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(124, 58, 237, 0.35)";
  ctx.stroke();
  ctx.restore();
}

function getFont(text, count) {
  const length = [...text].length;
  const base = count > 16 ? 20 : count > 10 ? 24 : 30;
  const size = Math.max(16, Math.min(base, Math.floor(230 / Math.max(length, 4))));
  return `900 ${size}px system-ui, -apple-system, "Noto Sans TC", sans-serif`;
}

function shorten(text) {
  const chars = [...text];
  return chars.length > 12 ? `${chars.slice(0, 12).join("")}…` : text;
}

function getWinningIndex() {
  const normalized = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const anglePerItem = (Math.PI * 2) / items.length;
  const pointerAngle = (Math.PI * 1.5 - normalized + Math.PI * 2) % (Math.PI * 2);
  return Math.floor(pointerAngle / anglePerItem) % items.length;
}

function spin() {
  if (isSpinning) return;
  if (items.length < 2) {
    showToast("請至少輸入 2 個項目");
    return;
  }

  isSpinning = true;
  spinBtn.disabled = true;
  resultText.textContent = "抽獎中...";
  statusText.textContent = "轉盤旋轉中，祝你好運！";

  const extraRotations = 6 + Math.random() * 4;
  const randomStop = Math.random() * Math.PI * 2;
  const startRotation = rotation;
  const targetRotation = rotation + extraRotations * Math.PI * 2 + randomStop;
  const duration = 4600;
  const startTime = performance.now();

  function animate(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    rotation = startRotation + (targetRotation - startRotation) * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }

    rotation = targetRotation % (Math.PI * 2);
    drawWheel();
    const winnerIndex = getWinningIndex();
    const winner = items[winnerIndex];
    resultText.textContent = winner;
    statusText.textContent = `恭喜抽中：${winner}`;
    addHistory(winner);
    isSpinning = false;
    spinBtn.disabled = false;
  }

  requestAnimationFrame(animate);
}

function applyItems() {
  const nextItems = normalizeItems(itemsInput.value);
  if (nextItems.length < 2) {
    showToast("請至少輸入 2 個項目");
    return;
  }
  items = nextItems;
  saveItems();
  rotation = 0;
  resultText.textContent = "尚未抽獎";
  statusText.textContent = "已套用新項目，請按「開始」抽獎";
  drawWheel();
  showToast("項目已套用");
}

function addHistory(winner) {
  const now = new Date();
  const time = now.toLocaleString("zh-TW", { hour12: false });
  history.unshift({ winner, time });
  history = history.slice(0, 30);
  saveHistory();
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  if (history.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "尚無紀錄";
    historyList.appendChild(empty);
    return;
  }

  history.forEach((record) => {
    const li = document.createElement("li");
    li.textContent = `${record.winner}（${record.time}）`;
    historyList.appendChild(li);
  });
}

function resetItems() {
  items = DEFAULT_ITEMS;
  saveItems();
  syncInput();
  rotation = 0;
  resultText.textContent = "尚未抽獎";
  statusText.textContent = "已重設為預設名單";
  drawWheel();
  showToast("已重設名單");
}

function clearHistory() {
  history = [];
  saveHistory();
  renderHistory();
  showToast("紀錄已清除");
}

spinBtn.addEventListener("click", spin);
applyBtn.addEventListener("click", applyItems);
sampleBtn.addEventListener("click", () => {
  itemsInput.value = DEFAULT_ITEMS.join("\n");
  showToast("已載入範例，按套用項目即可使用");
});
resetBtn.addEventListener("click", resetItems);
clearHistoryBtn.addEventListener("click", clearHistory);
window.addEventListener("resize", fitCanvas);

syncInput();
renderHistory();
fitCanvas();
