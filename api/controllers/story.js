import moment from "moment";
import { db } from "../connect.js";
import jwt from "jsonwebtoken";
import multer from "multer"; // Import multer

// Cấu hình Multer để lưu tệp upload vào thư mục "public/upload"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "../client/public/upload"); // Thư mục chứa ảnh upload
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname); // Tạo tên tệp duy nhất cho mỗi ảnh
  },
});

const upload = multer({ storage: storage }); // Tạo middleware upload

// Thêm story mới
export const addStory = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) {
    console.log("No token provided.");
    return res.status(401).json("Not logged in!");
  }

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) {
      console.log("Invalid token:", err);
      return res.status(403).json("Token is not valid!");
    }

    // Sử dụng multer để xử lý file upload
    upload.single("img")(req, res, (err) => {
      if (err) {
        // In ra lỗi chi tiết hơn để dễ dàng debug
        console.log("Upload error:", err.message);
        return res.status(500).json("Failed to upload image: " + err.message);
      }

      // Kiểm tra nếu không có ảnh trong request
      if (!req.file) {
        console.log("No image provided.");
        return res.status(400).json("Image is required!");
      }

      // Thêm thông tin vào cơ sở dữ liệu
      const q = "INSERT INTO stories (`img`, `createdAt`, `userId`) VALUES (?)";
      const values = [
        req.file.filename, // Lưu tên tệp vào DB
        moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
        userInfo.id,
      ];

      db.query(q, [values], (err, data) => {
        if (err) {
          console.log("Database error:", err);
          return res.status(500).json(err);
        }
        return res.status(200).json("Story has been created");
      });
    });
  });
};

// Lấy danh sách stories
export const getStories = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const q =
      "SELECT s.id, s.img, u.name FROM stories s JOIN users u ON u.id = s.userId WHERE s.userId = ? ORDER BY s.createdAt DESC";

    db.query(q, [userInfo.id], (err, data) => {
      if (err) return res.status(500).json(err);

      // Trả về đường dẫn chính xác đến ảnh
      const result = data.map((story) => ({
        id: story.id,
        name: story.name,
        img: `/upload/${story.img}`, // Đảm bảo URL chính xác cho ảnh
      }));

      return res.status(200).json(result);
    });
  });
};
// Xóa story
export const deleteStory = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) {
    console.log("No token provided.");
    return res.status(401).json("Not logged in!");
  }

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) {
      console.log("Invalid token:", err);
      return res.status(403).json("Token is not valid!");
    }

    if (!req.params.id) {
      console.log("No story ID provided.");
      return res.status(400).json("Story ID is required!");
    }

    const q = "DELETE FROM stories WHERE `id` = ? AND `userId` = ?";
    db.query(q, [req.params.id, userInfo.id], (err, data) => {
      if (err) {
        console.log("Database error:", err);
        return res.status(500).json(err);
      }
      if (data.affectedRows > 0) {
        return res.status(200).json("Story has been deleted.");
      } else {
        return res.status(403).json("You can only delete your story!");
      }
    });
  });
};
