import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  // 開發中、產品路徑
  // hex_react_template 改成專案名稱
  // base: process.env.NODE_ENV === "production" ? "/hex_react_week3/" : "/",
  plugins: [react()],
});
