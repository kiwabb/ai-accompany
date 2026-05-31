import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'

// pdfjs-dist v5 直接调 URL.parse() —— Safari<17 / Chrome<120 / Firefox<126 没这个静态方法，
// 不打补丁 react-pdf 的 <Document> 会抛 TypeError 让整页白屏。
if (typeof (URL as unknown as { parse?: unknown }).parse !== 'function') {
  (URL as unknown as { parse: (input: string, base?: string) => URL | null }).parse =
    (input: string, base?: string) => {
      try { return new URL(input, base); } catch { return null; }
    };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
