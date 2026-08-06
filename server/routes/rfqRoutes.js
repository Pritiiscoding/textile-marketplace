import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { createRFQ, getRFQs, respondRFQ, completeRFQ } from "../controllers/rfqController.js";

const router = express.Router();

router.post("/", protectRoute, createRFQ);
router.get("/", protectRoute, getRFQs);
router.patch("/:id", protectRoute, respondRFQ);
router.patch("/:id/complete", protectRoute, completeRFQ);

export default router;
