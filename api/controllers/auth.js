import { db } from "../connect.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = (req, res) => {
  // Kiểm tra xem tất cả các trường có được cung cấp không
  const { username, email, password, name } = req.body;

  if (!username || !email || !password || !name) {
    return res.status(400).json("Vui lòng điền đầy đủ thông tin.");
  }

  // Kiểm tra định dạng email hợp lệ
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json("Địa chỉ email không hợp lệ.");
  }

  // Kiểm tra độ dài mật khẩu
  if (password.length < 8) {
    return res.status(400).json("Mật khẩu phải có ít nhất 8 ký tự.");
  }

  // Kiểm tra tài khoản đã tồn tại
  const q = "SELECT * FROM users WHERE username = ?";
  db.query(q, [username], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length) return res.status(409).json("Tài khoản đã tồn tại!");

    // Kiểm tra email đã tồn tại
    const emailCheckQuery = "SELECT * FROM users WHERE email = ?";
    db.query(emailCheckQuery, [email], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data.length) return res.status(409).json("Email đã được sử dụng!");

      // Mã hóa mật khẩu
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Thực hiện thêm người dùng vào cơ sở dữ liệu
      const q =
        "INSERT INTO users (`username`, `email`, `password`, `name`) VALUES (?)";
      const values = [username, email, hashedPassword, name];

      db.query(q, [values], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json("Tạo tài khoản thành công.");
      });
    });
  });
};

export const login = (req, res) => {
  const q = "SELECT * FROM users WHERE email = ?"; // Thay đổi truy vấn từ username sang email
  db.query(q, [req.body.email], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0)
      return res.status(404).json("Không tìm thấy người dùng");

    const checkPassword = bcrypt.compareSync(
      req.body.password,
      data[0].password
    );

    if (!checkPassword)
      return res.status(400).json("Sai tài khoản hoặc mật khẩu!");

    const token = jwt.sign({ id: data[0].id }, "secretkey");

    const { password, ...others } = data[0];
    res
      .cookie("accessToken", token, {
        httpOnly: true,
      })
      .status(200)
      .json(others);
  });
};

export const logout = (req, res) => {
  res
    .clearCookie("accessToken", {
      httpOnly: true, // Đảm bảo cookie chỉ được gửi qua HTTP
      secure: true, // Chỉ truyền cookie qua HTTPS
      sameSite: "none", // Hỗ trợ chia sẻ cookie giữa các nguồn gốc khác nhau
    })
    .status(200)
    .json("Đăng xuất thành công.");
};
