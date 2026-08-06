import express from "express";
import { createRFQ, getRFQs, respondRFQ, completeRFQ } from "../controllers/rfqController.js";

const router = express.Router();

router.post("/", createRFQ);
router.get("/", getRFQs);
router.patch("/:id", respondRFQ);
router.patch("/:id/complete", completeRFQ);

export default router;
