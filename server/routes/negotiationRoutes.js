import express from "express";
import { startNegotiation, getNegotiations, updateNegotiation, completeNegotiation } from "../controllers/negotiationController.js";

const router = express.Router();

router.post("/", startNegotiation);
router.get("/", getNegotiations);
router.patch("/:id", updateNegotiation);
router.patch("/:id/complete", completeNegotiation);

export default router;
