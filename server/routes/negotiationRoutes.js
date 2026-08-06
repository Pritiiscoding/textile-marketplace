import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { startNegotiation, getNegotiations, updateNegotiation, completeNegotiation } from "../controllers/negotiationController.js";

const router = express.Router();

router.post("/", protectRoute, startNegotiation);
router.get("/", protectRoute, getNegotiations);
router.patch("/:id", protectRoute, updateNegotiation);
router.patch("/:id/complete", protectRoute, completeNegotiation);

export default router;
