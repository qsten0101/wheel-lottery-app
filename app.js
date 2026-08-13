const DEFAULT_ITEMS = ["頭獎", "二獎", "三獎", "再接再厲", "小禮物", "幸運加碼", "請喝飲料", "神秘獎"];
const COLORS = ["#f97316", "#facc15", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#14b8a6", "#a855f7"];
const STORAGE_ITEMS = "wheel_lottery_items";
const STORAGE_HISTORY = "wheel_lottery_history";
const STORAGE_WEIGHTS = "wheel_lottery_weights";
const ADMIN_PASSWORD = "admin123";

const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const applyBtn = document.getElementById("applyBtn");
const sampleBtn = document.getElementById("sampleBtn");
const resetBtn = document.getElementById("resetBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const refreshOddsBtn = document.getElementById("refreshOddsBtn");
const adminBtn = document.getElementById("adminBtn");
const closeAdminBtn = document.getElementById("closeAdminBtn");
const loginAdminBtn = document.getElementById("loginAdminBtn");
const saveWeightsBtn = document.getElementById("saveWeightsBtn");
const setAllOneBtn = document.getElementById("setAllOneBtn");
const setAllZeroBtn = document.getElementById("setAllZeroBtn");
const itemsInput = document.getElementById("itemsInput");
const adminPassword = document.getElementById("adminPassword");
const resultText = document.getElementById("resultText");
const statusText = document.getElementById("statusText");
const historyList = document.getElementById("historyList");
const oddsList = document.getElementById("oddsList");
const toast = document.getElementById("toast");
const adminDialog = document.getElementById("adminDialog");
const adminLoginBox = document.getElementById("adminLoginBox");
const adminContentBox = document.getElementById("adminContentBox");
const weightEditor = document.getElementById("weightEditor");

let items = loadItems();
let history = loadHistory();
let weights = loadWeights();
let rotation = 0;
let isSpinning = false;
let currentWinnerIndex = 0;
let isAdminLoggedIn = false;

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_ITEMS));
    if (Array.isArray(saved) && saved.length >= 2) return saved;
  } catch (error) { console.warn("讀取項目失敗", error); }
  return DEFAULT_ITEMS;
}

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_HISTORY));
    if (Array.isArray(saved)) return saved;
  } catch (error) { console.warn("讀取紀錄失敗", error); }
  return [];
}

function loadWeights() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_WEIGHTS));
    if (saved && typeof saved === "object") return saved;
  } catch (error) { console.warn("讀取倍率失敗", error); }
  return {};
}

function saveItems() { localStorage.setItem(STORAGE_ITEMS, JSON.stringify(items)); }
function saveHistory() { localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history.slice(0, 30))); }
function saveWeights() { localStorage.setItem(STORAGE_WEIGHTS, JSON.stringify(weights)); }
function getWeight(item) {
  const value = Number(weights[item]);
  return Number.isFinite(value) && value >= 0 ? value : 1;
}
function getTotalWeight() { return items.reduce((sum, item) => sum + getWeight(item), 0); }

function normalizeItems(text) {
  return text.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 60);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1600);
}

function syncInput() { itemsInput.value = items.join("\n"); }

function syncWeightsWithItems() {
  const nextWeights = {};
  items.forEach((item) => { nextWeights[item] = getWeight(item); });
  weights = nextWeights;
  saveWeights();
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
    const weight = getWeight(item);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = weight === 0 ? "#9ca3af" : COLORS[index % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.save();
    const textAngle = start + angle / 2;
    const textRadius = radius * 0.68;
    ctx.rotate(textAngle);

    // Keep labels readable: flip text on the left side of the wheel.
    const normalizedTextAngle = ((textAngle + rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const shouldFlipText = normalizedTextAngle > Math.PI / 2 && normalizedTextAngle < Math.PI * 1.5;
    if (shouldFlipText) {
      ctx.rotate(Math.PI);
      ctx.textAlign = "left";
      ctx.translate(-textRadius, 0);
    } else {
      ctx.textAlign = "right";
      ctx.translate(textRadius, 0);
    }

    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = getFont(item, items.length);
    ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
    ctx.shadowBlur = 4;
    ctx.fillText(shorten(item), 0, -10);
    ctx.font = "800 22px system-ui, -apple-system, 'Noto Sans TC', sans-serif";
    ctx.fillText(`x${weight}`, 0, 24);
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

function pickWeightedWinnerIndex() {
  const total = getTotalWeight();
  if (total <= 0) return -1;
  let ticket = Math.random() * total;
  for (let index = 0; index < items.length; index += 1) {
    ticket -= getWeight(items[index]);
    if (ticket < 0) return index;
  }
  return items.length - 1;
}

function calculateRotationToIndex(index) {
  const anglePerItem = (Math.PI * 2) / items.length;

  // drawWheel() starts every segment at -90 degrees.
  // Therefore the visual center of item[index] before wheel rotation is:
  // index * anglePerItem - PI / 2 + anglePerItem / 2.
  // The pointer is also at -90 degrees, so target rotation must use the same coordinate system.
  // This fixes the previous mismatch where the displayed result and pointer segment were different.
  const baseSegmentCenter = index * anglePerItem - Math.PI / 2 + anglePerItem / 2;
  const pointerAngle = -Math.PI / 2;
  const jitter = (Math.random() - 0.5) * anglePerItem * 0.46;

  return pointerAngle - baseSegmentCenter + jitter;
}

function spin() {
  if (isSpinning) return;
  if (items.length < 2) { showToast("請至少輸入 2 個項目"); return; }
  if (getTotalWeight() <= 0) { showToast("所有倍率都是 0，請先設定至少一個可抽項目"); return; }

  currentWinnerIndex = pickWeightedWinnerIndex();
  if (currentWinnerIndex < 0) return;

  isSpinning = true;
  spinBtn.disabled = true;
  resultText.textContent = "抽獎中...";
  statusText.textContent = "轉盤旋轉中，依照後台倍率抽獎！";

  const extraRotations = 6 + Math.floor(Math.random() * 4);
  const startRotation = rotation;
  const stopRotation = calculateRotationToIndex(currentWinnerIndex);
  const targetRotation = extraRotations * Math.PI * 2 + stopRotation;
  const duration = 4600;
  const startTime = performance.now();

  function animate(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    rotation = startRotation + (targetRotation - startRotation) * eased;
    drawWheel();
    if (progress < 1) { requestAnimationFrame(animate); return; }

    rotation = targetRotation % (Math.PI * 2);
    drawWheel();
    const winner = items[currentWinnerIndex];
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
  if (nextItems.length < 2) { showToast("請至少輸入 2 個項目"); return; }
  items = nextItems;
  syncWeightsWithItems();
  rotation = 0;
  resultText.textContent = "尚未抽獎";
  statusText.textContent = "已套用新項目，請按「開始」抽獎";
  drawWheel();
  renderOdds();
  if (isAdminLoggedIn) renderWeightEditor();
  showToast("項目已套用，倍率已同步");
}

function addHistory(winner) {
  const now = new Date();
  const time = now.toLocaleString("zh-TW", { hour12: false });
  history.unshift({ winner, time, weight: getWeight(winner) });
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
    const weightText = record.weight !== undefined ? `，倍率 x${record.weight}` : "";
    li.textContent = `${record.winner}${weightText}（${record.time}）`;
    historyList.appendChild(li);
  });
}

function renderOdds() {
  oddsList.innerHTML = "";
  const total = getTotalWeight();
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "odds-item";
    const weight = getWeight(item);
    const percent = total > 0 ? ((weight / total) * 100).toFixed(1) : "0.0";
    row.innerHTML = `<strong></strong><span>x${weight}｜${percent}%</span>`;
    row.querySelector("strong").textContent = item;
    oddsList.appendChild(row);
  });
}

function resetItems() {
  items = DEFAULT_ITEMS;
  weights = {};
  DEFAULT_ITEMS.forEach((item) => { weights[item] = 1; });
  saveItems();
  saveWeights();
  syncInput();
  rotation = 0;
  resultText.textContent = "尚未抽獎";
  statusText.textContent = "已重設為預設名單與倍率";
  drawWheel();
  renderOdds();
  if (isAdminLoggedIn) renderWeightEditor();
  showToast("已重設名單與倍率");
}

function clearHistory() {
  history = [];
  saveHistory();
  renderHistory();
  showToast("紀錄已清除");
}

function openAdmin() {
  adminDialog.showModal();
  if (isAdminLoggedIn) {
    adminLoginBox.classList.add("hidden");
    adminContentBox.classList.remove("hidden");
    renderWeightEditor();
  } else {
    adminLoginBox.classList.remove("hidden");
    adminContentBox.classList.add("hidden");
    adminPassword.value = "";
    setTimeout(() => adminPassword.focus(), 50);
  }
}

function closeAdmin() { adminDialog.close(); }

function loginAdmin() {
  if (adminPassword.value !== ADMIN_PASSWORD) {
    showToast("管理密碼錯誤");
    return;
  }
  isAdminLoggedIn = true;
  adminLoginBox.classList.add("hidden");
  adminContentBox.classList.remove("hidden");
  renderWeightEditor();
  showToast("已進入倍率後台");
}

function renderWeightEditor() {
  weightEditor.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("label");
    row.className = "weight-row";
    const span = document.createElement("span");
    span.textContent = item;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "999";
    input.step = "0.1";
    input.value = getWeight(item);
    input.dataset.item = item;
    row.append(span, input);
    weightEditor.appendChild(row);
  });
}

function updateAllWeight(value) {
  weightEditor.querySelectorAll("input").forEach((input) => { input.value = value; });
}

function saveWeightEditor() {
  const nextWeights = {};
  weightEditor.querySelectorAll("input").forEach((input) => {
    const value = Number(input.value);
    nextWeights[input.dataset.item] = Number.isFinite(value) && value >= 0 ? value : 0;
  });
  weights = nextWeights;
  saveWeights();
  drawWheel();
  renderOdds();
  showToast("倍率已儲存");
}

spinBtn.addEventListener("click", spin);
applyBtn.addEventListener("click", applyItems);
sampleBtn.addEventListener("click", () => { itemsInput.value = DEFAULT_ITEMS.join("\n"); showToast("已載入範例，按套用項目即可使用"); });
resetBtn.addEventListener("click", resetItems);
clearHistoryBtn.addEventListener("click", clearHistory);
refreshOddsBtn.addEventListener("click", renderOdds);
adminBtn.addEventListener("click", openAdmin);
closeAdminBtn.addEventListener("click", closeAdmin);
loginAdminBtn.addEventListener("click", loginAdmin);
adminPassword.addEventListener("keydown", (event) => { if (event.key === "Enter") loginAdmin(); });
saveWeightsBtn.addEventListener("click", saveWeightEditor);
setAllOneBtn.addEventListener("click", () => updateAllWeight(1));
setAllZeroBtn.addEventListener("click", () => updateAllWeight(0));
window.addEventListener("resize", fitCanvas);

syncWeightsWithItems();
syncInput();
renderHistory();
renderOdds();
fitCanvas();
