# Vibe Check 🎧👕

**Full-Stack AI Stylist — Turn your music taste into shoppable outfits**

---

## 🚀 Overview

Vibe Check is a full-stack AI application that transforms your Spotify playlists into curated, shoppable fashion lookbooks.

It bridges the gap between **music taste and personal style** by translating audio “vibes” into real outfits pulled from a live product catalog.

**Input:** Spotify playlist  
**Output:** A fully styled outfit (top, bottom, shoes) + aesthetic breakdown  

From sound → style → shopping in ~3–5 seconds.

---

## ✨ Features

- 🎵 Playlist → Style Tags  
  Converts any Spotify link into structured fashion aesthetics  

- 🤖 AI Outfit Generation  
  Uses a 2-step AI system to curate complete outfits  

- 🧥 Lookbook Rendering  
  Displays styled outfits with aesthetic names and interpretations  

- 🛍️ Shoppable Experience  
  Direct links to real products from the catalog  

- 📤 Sharing Built-In  
  Native mobile sharing + desktop clipboard fallback  

- ⚡ Real-time Database + Fallback Logic  
  Ensures consistent outfit generation even with sparse data  

---

## 🧠 How It Works

### 1. Data Layer (Supabase + Catalog Normalization)

- Connects to Supabase on app load  
- Pulls products from `Product_Catalog_5`  
- Normalizes all data into a consistent structure:
  - `id`, `title`, `price`, `image`  
- Handles messy source data (e.g., `image_url` → `image`)  
- Includes real-time health indicator:
  - Pulsing dot = connected  
  - Gray dot = failure + retry  

---

### 2. User Input (Capturing the Vibe)

- Spotify playlist URL (used as semantic input)  
- Gender spectrum slider:
  - 0–45 → Male  
  - 46–54 → Unisex  
  - 55–100 → Female  

- Mobile UX:
  - Interactive slider feedback  
  - Paste button via Clipboard API  
  - Quick clear/reset  

---

### 3. AI Phase 1 — Style Translation

- Triggered by `generateLookbook`  
- Sends playlist to Google Gemini using `TAGS_PROMPT`  

Transforms music into structured fashion signals like:
["streetwear","dark","oversized","urban"]

---

### 4. AI Phase 2 — Outfit Curation

- Filters catalog based on gender selection  
- Reduces dataset to relevant subset  

**Fallback Logic:**
- Injects unisex/female items if categories are missing  

**Stylist Constraints:**
- Select exactly:
  - 1 Top  
  - 1 Bottom  
  - 1 Shoe  

- Must match style tags and be cohesive  

**Repeat Avoidance:**
- Tracks `previousOutfitIds`  
- Prevents duplicate outfits  

---

### 5. Mapping & Rendering (Lookbook)

- Maps AI-selected IDs → full product data  
- Builds Lookbook object:
  - Aesthetic name  
  - Interpretation  
  - Outfit items  

- UI powered by Framer Motion:
  - Smooth transitions  
  - Sliding outfit cards  

---

### 6. Interaction (Shop + Share)

- 🛍️ Direct product links to retailers  
- 📤 Web Share API:
  - Mobile → native share sheet  
  - Desktop → clipboard copy  

- 🖼️ Image reliability:
  - `referrerPolicy="no-referrer"`  

---

### 7. Performance & Reliability

- Optimized with `useMemo` + `useCallback`  
- Error boundaries prevent crashes  
- Graceful fallback to home on failure  
- Database health monitoring  

---

## 🏗️ Tech Stack

- Frontend: React / Next.js  
- Backend: Supabase  
- AI: Google Gemini  
- Animations: Framer Motion  
- APIs:
  - Spotify  
  - Web Share API  
  - Clipboard API  

---

## 📦 Data Model

### Product_Catalog_5

A self-curated product catalog built by crawling Shopify-based e-commerce sites.

Includes:
- ID  
- Title  
- Price  
- Image URL  
- Product URL  
- Category metadata  

### Normalization

- Standardizes inconsistent fields  
- Ensures all products are usable by AI  
- Enables reliable ID mapping  

### Fallback Handling

- Dynamically fills missing categories  
- Prevents incomplete outfits  

---

## ⚙️ AI Architecture

### Two-Step System

**1. Tag Generation**
- Input: Playlist  
- Output: Style tags  

**2. Outfit Selection**
- Input: Tags + filtered catalog  
- Output: Top + Bottom + Shoes  

### Prompting

- Structured prompts with constraints  
- Ensures consistency + quality  

### Session Memory

- Tracks used items  
- Ensures fresh outputs  

---

## 🎨 UX Highlights

- Mobile-first design  
- Interactive gender slider  
- Clipboard paste functionality  
- Smooth loading transitions  
- Real-time system health indicator  

---

## 🔗 Sharing & Commerce

- Direct-to-retailer links  
- Mobile-native sharing  
- Desktop clipboard fallback  

Creates a loop:
Discover → Generate → Share → Repeat  

---

## ⚡ Performance & Reliability

- Memoization for performance  
- Robust error handling  
- Catalog fallback logic  
- Live DB connection status  

---

## 🛣️ Roadmap

- Personalized style profiles  
- Expanded retailer integrations  
- Social sharing + community features  
- Improved ranking + recommendations  

---

## Summary

Vibe Check transforms a playlist into a complete, shoppable outfit using AI.

Music → Tags → Filtered Catalog → Styled Outfit → Lookbook  

All in seconds.


## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
