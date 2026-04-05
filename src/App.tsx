import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Shirt, 
  ArrowRight, 
  Home, 
  Loader2, 
  Sparkles, 
  ShoppingBag,
  Share2,
  ChevronLeft,
  Play,
  Link as LinkIcon,
  Clipboard,
  X
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from './lib/supabase';

// --- Custom Icons ---
const Pants = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6 3l2 18h3.5l1-8 1 8h3.5l2-18h-13z" />
    <path d="M8 8h8" />
  </svg>
);

// --- Types ---
interface Track {
  title: string;
  artist: string;
}

interface Product {
  id: string;
  title: string;
  product_type: string;
  category_detected?: string;
  normalized_category?: string;
  gender?: string;
  price: string;
  style_tags?: string;
  product_url: string;
  image?: string;
}

interface Outfit {
  id: string;
  name: string;
  top: Product;
  bottom: Product;
  shoes: Product;
}

interface Lookbook {
  aesthetic: string;
  interpretation: string;
  outfit: Outfit;
}

// --- Components ---

const Navbar = ({ onHome, onHowItWorks }: { onHome: () => void, onHowItWorks: () => void }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-white border-b border-black/5">
    <div className="flex items-center gap-2 cursor-pointer" onClick={onHome}>
      <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
        <Shirt className="text-white w-5 h-5" />
      </div>
      <span className="font-bold text-xl tracking-tight text-brand-ink">Vibe Check</span>
    </div>
    <div className="flex items-center gap-8">
      <button onClick={onHowItWorks} className="text-sm font-medium text-brand-ink hover:text-brand-green transition-colors">How It Works</button>
      <button onClick={onHome} className="p-1 hover:bg-black/5 rounded-full transition-colors text-brand-green">
        <Shirt className="w-5 h-5" />
      </button>
    </div>
  </nav>
);

const StepCard = ({ number, title, description, image }: { number: string, title: string, description: string, image: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="flex flex-col gap-8"
  >
    <div className="relative aspect-[4/5] overflow-hidden rounded-[3rem]">
      <img src={image} alt={title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
    </div>
    <div className="flex flex-col gap-4 px-2">
      <span className="text-brand-green font-bold text-sm tracking-widest">{number}</span>
      <h3 className="text-3xl font-normal text-brand-ink serif italic">{title}</h3>
      <p className="text-brand-muted leading-relaxed text-lg">{description}</p>
    </div>
  </motion.div>
);

// --- Constants ---
const TAGS_PROMPT = `You are an expert fashion stylist AI that translates music into fashion aesthetics.

Your task:
Convert ANY input (genres, playlists, artists, or vibes) into fashion style tags.

---

## OUTPUT FORMAT (STRICT)

Single input:
["tag1","tag2","tag3","tag4","tag5","tag6"]

Multiple inputs:
{
  "input_name": ["tag1","tag2","tag3","tag4","tag5","tag6"]
}

- 5–8 tags
- lowercase only
- no duplicates
- no explanations

---

## TAG SYSTEM

Each output must include a mix of:
- aesthetic (streetwear, minimal, luxury, vintage, etc.)
- color/mood (dark, neutral, vibrant, monochrome, etc.)
- fit (oversized, fitted, relaxed, layered)
- context (casual, nightlife, festival, outdoor, etc.)

---

## GENRE → STYLE MAPPING

Use consistent pattern mapping:

- hip hop / rap → streetwear, oversized, urban, bold  
- electronic → minimal, sleek, futuristic, monochrome  
- rock / punk → edgy, distressed, dark, rebellious  
- indie → vintage, relaxed, layered, retro  
- pop → trendy, bright, playful, modern  
- r&b → sleek, fitted, smooth, minimal  
- jazz / classical → tailored, elegant, refined  
- country / folk → rugged, denim, heritage  
- afro / latin → vibrant, colorful, expressive  
- ambient → minimal, soft, neutral, relaxed  

Refine for subgenres (deep, hardcore, experimental, etc.)

---

## FEW-SHOT COVERAGE (HIGH SIGNAL)

Hip Hop:
Input: Trap  
Output: ["streetwear","oversized","dark","bold","layered","urban"]

Input: Boom Bap  
Output: ["retro","streetwear","vintage","layered","classic","urban"]

Electronic:
Input: House  
Output: ["sleek","minimal","clean","modern","nightlife","fitted"]

Input: Techno  
Output: ["dark","monochrome","futuristic","minimal","edgy","sleek"]

Input: Dubstep  
Output: ["bold","dark","statement","experimental","streetwear","graphic"]

Rock:
Input: Punk Rock  
Output: ["edgy","distressed","black","rebellious","statement","bold"]

Input: Grunge  
Output: ["layered","oversized","vintage","distressed","dark","casual"]

Input: Metal  
Output: ["dark","heavy","edgy","statement","black","bold"]

Indie / Alt:
Input: Indie Rock  
Output: ["vintage","layered","casual","relaxed","retro","earth-tone"]

Input: Indie Pop  
Output: ["playful","colorful","casual","youthful","soft","layered"]

Pop:
Input: Pop  
Output: ["trendy","bright","playful","modern","casual","youthful"]

Input: Synth Pop  
Output: ["retro","colorful","bold","flashy","vintage","statement"]

R&B:
Input: Neo Soul  
Output: ["sleek","smooth","fitted","minimal","warm","elevated"]

Input: Alternative R&B  
Output: ["minimal","dark","clean","fitted","moody","modern"]

Jazz / Classical:
Input: Jazz  
Output: ["tailored","elegant","classic","refined","timeless","smart-casual"]

Input: Classical  
Output: ["tailored","formal","elegant","minimal","timeless","refined"]

Country / Folk:
Input: Country  
Output: ["western","denim","rugged","casual","heritage","outdoor"]

Input: Folk  
Output: ["earth-tone","relaxed","layered","natural","casual","vintage"]

Afro / Latin:
Input: Afrobeat  
Output: ["vibrant","colorful","bold","expressive","summer","statement"]

Input: Reggaeton  
Output: ["streetwear","fitted","bold","nightlife","vibrant","sleek"]

Input: Salsa  
Output: ["elegant","fitted","vibrant","dressy","expressive","flowy"]

Ambient / Chill:
Input: Ambient  
Output: ["minimal","soft","neutral","flowy","relaxed","calm"]

Input: Lo-fi  
Output: ["comfortable","minimal","neutral","relaxed","soft","everyday"]

Experimental:
Input: Glitch  
Output: ["experimental","futuristic","bold","edgy","statement","unique"]

Input: Avant-garde  
Output: ["avant-garde","high-fashion","experimental","bold","statement","artsy"]

High Energy:
Input: Hardcore  
Output: ["aggressive","bold","dark","statement","streetwear","edgy"]

Input: Drum And Bass  
Output: ["fast-paced","sporty","bold","streetwear","fitted","energetic"]

Luxury / Chill:
Input: Lounge  
Output: ["luxury","clean","minimal","relaxed","elevated","sleek"]

Input: Chill-out  
Output: ["lightweight","relaxed","minimal","soft","casual","clean"]

---

## TASK

Generate fashion tags for:

{{playlist_or_user_prompt}}

---

## FINAL CHECK

- correct format
- 5–8 tags
- consistent with genre family
- clean + production-ready
`;

export default function App() {
  const [view, setView] = useState<'home' | 'how-it-works' | 'loading' | 'result'>('home');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [lookbook, setLookbook] = useState<Lookbook | null>(null);
  const [previousOutfitIds, setPreviousOutfitIds] = useState<string[]>([]);
  const [searchCount, setSearchCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [genderValue, setGenderValue] = useState(50);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Unisex'>('Unisex');
  const [isDragging, setIsDragging] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (genderValue <= 45) {
      setGender('Male');
    } else if (genderValue >= 55) {
      setGender('Female');
    } else {
      setGender('Unisex');
    }
  }, [genderValue]);

  const fetchProducts = useCallback(async () => {
    if (!supabase) {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        setSupabaseError('Supabase configuration missing: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set.');
      } else {
        setSupabaseError('Supabase initialization failed: Check if VITE_SUPABASE_URL is a valid URL.');
      }
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('Product_Catalog_5')
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const processedData = data.map((item, index) => ({
          ...item,
          id: item.id || item.ID || item.product_id || item.SKU || String(index),
          title: item.title || item.name || 'Untitled Item',
          product_type: item.product_type || item.category || 'unknown',
          category_detected: item.category_detected || item.product_type || item.category || 'unknown',
          normalized_category: item.normalized_category || item.category_detected || item.product_type || 'unknown',
          gender: item.gender || item.product_gender || item.target_gender || 'Unisex',
          price: String(item.price || '$0'),
          image: item.image || item.image_url || item.img || item.photo || item.thumbnail,
          product_url: item.product_url || item.link || '#'
        }));
        
        setProducts(processedData as Product[]);
        setIsSupabaseConnected(true);
        setSupabaseError(null);
      } else {
        setSupabaseError('Product catalog is empty');
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      
      let errorMessage = err.message;
      if (err.message === 'Failed to fetch') {
        const url = import.meta.env.VITE_SUPABASE_URL;
        if (url && url.includes('localhost') && window.location.hostname !== 'localhost') {
          errorMessage = 'Network Error: Attempting to connect to a local Supabase instance (localhost) from a remote environment. Please update VITE_SUPABASE_URL to your production Supabase URL.';
        } else {
          errorMessage = 'Network Error: Failed to connect to Supabase. This could be due to an incorrect URL, a paused project, or network blocking (CORS/Firewall).';
        }
      }
      
      setSupabaseError(errorMessage);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleRetry = async () => {
    setIsRetrying(true);
    await fetchProducts();
    // Small delay for visual feedback
    setTimeout(() => setIsRetrying(false), 1000);
  };

  const safeJsonParse = (text: string, fallback: any = {}) => {
    try {
      // Try direct parse first
      return JSON.parse(text);
    } catch (e) {
      // If direct parse fails, try to extract JSON from markdown blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1].trim());
        } catch (e2) {
          console.error("Failed to parse extracted JSON:", e2);
        }
      }
      
      // Try to find anything that looks like a JSON object/array
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        } catch (e3) {
          console.error("Failed to parse braced JSON:", e3);
        }
      }
      
      if (firstBracket !== -1 && lastBracket !== -1) {
        try {
          return JSON.parse(text.substring(firstBracket, lastBracket + 1));
        } catch (e4) {
          console.error("Failed to parse bracketed JSON:", e4);
        }
      }

      console.error("All JSON extraction attempts failed for text:", text);
      return fallback;
    }
  };

  const generateLookbook = async () => {
    if (!playlistUrl) return;
    
    if (!playlistUrl.includes('spotify.com')) {
      setError("Sorry, Spotify-links only (for now).");
      return;
    }

    setView('loading');
    setError(null);

    try {
      if (products.length === 0) {
        throw new Error("No products available in catalog.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      // Step 1: Generate Style Tags
      const tagsResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: TAGS_PROMPT.replace('{{playlist_or_user_prompt}}', playlistUrl),
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const styleTags = safeJsonParse(tagsResponse.text || '[]', []);
      console.log("Generated Style Tags:", styleTags);

      // Optimization: Filter products by gender before sending to AI to reduce token count
      let filteredProducts = products.filter(p => {
        if (gender === 'Unisex') return true;
        // Normalize gender strings for comparison
        const pGender = p.gender?.toLowerCase() || 'unisex';
        const targetGender = gender.toLowerCase();
        return pGender === targetGender || pGender === 'unisex';
      });

      // Safety check: Ensure we have at least some items for each major category
      // If a category is missing after gender filtering, add some items back from the full catalog
      const hasCategory = (cat: string) => filteredProducts.some(p => 
        p.normalized_category?.toLowerCase().includes(cat) || 
        p.product_type?.toLowerCase().includes(cat)
      );

      if (!hasCategory('top') || !hasCategory('bottom') || !hasCategory('shoe')) {
        console.warn("Missing a category after gender filtering, falling back to full catalog for missing categories");
        // Add back items from the full catalog if they are missing
        ['top', 'bottom', 'shoe'].forEach(cat => {
          if (!hasCategory(cat)) {
            const missingItems = products.filter(p => 
              p.normalized_category?.toLowerCase().includes(cat) || 
              p.product_type?.toLowerCase().includes(cat)
            ).slice(0, 10); // Just take a few to keep context small
            filteredProducts = [...filteredProducts, ...missingItems];
          }
        });
      }

      // Further optimization: If catalog is still huge, we could sample or pick top matches
      const productContext = filteredProducts.map(p => ({
        id: p.id,
        title: p.title,
        product_type: p.product_type,
        category_detected: p.category_detected,
        normalized_category: p.normalized_category,
        gender: p.gender,
        price: p.price,
        style_tags: p.style_tags
      }));

      const shoeTypes = ["High Top Sneakers", "Loafers", "Low Top Sneakers", "Mid Top Sneakers", "Slides", "Sneakers", "Shoes", "Sandals", "Slippers"];
      const derived_shoe_type = shoeTypes[searchCount % 6];

      const systemPrompt = `You are a professional fashion stylist. Your job is to select one complete, 
stylistically coherent outfit from a provided product catalog, 
inspired by these style tags derived from the user's playlist: ${JSON.stringify(styleTags)}.

OUTFIT RULES:
- Select exactly ONE item per category: TOP, BOTTOM, SHOES
- Categorization Guide:
    TOP   → Look for: bodysuits, button up shirts, crewneck sweaters, crewnecks, dresses, hoodies, jerseys, jumpsuits, long sleeve tees, long sleeve tops, long sleeves, maxi dresses, mini dresses, polo shirts, pullovers, rompers, rugby shirts, short sleeve tees, short sleeve tops, sweaters, t-shirt, tank tops, tops, shirts, sweatshirts. Also check if normalized_category or product_type contains "top".
    BOTTOM → Look for: active shorts, cargo pants, cargo shorts, jeans, leggings, maxi skirt, mini skirts, pants, shorts, skirts, sweatpants, trousers, bottoms. Also check if normalized_category or product_type contains "bottom".
    SHOES  → Look for: High Top Sneakers, Loafers, Low Top Sneakers, Mid Top Sneakers, Slides, Sneakers, Shoes, Sandals, Slippers, boots, footwear. Also check if normalized_category or product_type contains "shoe" or "footwear".
- Never select two items from the same category
- Prefer items whose style_tags are in close proximity to the identified style tags: ${JSON.stringify(styleTags)}
- Ensure stylistic coherence across all three items

REPEAT AVOIDANCE:
- Never select any item whose ID appears in previousOutfitIds
- If a valid item cannot be found for a category, DO NOT return an error immediately. Instead, try to find the closest match even if it doesn't perfectly fit the sub-type list, as long as it's in the right general category (TOP, BOTTOM, or SHOES).
- Only return an error in the "error" field if the catalog is truly missing an entire category.

Ensure stylistic consistency across all items:
   * prioritize overlapping style_tags
   * ensure the outfit feels intentional

IMPORTANT:
   You may use UNISEX products regardless of whether the user selected "Male" or "Female".

 If gender is specified (Male or Female):
   * You MUST ONLY select items that match that gender OR are labeled as "Unisex".
   * DO NOT select "Female" items if the user selected "Male".
   * DO NOT select "Male" items if the user selected "Female".
   * Prioritize matching gender, but ALWAYS allow "Unisex" items.

Avoid mixing incompatible styles unless intentional.

Prefer similar price tiers for cohesion.

---

Return format:

OUTFIT:

TOP:

* title:
* price:
* reason:

BOTTOM:

* title:
* price:
* reason:

SHOES:

* title:
* price:
* reason:

VIBE SUMMARY:
One sentence describing the outfit aesthetic.

OUTPUT:
- Return ONLY valid JSON. No markdown, no text outside the JSON.
- All fields are required unless an error occurs.`;

      const userPrompt = `Playlist mood: ${playlistUrl}
Style Tags: ${JSON.stringify(styleTags)}
Gender preference: ${gender}

Search number: ${searchCount + 1}

You MUST select shoes from the current shoe category. If no items of this specific shoe type are available, select any other valid shoe from the catalog.

Previously selected item IDs (do not select these):
${JSON.stringify(previousOutfitIds)}

Catalog:
${JSON.stringify(productContext, null, 2)}

Return this exact JSON structure:
{
  "aesthetic": "style name",
  "interpretation": "one sentence explaining the choice",
  "outfit": {
    "name": "Outfit Name",
    "top_id": "id_of_top",
    "bottom_id": "id_of_bottom",
    "shoes_id": "id_of_shoes"
  },
  "error": null
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: userPrompt,
          config: { 
            systemInstruction: systemPrompt,
            responseMimeType: "application/json" 
          }
        });

        const data = safeJsonParse(response.text || '{}', {});
        
        if (data.error) {
          throw new Error(data.error);
        }

        const outfitData = data.outfit || {};
        
        const findProduct = (id: string, category: string, fallbackIndex: number) => {
          return products.find(p => p.id === id) || 
                 products.find(p => p.category_detected?.toLowerCase().includes(category)) || 
                 products.find(p => p.product_type.toLowerCase().includes(category)) || 
                 products[fallbackIndex] ||
                 products[0];
        };

        const top = findProduct(outfitData.top_id, 'top', 0);
        const bottom = findProduct(outfitData.bottom_id, 'bottom', 1);
        const shoes = findProduct(outfitData.shoes_id, 'shoe', 2);

        const generatedLookbook: Lookbook = {
          aesthetic: data.aesthetic || "Modern Minimalist",
          interpretation: data.interpretation || "A curated selection reflecting your sonic profile.",
          outfit: {
            id: 'outfit-1',
            name: outfitData.name || "The Signature Look",
            top: top as Product,
            bottom: bottom as Product,
            shoes: shoes as Product
          }
        };

        setLookbook(generatedLookbook);
        setPreviousOutfitIds(prev => [...prev, top.id, bottom.id, shoes.id]);
        setSearchCount(prev => prev + 1);
        setView('result');
    } catch (err: any) {
      console.error(err);
      
      let errorMessage = "Failed to generate your lookbook. Please try again.";
      
      // Check for specific Gemini API errors
      const errorStr = String(err);
      if (errorStr.includes("API key expired") || errorStr.includes("API_KEY_INVALID")) {
        errorMessage = "Your Gemini API key has expired or is invalid. Please update it in your environment settings.";
      } else if (errorStr.includes("quota") || errorStr.includes("429")) {
        errorMessage = "AI service quota exceeded. Please wait a moment and try again.";
      } else if (errorStr.includes("JSON")) {
        errorMessage = "The AI returned an invalid response format. Please try again.";
      }
      
      setError(errorMessage);
      setView('home');
    }
  };

  const handleShare = async () => {
    if (!lookbook || isSharing) return;
    
    const shareData = {
      title: `Vibe Check: ${lookbook.aesthetic}`,
      text: `Check out my AI-curated outfit inspired by my music: ${lookbook.interpretation}`,
      url: window.location.href
    };

    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareFeedback('Link copied to clipboard!');
        setTimeout(() => setShareFeedback(null), 3000);
      }
    } catch (err: any) {
      // Handle cancellation gracefully
      if (err.name === 'AbortError') {
        console.log('Share canceled by user');
      } else {
        console.error('Error sharing:', err);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPlaylistUrl(text);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      // Fallback: alert user or show toast if permission denied
      setShareFeedback('Clipboard access denied');
      setTimeout(() => setShareFeedback(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-ink font-sans selection:bg-brand-green selection:text-white">
      <Navbar onHome={() => setView('home')} onHowItWorks={() => setView('how-it-works')} />

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center gap-12 py-24"
            >
              <div className="flex flex-col gap-6">
                <h1 className="text-7xl md:text-9xl font-normal tracking-tight leading-[1.1] serif">
                  Wear your <span className="text-brand-green italic inline-flex items-center gap-4">
                    sound
                    <div className="translate-y-[0.05em] flex items-center">
                      {isSupabaseConnected ? (
                        <div className="relative flex items-center justify-center">
                          <div className="absolute w-6 h-6 bg-brand-green rounded-full animate-ping opacity-20" />
                          <div className="w-3 h-3 bg-brand-green rounded-full shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-brand-muted opacity-40" />
                          <button 
                            onClick={handleRetry}
                            disabled={isRetrying}
                            className="p-2 hover:bg-black/5 rounded-full transition-colors disabled:opacity-50"
                            title="Retry connection"
                          >
                            <Loader2 className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  </span>
                </h1>
                <p className="text-xl text-brand-muted max-w-2xl mx-auto leading-relaxed">
                  Drop a link and let us curate your next signature look.
                </p>
              </div>

              <div className="w-full max-w-lg flex flex-col gap-8 mt-4 items-center">
                <div className="relative group w-full">
                  <div className="absolute -inset-1 bg-black/5 rounded-[1.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center bg-white rounded-[1.25rem] shadow-[0_6px_0_0_rgba(0,0,0,0.05)] border-2 border-black/5 p-1 transition-all hover:-translate-y-1 hover:shadow-[0_8px_0_0_rgba(0,0,0,0.05)] active:translate-y-1 active:shadow-none">
                    <input 
                      type="text" 
                      placeholder="https://open.spotify.com/playlist/..." 
                      value={playlistUrl}
                      onChange={(e) => setPlaylistUrl(e.target.value)}
                      className="w-full px-6 py-3 bg-transparent focus:outline-none text-base text-brand-ink placeholder:text-brand-muted/40"
                    />
                    <div className="flex items-center gap-1 pr-2">
                      {playlistUrl ? (
                        <button 
                          onClick={() => setPlaylistUrl('')}
                          className="p-2 hover:bg-black/5 rounded-full transition-colors text-brand-muted/40 hover:text-brand-ink"
                          title="Clear"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={handlePaste}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 rounded-full transition-colors text-brand-green font-bold text-[10px] uppercase tracking-widest"
                          title="Paste from clipboard"
                        >
                          <Clipboard className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Paste</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="relative flex items-center justify-center w-full">
                  <button 
                    onClick={generateLookbook}
                    disabled={!playlistUrl}
                    className="w-20 h-20 bg-brand-green text-white rounded-full flex items-center justify-center shadow-[0_6px_0_0_#065f46] border-2 border-brand-green/20 transition-all hover:-translate-y-1 hover:shadow-[0_8px_0_0_#065f46] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none group"
                    title="Analyze Playlist"
                  >
                    <Play className="w-8 h-8 fill-current translate-x-0.5" />
                  </button>
                </div>

                {/* Gender Slider as Progress Bar */}
                <div className="w-full flex flex-col gap-3">
                  <div className={`relative w-full transition-all duration-300 bg-black/5 rounded-full group/slider ${isDragging ? 'h-2.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] bg-black/10' : 'h-1.5 hover:h-2.5 hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] hover:bg-black/10'}`}>
                    <div 
                      className="absolute top-0 left-0 h-full bg-brand-green transition-all duration-300 rounded-full"
                      style={{ width: `${genderValue}%` }}
                    />
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={genderValue}
                      onChange={(e) => setGenderValue(parseInt(e.target.value))}
                      onMouseDown={() => setIsDragging(true)}
                      onMouseUp={() => setIsDragging(false)}
                      onTouchStart={() => setIsDragging(true)}
                      onTouchEnd={() => setIsDragging(false)}
                      className={`absolute top-0 left-0 w-full h-full appearance-none bg-transparent cursor-pointer 
                        [&::-webkit-slider-thumb]:appearance-none 
                        [&::-webkit-slider-thumb]:w-4 
                        [&::-webkit-slider-thumb]:h-4 
                        [&::-webkit-slider-thumb]:bg-white 
                        [&::-webkit-slider-thumb]:rounded-full 
                        [&::-webkit-slider-thumb]:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]
                        [&::-webkit-slider-thumb]:border-2 
                        [&::-webkit-slider-thumb]:border-brand-green 
                        ${isDragging ? '[&::-webkit-slider-thumb]:opacity-100 [&::-webkit-slider-thumb]:scale-125' : '[&::-webkit-slider-thumb]:opacity-0'}
                        group-hover/slider:[&::-webkit-slider-thumb]:opacity-100 
                        group-hover/slider:[&::-webkit-slider-thumb]:scale-125
                        group-hover/slider:[&::-webkit-slider-thumb]:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]
                        transition-all 
                        [&::-moz-range-thumb]:w-4 
                        [&::-moz-range-thumb]:h-4 
                        [&::-moz-range-thumb]:bg-white 
                        [&::-moz-range-thumb]:rounded-full 
                        [&::-moz-range-thumb]:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]
                        [&::-moz-range-thumb]:border-2 
                        [&::-moz-range-thumb]:border-brand-green
                        ${isDragging ? '[&::-moz-range-thumb]:opacity-100' : '[&::-moz-range-thumb]:opacity-0'}
                        group-hover/slider:[&::-moz-range-thumb]:opacity-100
                        group-hover/slider:[&::-moz-range-thumb]:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]`}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full px-1 text-[10px] font-bold uppercase tracking-widest text-brand-muted/60">
                    <span className={`transition-colors ${gender === 'Male' ? 'text-brand-green' : ''}`}>Male</span>
                    <span className="text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-sm min-w-[60px] text-center">{gender}</span>
                    <span className={`transition-colors ${gender === 'Female' ? 'text-brand-green' : ''}`}>Female</span>
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                {supabaseError && (
                  <div className="w-full p-4 bg-red-50 border border-red-100 rounded-xl flex flex-col gap-2">
                    <p className="text-red-600 text-sm font-medium">Database Connection Issue</p>
                    <p className="text-red-500 text-xs leading-relaxed">{supabaseError}</p>
                    <button 
                      onClick={handleRetry}
                      className="text-[10px] uppercase tracking-widest font-bold text-red-600 hover:text-red-700 transition-colors self-start"
                    >
                      Try Reconnecting
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'how-it-works' && (
            <motion.div 
              key="how-it-works"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-24 py-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <StepCard 
                  number="01" 
                  title="Secure the aux." 
                  description="Find that one playlist that's literally your entire personality. You know the one."
                  image="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=800"
                />
                <StepCard 
                  number="02" 
                  title="Drop the link." 
                  description="Paste that sauce into our analyzer. We'll decode the frequency for you."
                  image="https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=800"
                />
                <StepCard 
                  number="03" 
                  title="Serve the look." 
                  description="Get your AI-curated fit and start your main character arc."
                  image="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800"
                />
              </div>

              <div className="flex flex-col items-center gap-8 pt-12 border-t border-black/5">
                <p className="text-brand-muted text-center max-w-md">Ready to drop the needle on your new wardrobe?</p>
                <button 
                  onClick={() => setView('home')}
                  className="px-12 py-5 bg-brand-ink text-white rounded-full font-semibold text-xl hover:scale-105 transition-transform flex items-center gap-3"
                >
                  Start Your Session <Sparkles className="w-5 h-5 text-brand-green" />
                </button>
              </div>
            </motion.div>
          )}

          {view === 'loading' && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-12"
            >
              <div className="flex flex-col items-center gap-6">
                <Loader2 className="w-12 h-12 animate-spin text-brand-green" />
                <p className="text-xs text-brand-muted italic">Tuning into the frequency...</p>
              </div>
            </motion.div>
          )}

          {view === 'result' && lookbook && (
            <motion.div 
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-16 py-12"
            >
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-black/5 pb-12">
                <div className="flex flex-col gap-4 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-brand-green">
                    <Music className="w-4 h-4" />
                    Aesthetic Identified
                  </div>
                  <h2 className="text-6xl md:text-8xl font-normal tracking-tight serif text-brand-ink">{lookbook.aesthetic}</h2>
                  <p className="text-xl text-brand-muted leading-relaxed italic">"{lookbook.interpretation}"</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={handleShare}
                    disabled={isSharing}
                    className="flex items-center gap-2 px-8 py-4 bg-brand-green text-white rounded-full font-semibold hover:bg-brand-green/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSharing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                    Share Lookbook
                  </button>
                  <AnimatePresence>
                    {shareFeedback && (
                      <motion.span 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[10px] font-bold text-brand-green uppercase tracking-widest"
                      >
                        {shareFeedback}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </header>

              <div className="flex flex-col gap-24">
                <section className="flex flex-col gap-12">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-brand-green uppercase tracking-[0.1em]">Your Curated Look</span>
                    <h3 className="text-4xl font-normal tracking-tight serif text-brand-ink">{lookbook.outfit.name}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* TOP */}
                    <div className="group flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-brand-green uppercase tracking-[0.1em]">
                        <Shirt className="w-3 h-3" /> Top
                      </div>
                      <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-white border border-black/5">
                        <img 
                          src={lookbook.outfit.top.image || `https://picsum.photos/seed/${lookbook.outfit.top.id}/400/500`} 
                          alt={lookbook.outfit.top.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold shadow-sm">
                          {lookbook.outfit.top.price}
                        </div>
                        <a 
                          href={lookbook.outfit.top.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-4 left-4 right-4 py-4 bg-brand-green text-white rounded-[1.25rem] font-semibold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all flex items-center justify-center gap-2"
                        >
                          <ShoppingBag className="w-4 h-4" /> Shop Top
                        </a>
                      </div>
                      <div className="flex flex-col px-2">
                        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.1em]">{lookbook.outfit.top.product_type}</span>
                        <span className="font-semibold text-lg text-brand-ink">{lookbook.outfit.top.title}</span>
                      </div>
                    </div>

                    {/* BOTTOM */}
                    <div className="group flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-brand-green uppercase tracking-[0.1em]">
                        <Pants className="w-3 h-3" /> Bottom
                      </div>
                      <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-white border border-black/5">
                        <img 
                          src={lookbook.outfit.bottom.image || `https://picsum.photos/seed/${lookbook.outfit.bottom.id}/400/500`} 
                          alt={lookbook.outfit.bottom.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold shadow-sm">
                          {lookbook.outfit.bottom.price}
                        </div>
                        <a 
                          href={lookbook.outfit.bottom.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-4 left-4 right-4 py-4 bg-brand-green text-white rounded-[1.25rem] font-semibold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all flex items-center justify-center gap-2"
                        >
                          <ShoppingBag className="w-4 h-4" /> Shop Bottom
                        </a>
                      </div>
                      <div className="flex flex-col px-2">
                        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.1em]">{lookbook.outfit.bottom.product_type}</span>
                        <span className="font-semibold text-lg text-brand-ink">{lookbook.outfit.bottom.title}</span>
                      </div>
                    </div>

                    {/* SHOES */}
                    <div className="group flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-brand-green uppercase tracking-[0.1em]">
                        <ShoppingBag className="w-3 h-3" /> Shoes
                      </div>
                      <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-white border border-black/5">
                        <img 
                          src={lookbook.outfit.shoes.image || `https://picsum.photos/seed/${lookbook.outfit.shoes.id}/400/500`} 
                          alt={lookbook.outfit.shoes.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold shadow-sm">
                          {lookbook.outfit.shoes.price}
                        </div>
                        <a 
                          href={lookbook.outfit.shoes.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-4 left-4 right-4 py-4 bg-brand-green text-white rounded-[1.25rem] font-semibold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all flex items-center justify-center gap-2"
                        >
                          <ShoppingBag className="w-4 h-4" /> Shop Shoes
                        </a>
                      </div>
                      <div className="flex flex-col px-2">
                        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.1em]">{lookbook.outfit.shoes.product_type}</span>
                        <span className="font-semibold text-lg text-brand-ink">{lookbook.outfit.shoes.title}</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <footer className="mt-24 pt-12 border-t border-black/5 text-center flex flex-col items-center gap-8">
                <h4 className="text-3xl font-normal tracking-tight serif">Not the vibe?</h4>
                <button 
                  onClick={() => setView('home')}
                  className="px-12 py-5 bg-brand-green text-white rounded-full font-semibold text-xl hover:scale-105 transition-transform"
                >
                  Try Another Playlist
                </button>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
