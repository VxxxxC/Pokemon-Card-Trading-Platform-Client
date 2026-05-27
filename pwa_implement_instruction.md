# Coding Agent Prompt: Implement PWA Environment Status Indicator inside Navbar (with iOS Support)

## 🎯 Role & Context
You are an expert frontend developer specializing in Next.js (App Router), Tailwind CSS, and TypeScript.
Your task is to implement a client-side environment status indicator inside the Global Header/Navbar. It should detect whether the current user is visiting from a standard browser or inside an installed PWA standalone window. It must also handle iOS Safari's unique PWA constraints gracefully.

## 🎨 Design System Constraints (Strictly Follow)
- **Theme**: Dark Mode Only (Warm dark tones, absolutely NO cold blue/light tech aesthetics).
- **Colors**: 
  - `--bg-card`: `#26211C` (Status pill background)
  - `--brand`: `#d4a574` (Warm Gold for PWA indicator/glowing dot)
  - `--text-primary`: `#eae1da` (Ivory white)
  - `--text-secondary`: `#d4c4b7` (Secondary metadata)
  - `--text-disabled`: `#50453b` (Muted dark gray for browser state)
- **Typography**: **Strictly use `font-mono` (JetBrains Mono)** for the status text (`PWA APP` / `BROWSER` / `iOS PWA HINT`) to maintain a high-density financial-terminal aesthetic.

---

## 🛠️ Implementation Tasks

### Step 1: Create or Review the PWA Environment Detection Hook
- **File Path**: `hooks/usePWAEnvironment.ts`
- **Requirements**:
  - Implement a hook to detect `standalone` display mode.
  - **Crucial iOS Support**: iOS Safari does not support the native `beforeinstallprompt` event. You must explicitly detect iOS users inside the regular browser by checking `window.navigator.userAgent` containing iPhone/iPad AND checking `!(window.navigator as any).standalone`.

```typescript
'use client';

import { useEffect, useState } from 'react';

export function usePWAEnvironment() {
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOSBrowser, setIsIOSBrowser] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Standard PWA window detection
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    setIsStandalone(mediaQuery.matches);

    // 2. iOS standalone detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isIOSStandalone = (window.navigator as any).standalone === true;

    if (isIOSStandalone) {
      setIsStandalone(true);
    } else if (isIOS && !isIOSStandalone) {
      setIsIOSBrowser(true); // User is on iOS Safari but hasn't installed PWA
    }

    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { isStandalone, isIOSBrowser, isBrowser: !isStandalone && !isIOSBrowser };
}
```

### Step 2: Implement the Navbar Status Component with iOS Interaction
- **File Path**: `components/shared/PWANavbarStatus.tsx`
- **Requirements**:
  - Create a Client Component (`'use client'`).
  - **Layout & Style**: A minimal status pill (`h-8 flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#26211C] border border-[rgba(237,232,224,0.06)]`).
  - **UI States & State Machine**:
    1. **`isStandalone` State**: Show a glowing warm gold dot (`bg-[#d4a574] shadow-[0_0_8px_#d4a574] animate-pulse`) and the uppercase text `PWA APP` in `font-mono`.
    2. **`isIOSBrowser` State**: Show an orange or muted gold dot (`bg-[#d4a574]/60`). When the user clicks this specific pill, trigger a minimal dropdown or toast guiding them how to install on iOS: *"點擊瀏覽器底部的 📤 分享按鈕，然後選擇『加入主畫面』以啟用全息終端 App"*
    3. **Standard `isBrowser` State**: Show a low-profile muted dot (`bg-[#50453b]`) and the text `BROWSER` in `font-mono`. No special click actions required.

### Step 3: Inject Into Global Navbar
- Import `PWANavbarStatus` and absolute position or flex-align it next to the user profile avatar or navigation utilities inside your main header layer (e.g., `components/shared/Navbar.tsx`).

---

## 🤖 Coding Instructions for Copilot
1. Ensure all elements handle server-side rendering (SSR) hydration checks gracefully by matching default `false` or `null` states until client-side `useEffect` mounts to prevent HTML mismatch.
2. Ensure pure, strict type interfaces for all custom hook parameters and JSX components.
3. Keep the styling extremely clean, matching the dark terminal aesthetic, and use only smooth Tailwind animations (`transition-all duration-200`).
