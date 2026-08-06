import express from "express";
import {
  semanticSearch,
  similarProducts,
  getRecommendations,
  chat,
  embedAllProducts,
  smartOnboardingNext,
  analyzeProductImage,
  visualSearch,
} from "../controllers/aiController.js";

const router = express.Router();

// Buyer-accessible AI endpoints
router.post("/search", semanticSearch);
router.get("/similar/:productId", similarProducts);
router.get("/recommendations", getRecommendations);
router.post("/chat", chat);

// AI Onboarding & Image AI
router.post("/onboarding-next", smartOnboardingNext);
router.post("/analyze-image", analyzeProductImage);
router.post("/visual-search", visualSearch);

// Admin / internal — re-embed all products
router.post("/embed-all", embedAllProducts);

export default router;
