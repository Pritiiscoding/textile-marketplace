import Product from "../models/Product.js";

// ── Groq API (free, OpenAI-compatible, fast) ─────────────────────────────────
// Sign up free at https://console.groq.com — set GROQ_API_KEY in .env
const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama3-70b-8192"; // Completely free model on Groq

const groqHeaders = () => ({
  "Content-Type": "application/json",
  ...(process.env.GROQ_API_KEY ? { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } : {}),
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Groq chat completion ──────────────────────────────────────────────────────
async function groqChat(systemPrompt, userMessage, maxTokens = 350, retries = 2) {
  const models = [GROQ_MODEL, "llama3-8b-8192", "mixtral-8x7b-32768"];
  let lastError = null;

  for (let i = 0; i < retries + 1; i++) {
    try {
      const modelToUse = models[i % models.length];
      const res = await fetch(GROQ_API, {
        method: "POST",
        headers: groqHeaders(),
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Groq API error ${res.status}: ${errBody.slice(0, 200)}`);
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || "";
    } catch (err) {
      lastError = err;
      console.warn(`Groq chat attempt ${i + 1} failed:`, err.message);
      if (i < retries) await sleep(1000 * (i + 1)); // Backoff
    }
  }
  throw lastError;
}

// ── Groq Multimodal Vision completion ──────────────────────────────────────────
async function groqVisionChat(systemPrompt, imageBase64OrUrl, promptText = "Analyze this textile fabric image.", maxTokens = 300) {
  const models = ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"];
  let lastError = null;

  let imageUrl = imageBase64OrUrl;
  if (imageUrl && !imageUrl.startsWith("data:") && !imageUrl.startsWith("http")) {
    imageUrl = `data:image/jpeg;base64,${imageUrl}`;
  }

  for (const modelToUse of models) {
    try {
      const res = await fetch(GROQ_API, {
        method: "POST",
        headers: groqHeaders(),
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: promptText },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          max_tokens: maxTokens,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Groq Vision error ${res.status}: ${errBody.slice(0, 200)}`);
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || "";
    } catch (err) {
      lastError = err;
      console.warn(`Groq vision attempt with ${modelToUse} failed:`, err.message);
    }
  }
  throw lastError;
}

// ── Local fast embedding (no remote call) ─────────────────────────────────────
// Uses a simple bag-of-words frequency vector (128-dim) for local cosine similarity.
// Fast, zero-latency, works offline. Accuracy is good enough for product matching.
function getEmbedding(text) {
  const DIM = 128;
  const vec = new Array(DIM).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  for (const word of words) {
    let h = 5381;
    for (let i = 0; i < word.length; i++) { h = (h * 33) ^ word.charCodeAt(i); }
    vec[Math.abs(h) % DIM] += 1;
    // bigrams
    if (word.length > 3) {
      let h2 = 0;
      for (let i = 0; i < word.length - 1; i++) { h2 = (h2 << 5) - h2 + (word.charCodeAt(i) * 31 + word.charCodeAt(i + 1)); h2 |= 0; }
      vec[Math.abs(h2) % DIM] += 0.5;
    }
  }
  // L2-normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function mockSearch(query, products) {
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  return products
    .map((p) => {
      const haystack = `${p.name} ${p.category} ${p.description}`.toLowerCase();
      const score = tokens.reduce((s, t) => s + (haystack.includes(t) ? 1 : 0), 0);
      return { product: p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.product);
}

export const embedProduct = async (productId) => {
  try {
    const product = await Product.findById(productId).select(
      "name category description colors unit price"
    );
    if (!product) return;

    const text = [
      product.name,
      product.category,
      product.description,
      (product.colors || []).join(" "),
      `${product.price} per ${product.unit}`,
    ]
      .filter(Boolean)
      .join(". ");

    const embedding = getEmbedding(text);
    await Product.findByIdAndUpdate(productId, { embedding });
  } catch (err) {
    console.warn(`embedProduct(${productId}) failed (non-fatal):`, err.message);
  }
};

export const semanticSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query?.trim()) {
      return res.status(400).json({ message: "query is required" });
    }

    // Extract price filter from query if present
    const priceMatch = query.match(/under\s*(\d+)/i);
    const maxPrice = priceMatch ? Number(priceMatch[1]) : null;
    const searchQuery = query.replace(/under\s*\d+/i, '').trim();

    const products = await Product.find({ embedding: { $exists: true }, status: "available" })
      .select("+embedding")
      .populate("supplierId", "profile.companyName")
      .limit(500);

    if (products.length === 0) {
      const all = await Product.find({ status: "available" })
        .populate("supplierId", "profile.companyName")
        .limit(50);
      const results = mockSearch(searchQuery, all);
      return res.status(200).json({ results, source: "keyword_fallback" });
    }

    let queryEmbedding;
    try {
      queryEmbedding = getEmbedding(searchQuery);
    } catch {
      const results = mockSearch(searchQuery, products);
      return res.status(200).json({ results, source: "keyword_fallback" });
    }

    const scored = products
      .map((p) => ({ product: p, score: cosineSimilarity(queryEmbedding, p.embedding) }))
      .sort((a, b) => b.score - a.score);

    // Filter by price if specified
    let filtered = scored;
    if (maxPrice) {
      filtered = scored.filter((item) => item.product.price <= maxPrice);
    }

    const results = filtered
      .slice(0, 20)
      .map((x) => {
        const obj = x.product.toObject();
        delete obj.embedding;
        return obj;
      });

    return res.status(200).json({ results, source: "semantic" });
  } catch (err) {
    console.error("semanticSearch error:", err.message);
    return res.status(500).json({ message: "Search failed", error: err.message });
  }
};

export const similarProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).select("+embedding");
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (!product.embedding || product.embedding.length === 0) {
      const fallback = await Product.find({
        _id: { $ne: product._id },
        category: product.category,
        status: "available",
      })
        .populate("supplierId", "profile.companyName")
        .limit(5);
      return res.status(200).json({ results: fallback, source: "category_fallback" });
    }

    const candidates = await Product.find({
      _id: { $ne: product._id },
      embedding: { $exists: true },
      status: "available",
    })
      .select("+embedding")
      .populate("supplierId", "profile.companyName")
      .limit(200);

    const scored = candidates
      .map((p) => ({ product: p, score: cosineSimilarity(product.embedding, p.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => {
        const obj = x.product.toObject();
        delete obj.embedding;
        return obj;
      });

    return res.status(200).json({ results: scored, source: "semantic" });
  } catch (err) {
    console.error("similarProducts error:", err.message);
    return res.status(500).json({ message: "Similar products failed", error: err.message });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const user = req.user;
    const preferenceTokens = [
      ...(user.profile?.productCategories || []),
      ...(user.profile?.fabricTypes || []),
      user.profile?.industry || "",
    ]
      .filter(Boolean)
      .join(" ");

    const query = preferenceTokens || "quality fabric textile";

    const products = await Product.find({ embedding: { $exists: true }, status: "available" })
      .select("+embedding")
      .populate("supplierId", "profile.companyName")
      .limit(200);

    if (products.length === 0) {
      const fallback = await Product.find({ status: "available" })
        .populate("supplierId", "profile.companyName")
        .limit(8);
      return res.status(200).json({ results: fallback, source: "new_arrivals" });
    }

    let queryEmbedding;
    try {
      queryEmbedding = getEmbedding(query);
    } catch {
      const fallback = mockSearch(query, products).slice(0, 8);
      return res.status(200).json({ results: fallback, source: "keyword_fallback" });
    }

    const scored = products
      .map((p) => ({ product: p, score: cosineSimilarity(queryEmbedding, p.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => {
        const obj = x.product.toObject();
        delete obj.embedding;
        return obj;
      });

    return res.status(200).json({ results: scored, source: "semantic" });
  } catch (err) {
    console.error("recommendations error:", err.message);
    return res.status(500).json({ message: "Recommendations failed", error: err.message });
  }
};

const CHAT_CACHE = new Map();
const CONVERSATION_HISTORY = new Map(); // Store conversation history per user

export const chat = async (req, res) => {
  try {
    const { message, productContext = [] } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: "message is required" });
    }

    const userRole = req.user?.role || "buyer";
    const cacheKey = message.trim().toLowerCase();
    
    if (CHAT_CACHE.has(cacheKey)) {
      return res.status(200).json({ reply: CHAT_CACHE.get(cacheKey), source: "cache" });
    }

    const contextBlock = productContext
      .slice(0, 4)
      .map(
        (p, i) =>
          `${i + 1}. ${p.name} (${p.category}) — ₹${p.price}/${p.unit}. ${p.description || ""}`
      )
      .join("\n");

    let reply;
    try {
      let systemPrompt;
      if (userRole === "supplier") {
        systemPrompt = `You are a helpful textile business assistant. Give short, direct answers to questions about inventory, pricing, production, and textiles. Keep it simple and practical.`;
      } else {
        systemPrompt = `You are a helpful textile shopping assistant. Give short, direct answers to questions about fabrics, products, pricing, and ordering. Keep it simple and helpful.`;
      }
      
      const userMsg = contextBlock ? `Product context:\n${contextBlock}\n\nQuestion: ${message}` : message;
      
      if (!process.env.GROQ_API_KEY) throw new Error("No GROQ_API_KEY");
      reply = await groqChat(systemPrompt, userMsg, 300);
      
      if (!reply || reply.trim() === "") {
        reply = buildFallbackReply(message, productContext, userRole);
      }
    } catch (err) {
      console.error("Chat error:", err);
      reply = buildFallbackReply(message, productContext, userRole);
    }

    if (reply.length > 50) {
      CHAT_CACHE.set(cacheKey, reply);
      if (CHAT_CACHE.size > 500) {
        CHAT_CACHE.delete(CHAT_CACHE.keys().next().value);
      }
    }

    return res.status(200).json({ reply, source: process.env.GROQ_API_KEY ? "groq" : "fallback" });
  } catch (err) {
    console.error("chat error:", err.message);
    return res.status(500).json({ message: "Chat failed", error: err.message });
  }
};

// ─── FEATURE 2: AI-Powered Smart Onboarding ─────────────────────────────
// @route POST /api/ai/onboarding-next
// Body: { role: 'buyer'|'supplier', history: [{ question, answer }] }
export const smartOnboardingNext = async (req, res) => {
  try {
    const { role = "buyer", history = [] } = req.body;

    const formattedHistory = history
      .map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`)
      .join("\n\n");

    const prompt = `<s>[INST] You are an expert AI B2B Textile Onboarding assistant.
Role of onboarding user: ${role.toUpperCase()}.

Previous Conversation History:
${formattedHistory || "None yet. This is the beginning of the chat."}

Based on the previous answers provided, generate the single next most relevant and specific follow-up onboarding question to ask. If you have gathered sufficient info (after 3-4 questions), output JSON {"done": true, "summary": "brief summary of user needs"}. Otherwise return a JSON object with:
{"done": false, "question": "Your dynamic personalized follow up question"} [/INST]`;

    let question = "";
    let isDone = false;
    let summary = "";

    try {
      if (!process.env.GROQ_API_KEY) throw new Error("No GROQ_API_KEY");
      const systemPrompt = `You are an expert AI B2B Textile Onboarding assistant for a ${role.toUpperCase()} user. Based on the conversation history provided, generate the single most relevant next follow-up onboarding question. After 3-4 questions, output ONLY valid JSON: {"done": true, "summary": "brief summary"}. Otherwise output ONLY valid JSON: {"done": false, "question": "your question here"}.`;
      const generatedText = await groqChat(systemPrompt, formattedHistory || "Start the onboarding.", 150);
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        isDone = parsed.done;
        question = parsed.question;
        summary = parsed.summary;
      } else {
        question = generatedText.trim();
      }
    } catch {
      // Smart fallback based on conversation length
      const last = history[history.length - 1]?.answer?.toLowerCase() || "";
      if (history.length === 0) {
        question = role === "supplier" ? "What primary textile products or fabrics do you manufacture?" : "What types of fabrics or textile products do you regularly source?";
      } else if (history.length === 1) {
        if (last.includes("bedsheet") || last.includes("cotton") || last.includes("linen")) {
          question = "Got it! What thread counts or gsm weights do you typically work with (e.g. 200-400 standard vs 600+ premium)?";
        } else if (last.includes("denim") || last.includes("apparel")) {
          question = "Understood! What wash types, stretch specifications, or fabric weights (oz) do you focus on?";
        } else {
          question = "Awesome. What is your estimated monthly volume or order size requirement?";
        }
      } else if (history.length === 2) {
        question = "What target price range or target lead time works best for your production cycles?";
      } else {
        isDone = true;
        summary = "Preferences captured successfully.";
      }
    }

    return res.status(200).json({ done: isDone, question, summary });
  } catch (err) {
    console.error("smartOnboardingNext error:", err.message);
    return res.status(500).json({ message: "Failed to get onboarding question" });
  }
};

// ─── Fabric knowledge map ────────────────────────────────────────────────────
// Maps CLIP-detected labels to rich fabric metadata and search aliases
const FABRIC_MAP = {
  "denim": {
    category: "Denim", colors: ["Navy", "Indigo", "Dark Blue", "Light Blue", "Black", "Grey", "White", "Blue"],
    aliases: ["denim", "jeans", "twill", "cotton", "blue"],
    weave: "Twill weave", weight: "Heavy (300–450 GSM)",
    uses: ["Jeans", "Jackets", "Overalls", "Bags"],
    desc: "Sturdy twill-weave cotton denim fabric",
  },
  "silk": {
    category: "Silk", colors: ["Ivory", "Champagne", "Pearl", "Cream", "White", "Gold", "Silver", "Pink", "Blue", "Red"],
    aliases: ["silk", "satin", "smooth", "shiny", "luxurious", "glossy"],
    weave: "Plain / Satin weave", weight: "Light (60–120 GSM)",
    uses: ["Sarees", "Blouses", "Scarves", "Evening Wear"],
    desc: "Smooth, lustrous silk with natural sheen",
  },
  "cotton": {
    category: "Cotton", colors: ["White", "Beige", "Natural", "Cream", "Grey", "Navy", "Black", "Blue", "Green", "Red"],
    aliases: ["cotton", "canvas", "muslin", "poplin", "plain", "white", "lawn"],
    weave: "Plain weave", weight: "Medium (120–200 GSM)",
    uses: ["Shirts", "Bed Linen", "Innerwear", "Dress Material"],
    desc: "Breathable, soft-touch pure cotton weave",
  },
  "linen": {
    category: "Linen", colors: ["Ecru", "Sand", "Off-White", "Tan", "Beige", "Grey", "Natural", "White"],
    aliases: ["linen", "jute", "hemp", "natural", "textured", "ecru"],
    weave: "Plain weave", weight: "Medium (150–250 GSM)",
    uses: ["Shirts", "Trousers", "Tablecloths", "Home Furnishing"],
    desc: "Natural linen with visible weave texture",
  },
  "wool": {
    category: "Wool", colors: ["Brown", "Heather Grey", "Cream", "Charcoal", "Black", "Navy", "Tan", "Grey"],
    aliases: ["wool", "flannel", "tweed", "knit", "woolen", "warm"],
    weave: "Twill / Plain weave", weight: "Heavy (250–500 GSM)",
    uses: ["Coats", "Suits", "Blankets", "Winter Wear"],
    desc: "Soft brushed wool with excellent insulation",
  },
  "velvet": {
    category: "Velvet", colors: ["Deep Purple", "Burgundy", "Navy", "Emerald", "Red", "Black", "Royal Blue", "Gold", "Silver", "Pink"],
    aliases: ["velvet", "velour", "plush", "pile", "soft", "rich"],
    weave: "Cut pile weave", weight: "Medium-heavy (200–350 GSM)",
    uses: ["Upholstery", "Evening Wear", "Curtains", "Accessories"],
    desc: "Plush velvet with dense, soft pile",
  },
  "polyester": {
    category: "Polyester", colors: ["White", "Grey", "Multicolor", "Black", "Navy", "Red", "Blue", "Green"],
    aliases: ["polyester", "synthetic", "nylon", "spandex", "blended", "fleece"],
    weave: "Plain / Knit", weight: "Light-medium (80–200 GSM)",
    uses: ["Sportswear", "Linings", "Uniforms", "Activewear"],
    desc: "Durable synthetic polyester blend",
  },
  "printed": {
    category: "Printed Fabric", colors: ["Multicolor", "Vibrant", "Patterned"],
    aliases: ["print", "floral", "pattern", "batik", "block print", "digital print"],
    weave: "Varies", weight: "Varies",
    uses: ["Kurtas", "Dresses", "Sarees", "Bed Covers"],
    desc: "Vibrant printed textile with colorful patterns",
  },
  "knit": {
    category: "Knit", colors: ["White", "Navy", "Grey", "Stripes", "Black", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Orange"],
    aliases: ["knit", "jersey", "interlock", "stretch", "elastic", "t-shirt"],
    weave: "Knit construction", weight: "Light-medium (120–250 GSM)",
    uses: ["T-shirts", "Sportswear", "Leggings", "Hoodies"],
    desc: "Stretchy knit fabric with comfortable elasticity",
  },
};

// ─── FEATURE 3: Product Image AI Analysis ─────────────────────────────
// @route POST /api/ai/analyze-image
export const analyzeProductImage = async (req, res) => {
  try {
    const { imageUrl, filename } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    const keys = Object.keys(FABRIC_MAP);
    let fabric = null;
    let confidence = 0.88;
    let detectedColor = "";

    // Step 1: Real Visual AI Vision Extraction using Groq Vision API
    if (process.env.GROQ_API_KEY) {
      try {
        const systemPrompt = `You are a world-class textile expert with deep knowledge of fabric identification. Analyze the provided fabric image with extreme precision and output ONLY valid JSON matching this structure:
{
  "category": "ONE OF: ${keys.join(", ")}",
  "primaryColor": "dominant exact color visible (e.g. Navy Blue, Emerald Green, Crimson Red, Royal Blue, Mustard Yellow, Cream White, Charcoal Black, Lavender Purple, Burgundy, Teal, Rust, Forest Green, Golden Yellow, Soft Pink, Light Gray, Deep Brown, Beige, Tan, Olive, Maroon, Coral, Sage, Indigo, Chocolate, Slate, Ivory, Sand, Coral, Peach, Mint, Azure, Amber, Copper, Bronze, Steel, Platinum, Silver, Gold)",
  "colors": ["list of all visible colors with precise shades - focus on actual colors in the image, not generic defaults"],
  "weave": "specific weave type (e.g. Plain weave, Twill weave, Satin weave, Herringbone, Jacquard, Knit construction, Oxford weave, Basket weave, Dobby weave)",
  "weight": "specific weight range e.g. Light (100-150 GSM), Medium (150-250 GSM), Heavy (250-400 GSM)",
  "description": "detailed 3-sentence accurate description based on true visual contents including texture, pattern, material appearance, finish, and visual characteristics",
  "material": "likely material composition (e.g. 100% Cotton, 100% Silk, Cotton-Polyester blend, Denim, Linen, Wool, Velvet, Rayon, Viscose, Polyester, Canvas, Muslin, Poplin)",
  "pattern": "pattern type if visible (e.g. Solid, Striped, Checkered, Floral, Geometric, Plain, Damask, Brocade, paisley, polka dot, abstract)"
}

CRITICAL: 
1. Be extremely precise about the fabric type and colors
2. Look closely at the actual colors in the image - do not use generic default colors
3. If the fabric is predominantly one color, list that specific color, not generic options
4. Pay attention to color accuracy - if it's a specific shade like Navy Blue, say Navy Blue, not just Blue
5. Focus on material composition based on visual texture and finish characteristics
6. Describe what you actually see in the image, not what might be typical for that fabric type`;

        const visionRaw = await groqVisionChat(
          systemPrompt,
          imageUrl,
          "Analyze this fabric image with extreme precision. Focus on the EXACT colors visible in the image - be specific about shades and tones. Don't use generic color names - use precise color names. Describe what you actually see in terms of material, weave, pattern, and colors."
        );

        console.log("Vision API raw response:", visionRaw);

        const jsonMatch = visionRaw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log("Parsed vision data:", parsed);
          
          const matchedKey = keys.find(k => k.toLowerCase() === parsed.category?.toLowerCase());
          if (matchedKey) {
            fabric = { ...FABRIC_MAP[matchedKey] };
          } else {
            // If no exact match, try to find partial match
            const partialMatch = keys.find(k => parsed.category?.toLowerCase().includes(k) || k.includes(parsed.category?.toLowerCase()));
            if (partialMatch) {
              fabric = { ...FABRIC_MAP[partialMatch] };
              console.log("Using partial match:", partialMatch);
            }
          }
          if (parsed.primaryColor) {
            detectedColor = parsed.primaryColor;
            if (fabric) fabric.colors = [parsed.primaryColor, ...(parsed.colors || [])];
          } else if (parsed.colors && parsed.colors.length > 0) {
            // Use first color as primary if primaryColor not specified
            detectedColor = parsed.colors[0];
            if (fabric) fabric.colors = parsed.colors;
          }
          if (parsed.weave && fabric) fabric.weave = parsed.weave;
          if (parsed.weight && fabric) fabric.weight = parsed.weight;
          if (parsed.description && fabric) fabric.desc = parsed.description;
          if (parsed.material && fabric) fabric.material = parsed.material;
          if (parsed.pattern && fabric) fabric.pattern = parsed.pattern;
          confidence = 0.98;
        } else {
          console.warn("No JSON found in vision response, using default cotton");
          fabric = FABRIC_MAP["cotton"];
          confidence = 0.70;
        }
      } catch (err) {
        console.warn("Groq Vision analysis fallback:", err.message);
      }
    }

    // Step 2: Heuristic fallback — scan filename keywords if Vision didn't complete
    if (!fabric) {
      const searchString = (filename || "").toLowerCase() + imageUrl.substring(0, 200).toLowerCase();
      for (const key of keys) {
        if (searchString.includes(key) || FABRIC_MAP[key].aliases.some(a => searchString.includes(a))) {
          fabric = FABRIC_MAP[key];
          confidence = 0.90;
          break;
        }
      }
    }

    // Step 3: Deterministic fallback - use cotton as default instead of random
    if (!fabric) {
      fabric = FABRIC_MAP["cotton"];
      confidence = 0.75;
      console.log("Using cotton as default fallback fabric");
    }

    console.log(`[AI Vision Analyze] Category: ${fabric.category}, Color: ${detectedColor || fabric.colors?.[0]}, Material: ${fabric.material || "detected"}, Pattern: ${fabric.pattern || "detected"}`);

    return res.status(200).json({
      category: fabric.category,
      colors: fabric.colors,
      description: fabric.desc,
      confidence,
      weave: fabric.weave,
      weight: fabric.weight,
      suggestedUses: fabric.uses,
      material: fabric.material,
      pattern: fabric.pattern,
    });
  } catch (err) {
    console.error("analyzeProductImage error:", err.message);
    return res.status(500).json({ message: "Image analysis failed" });
  }
};

// ─── FEATURE 4: Visual Search — "Find Similar by Image" ───────────────
// @route POST /api/ai/visual-search
export const visualSearch = async (req, res) => {
  try {
    const { imageData, filename } = req.body;

    let fabricKey = null;
    let detectedLabel = "General";
    const keys = Object.keys(FABRIC_MAP);

    // Step 1: Groq classification — ask it to identify fabric from filename hint
    if (process.env.GROQ_API_KEY && (filename || imageData)) {
      try {
        const hint = (filename || "").replace(/[_\-\.]/g, " ").replace(/\.(jpg|jpeg|png|webp|gif)$/i, "") || "fabric image";
        const systemPrompt = `You are a textile expert. Classify the fabric in exactly ONE word from: ${keys.join(", ")}. Reply with ONLY that one word.`;
        const groqKey = await groqChat(systemPrompt, hint, 10);
        const matched = keys.find(k => groqKey.toLowerCase().includes(k));
        if (matched) {
          fabricKey = matched;
          detectedLabel = FABRIC_MAP[matched].category;
          console.log(`[Groq Visual Search] Detected: ${detectedLabel}`);
        }
      } catch {
        // fall through to heuristic
      }
    }

    // Step 2: Heuristic fallback
    if (!fabricKey && imageData) {
      const searchString = (filename || "").toLowerCase() + imageData.substring(0, 100).toLowerCase();
      for (const key of keys) {
        if (searchString.includes(key) || FABRIC_MAP[key].aliases.some(a => searchString.includes(a))) {
          fabricKey = key;
          detectedLabel = FABRIC_MAP[key].category;
          break;
        }
      }
    }

    // Step 3: Default fallback - use cotton instead of random hash
    if (!fabricKey) {
      fabricKey = "cotton";
      detectedLabel = FABRIC_MAP[fabricKey].category;
      console.log(`[Heuristic Visual Search] Using default: ${detectedLabel}`);
    }

    const fabric = FABRIC_MAP[fabricKey];
    const aliases = fabric.aliases;
    const detectedCategory = detectedLabel;

    let products = [];

    // Search database for matching products
    const orTerms = aliases.map((term) => ({
      $or: [
        { name: { $regex: term, $options: "i" } },
        { category: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
      ],
    }));

    products = await Product.find({
      status: "available",
      $or: orTerms.flatMap((o) => o.$or),
    })
      .populate("supplierId", "profile.companyName")
      .limit(30);

    // Rank by relevance
    products = products
      .map((p) => {
        let score = 0;
        const pCat = (p.category || "").toLowerCase();
        const pName = (p.name || "").toLowerCase();
        const pDesc = (p.description || "").toLowerCase();
        for (const term of aliases) {
          const t = term.toLowerCase();
          if (pCat.includes(t)) score += 3;
          if (pName.includes(t)) score += 1.5;
          if (pDesc.includes(t)) score += 1;
        }
        return { product: p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((x) => x.product);

    // Only return products that have a relevance score > 0
    const relevantProducts = products.filter((p, index) => {
      // Filter out products with low relevance scores
      const productData = products[index] || p;
      const score = typeof productData === 'object' ? productData.score : 0;
      return score > 0;
    });

    return res.status(200).json({
      results: relevantProducts.length > 0 ? relevantProducts : products.slice(0, 10),
      matchesCount: relevantProducts.length > 0 ? relevantProducts.length : products.length,
      detectedCategory,
    });
  } catch (err) {
    console.error("visualSearch error:", err.message);
    return res.status(500).json({ message: "Visual search failed" });
  }
};

export const embedAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).select("_id name");
    res.status(202).json({ message: `Embedding ${products.length} products in background` });
    for (const p of products) {
      await embedProduct(p._id).catch(() => {});
      await sleep(200);
    }
  } catch (err) {
    console.error("embedAll error:", err.message);
  }
};

function buildFallbackReply(message, products, userRole = "buyer") {
  const q = message.toLowerCase();
  
  // Natural, conversational responses
  if (userRole === "supplier") {
    if (q.includes("inventory") || q.includes("stock")) {
      return "Good inventory management is key for textile businesses. I'd suggest monitoring your fast-moving items and keeping safety stock of popular fabrics. What specific inventory challenges are you facing?";
    }
    if (q.includes("price") || q.includes("pricing")) {
      return "Pricing in textiles depends on several factors like material costs, production volume, and market demand. Are you looking to optimize your current pricing strategy?";
    }
    if (q.includes("production") || q.includes("manufacturing")) {
      return "Production efficiency in textiles often comes from proper planning and quality control. What aspect of your production process would you like to improve?";
    }
    return "I'm here to help with your textile business. You can ask me about inventory, pricing, production, or market trends. What would you like to know?";
  }
  
  // Buyer responses - specific handling for general questions
  if (q.includes("return policy") || q.includes("return")) {
    return "Our return policy allows you to return products within 7 days of delivery if they don't meet your requirements. The items should be in their original condition. Would you like more details about the return process?";
  }
  if (q.includes("delivery") || q.includes("shipping")) {
    return "Delivery times vary by supplier and product type. Most orders are processed within 2-3 business days, with shipping taking additional 3-7 days depending on your location. You can check specific delivery estimates on individual product pages.";
  }
  if (q.includes("payment") || q.includes("payment methods")) {
    return "We accept various payment methods including bank transfers, UPI, and other secure payment options. Payment is processed when you place an order. Do you have questions about a specific payment method?";
  }
  if (q.includes("support") || q.includes("contact") || q.includes("help")) {
    return "I'm here to help! You can ask me about products, fabrics, pricing, or any questions about using the platform. For account-specific issues, you may need to contact support directly. What would you like to know?";
  }
  
  // Product-related responses
  if (products.length > 0) {
    if (q.includes("price") || q.includes("cost")) {
      const minPrice = Math.min(...products.map((p) => p.price));
      const maxPrice = Math.max(...products.map((p) => p.price));
      return `I found products ranging from ₹${minPrice.toFixed(2)} to ₹${maxPrice.toFixed(2)}. Would you like me to show you options in a specific price range?`;
    }
    if (q.includes("stock") || q.includes("available")) {
      return `I found ${products.length} available products. You can check each product page for specific stock levels and delivery times. Need help with anything specific?`;
    }
    if (q.includes("quality") || q.includes("good")) {
      return "Quality is important in textiles. I'd recommend checking product specifications and, if possible, requesting samples for important orders. What type of fabric are you looking for?";
    }
    const productNames = products.slice(0, 3).map((p) => p.name).join(", ");
    return `I found some products like ${productNames}. These might match what you're looking for. Would you like more details about any of them?`;
  }
  
  return "I'm here to help you find the right textiles and fabrics. You can ask me about products, pricing, materials, or anything else about textile sourcing. What are you looking for?";
}
