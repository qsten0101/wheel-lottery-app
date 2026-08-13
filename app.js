const DEFAULT_ITEMS = ["頭獎", "二獎", "三獎", "再接再厲", "小禮物", "幸運加碼", "請喝飲料", "神秘獎"];
const COLORS = ["#f97316", "#facc15", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#14b8a6", "#a855f7"];
const STORAGE_ITEMS = "wheel_lottery_items";
const STORAGE_HISTORY = "wheel_lottery_history";
const STORAGE_WEIGHTS = "wheel_lottery_weights";
const ADMIN_PASSWORD = "123";

const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const adminBtn = document.getElementById("adminBtn");
const resetBtn = document.getElementById("resetBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const closeWinnerBtn = document.getElementById("closeWinnerBtn");
const closeAdminBtn = document.getElementById("closeAdminBtn");
const loginAdminBtn = document.getElementById("loginAdminBtn");
const applyBtn = document.getElementById("applyBtn");
const sampleBtn = document.getElementById("sampleBtn");
const saveWeightsBtn = document.getElementById("saveWeightsBtn");
const setAllOneBtn = document.getElementById("setAllOneBtn");
const setAllZeroBtn = document.getElementById("setAllZeroBtn");
const refreshOddsBtn = document.getElementById("refreshOddsBtn");
const itemsInput = document.getElementById("itemsInput");
const adminPassword = document.getElementById("adminPassword");
const resultText = document.getElementById("resultText");
const popupWinnerText = document.getElementById("popupWinnerText");
const statusText = document.getElementById("statusText");
const historyList = document.getElementById("historyList");
const oddsList = document.getElementById("oddsList");
const toast = document.getElementById("toast");
const adminDialog = document.getElementById("adminDialog");
const adminLoginBox = document.getElementById("adminLoginBox");
const adminContentBox = document.getElementById("adminContentBox");
const weightEditor = document.getElementById("weightEditor");
const winnerPopup = document.getElementById("winnerPopup");
const confetti = document.querySelector(".confetti");

let items = loadItems();
let weights = loadWeights();
let history = loadHistory();
let rotation = 0;
let isSpinning = false;
let isAdminLoggedIn = false;

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_ITEMS));
    if (Array.isArray(saved) && saved.length >= 2) return saved;
  } catch (error) { console.warn("讀取項目失敗", error); }
  return DEFAULT_ITEMS;
}

function loadWeights() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_WEIGHTS));
    if (saved && typeof saved === "object") return saved;
  } catch (error) { console.warn("讀取倍率失敗", error); }
  return {};
}

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_HISTORY));
    if (Array.isArray(saved)) return saved;
  } catch (error) { console.warn("讀取紀錄失敗", error); }
  return [];
}

function saveItems() { localStorage.setItem(STORAGE_ITEMS, JSON.stringify(items)); }
function saveWeights() { localStorage.setItem(STORAGE_WEIGHTS, JSON.stringify(weights)); }
function saveHistory() { localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history.slice(0, 50))); }
function getWeight(item) {
  const value = Number(weights[item]);
  return Number.isFinite(value) && value >= 0 ? value : 1;
}
function getTotalWeight() { return items.reduce((sum, item) => sum + getWeight(item), 0); }
function normalizeItems(text) { return text.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 80); }
function showToast(message) { toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 1600); }
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
    ctx.strokeStyle = "rgba(255,255,255,.78)";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.save();
    const textAngle = start + angle / 2;
    const textRadius = radius * 0.66;
    ctx.rotate(textAngle);
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
    ctx.fillStyle = "#fff";
    ctx.font = getFont(item, items.length);
    ctx.shadowColor = "rgba(0,0,0,.28)";
    ctx.shadowBlur = 4;
    ctx.fillText(shorten(item), 0, 0);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(0, 0, 78, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(124,58,237,.35)";
  ctx.stroke();
  ctx.restore();
}

function getFont(text, count) {
  const length = [...text].length;
  const base = count > 16 ? 20 : count > 10 ? 24 : 31;
  const size = Math.max(16, Math.min(base, Math.floor(250 / Math.max(length, 4))));
  return `900 ${size}px system-ui, -apple-system, "Noto Sans TC", sans-serif`;
}
function shorten(text) { const chars = [...text]; return chars.length > 12 ? `${chars.slice(0, 12).join("")}…` : text; }

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
  const baseSegmentCenter = index * anglePerItem - Math.PI / 2 + anglePerItem / 2;
  const pointerAngle = -Math.PI / 2;
  const jitter = (Math.random() - 0.5) * anglePerItem * 0.42;
  return pointerAngle - baseSegmentCenter + jitter;
}

function spin() {
  if (isSpinning) return;
  if (items.length < 2) { showToast("請至少設定 2 個獎項"); return; }
  if (getTotalWeight() <= 0) { showToast("所有倍率都是 0，請先到後台設定至少一個可抽項目"); return; }

  const winnerIndex = pickWeightedWinnerIndex();
  const winner = items[winnerIndex];
  isSpinning = true;
  spinBtn.disabled = true;
  resultText.textContent = "抽獎中...";
  statusText.textContent = "轉盤旋轉中，依照後台倍率抽獎！";

  const extraRotations = 6 + Math.floor(Math.random() * 4);
  const startRotation = rotation;
  const targetRotation = extraRotations * Math.PI * 2 + calculateRotationToIndex(winnerIndex);
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
    resultText.textContent = winner;
    statusText.textContent = `恭喜抽中：${winner}`;
    addHistory(winner);
    showWinnerPopup(winner);
    isSpinning = false;
    spinBtn.disabled = false;
  }
  requestAnimationFrame(animate);
}

function showWinnerPopup(winner) {
  popupWinnerText.textContent = winner;
  confetti.innerHTML = "";
  const colors = ["#f97316", "#facc15", "#22c55e", "#06b6d4", "#8b5cf6", "#ec4899", "#ef4444"];
  for (let i = 0; i < 48; i += 1) {
    const piece = document.createElement("span");
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    piece.style.animationDuration = `${1.4 + Math.random() * 1.2}s`;
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    confetti.appendChild(piece);
  }
  winnerPopup.classList.add("show");
  winnerPopup.setAttribute("aria-hidden", "false");
}
function closeWinnerPopup() { winnerPopup.classList.remove("show"); winnerPopup.setAttribute("aria-hidden", "true"); }

function addHistory(winner) {
  const now = new Date();
  const time = now.toLocaleString("zh-TW", { hour12: false });
  history.unshift({ winner, time, weight: getWeight(winner) });
  history = history.slice(0, 50);
  saveHistory();
  renderHistory();
}
function renderHistory() {
  historyList.innerHTML = "";
  if (history.length === 0) { const empty = document.createElement("li"); empty.textContent = "尚無紀錄"; historyList.appendChild(empty); return; }
  history.forEach((record) => { const li = document.createElement("li"); li.textContent = `${record.winner}（${record.time}）`; historyList.appendChild(li); });
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
  renderOdds();
}
function applyItems() {
  const nextItems = normalizeItems(itemsInput.value);
  if (nextItems.length < 2) { showToast("請至少輸入 2 個獎項"); return; }
  items = nextItems;
  syncWeightsWithItems();
  saveItems();
  rotation = 0;
  resultText.textContent = "尚未抽獎";
  statusText.textContent = "獎項已更新，請按「開始」抽獎";
  renderWeightEditor();
  drawWheel();
  showToast("獎項已套用");
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
function resetAll() {
  items = [...DEFAULT_ITEMS];
  weights = {};
  items.forEach((item) => { weights[item] = 1; });
  history = [];
  saveItems(); saveWeights(); saveHistory();
  syncInput(); renderHistory(); renderWeightEditor();
  resultText.textContent = "尚未抽獎";
  statusText.textContent = "已重設獎項、倍率與紀錄";
  rotation = 0; drawWheel(); showToast("已重設");
}
function clearHistory() { history = []; saveHistory(); renderHistory(); showToast("紀錄已清除"); }
function openAdmin() {
  adminDialog.showModal();
  if (isAdminLoggedIn) { adminLoginBox.classList.add("hidden"); adminContentBox.classList.remove("hidden"); syncInput(); renderWeightEditor(); }
  else { adminLoginBox.classList.remove("hidden"); adminContentBox.classList.add("hidden"); adminPassword.value = ""; setTimeout(() => adminPassword.focus(), 50); }
}
function loginAdmin() {
  if (adminPassword.value !== ADMIN_PASSWORD) { showToast("管理密碼錯誤"); return; }
  isAdminLoggedIn = true;
  adminLoginBox.classList.add("hidden"); adminContentBox.classList.remove("hidden"); syncInput(); renderWeightEditor(); showToast("已進入後台");
}
function updateAllWeight(value) { weightEditor.querySelectorAll("input").forEach((input) => { input.value = value; }); }

spinBtn.addEventListener("click", spin);
adminBtn.addEventListener("click", openAdmin);
resetBtn.addEventListener("click", resetAll);
clearHistoryBtn.addEventListener("click", clearHistory);
closeAdminBtn.addEventListener("click", () => adminDialog.close());
loginAdminBtn.addEventListener("click", loginAdmin);
adminPassword.addEventListener("keydown", (e) => { if (e.key === "Enter") loginAdmin(); });
applyBtn.addEventListener("click", applyItems);
sampleBtn.addEventListener("click", () => { itemsInput.value = DEFAULT_ITEMS.join("\n"); showToast("已載入範例，按套用獎項即可使用"); });
saveWeightsBtn.addEventListener("click", saveWeightEditor);
setAllOneBtn.addEventListener("click", () => updateAllWeight(1));
setAllZeroBtn.addEventListener("click", () => updateAllWeight(0));
refreshOddsBtn.addEventListener("click", renderOdds);
closeWinnerBtn.addEventListener("click", closeWinnerPopup);
winnerPopup.addEventListener("click", (event) => { if (event.target === winnerPopup) closeWinnerPopup(); });
window.addEventListener("resize", fitCanvas);

syncWeightsWithItems();
saveItems();
syncInput();
renderHistory();
renderWeightEditor();
fitCanvas();
