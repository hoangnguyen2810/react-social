import express from "express";
import {
  getComments,
  addComment,
  deleteComment,
} from "../controllers/comment.js"; // Thêm deleteComment vào đây

const router = express.Router();

router.get("/", getComments); // Route để lấy bình luận
router.post("/", addComment); // Route để thêm bình luận
router.delete("/:id", deleteComment); // Route để xóa bình luận theo id

export default router;
