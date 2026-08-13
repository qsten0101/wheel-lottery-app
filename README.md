# 轉盤抽抽樂

這是一個完全前端的手機轉盤抽獎工具，可直接上傳到 GitHub Pages 使用。

## 檔案

- `index.html`：主畫面
- `style.css`：樣式
- `app.js`：轉盤邏輯
- `manifest.json`：PWA 設定
- `service-worker.js`：離線快取
- `icon-192.png`、`icon-512.png`：手機主畫面圖示

## 上傳 GitHub Pages

1. 建立 GitHub repository，例如 `wheel-lottery-app`。
2. 將本資料夾所有檔案上傳到 repository 根目錄。
3. 到 `Settings` → `Pages`。
4. Source 選 `Deploy from a branch`。
5. Branch 選 `main`，Folder 選 `/root`。
6. 儲存後開啟 GitHub Pages 網址。

## 手機使用

- Android：用 Chrome 開啟網址，選「新增至主畫面」或「安裝應用程式」。
- iPhone：用 Safari 開啟網址，分享，選「加入主畫面」。

## 自訂獎項

在右側輸入框中，每行輸入一個項目，按「套用項目」。若想提高某項機率，可重複輸入同一項。
