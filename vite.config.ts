import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 載入環境變數，這樣我們可以在設定檔中存取它們
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // 設定 Base Path。
    // 當部署到 user.github.io/repo/ 時，base 應該是 './' 或 '/repo/'。
    // 使用 './' 相對路徑通常是最安全的選擇，可以適應不同的 Repo 名稱。
    base: './',
    define: {
      // 這是關鍵：Vite 預設不支援在瀏覽器中使用 process.env。
      // 我們需要手動將編譯時的 process.env.API_KEY 替換為實際的值。
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      outDir: 'dist',
    }
  };
});