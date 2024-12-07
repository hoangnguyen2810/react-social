import express from "express";
import { getStories, addStory, deleteStory } from "../controllers/story.js";

const router = express.Router();

// Route để lấy danh sách stories
router.get("/", getStories);

// Route để thêm story mới
router.post("/", addStory);

// Route để xóa story
router.delete("/:id", deleteStory);

export default router;
