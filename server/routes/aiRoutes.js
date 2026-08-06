import express from "express";
import { protectRoute, requireRole } from "../middleware/authMiddleware.js";
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
router.post("/search", protectRoute, semanticSearch);
router.get("/similar/:productId", protectRoute, similarProducts);
router.get("/recommendations", protectRoute, getRecommendations);
router.post("/chat", protectRoute, chat);

// AI Onboarding & Image AI
router.post("/onboarding-next", protectRoute, smartOnboardingNext);
router.post("/analyze-image", protectRoute, analyzeProductImage);
router.post("/visual-search", protectRoute, visualSearch);

// Admin / internal — re-embed all products
router.post("/embed-all", protectRoute, requireRole("admin"), embedAllProducts);

export default router;
