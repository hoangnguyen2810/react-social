import { db } from "../connect.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = (req, res) => {
  const q = "SELECT*FROM users Where username = ?";

  db.query(q, [req.body.username], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length) return res.status(409).json("Tài khoản đã tồn tại !");

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);

    const q =
      "INSERT INTO users (`username`,`email`,`password`,`name`) VALUE (?)";

    const values = [
      req.body.username,
      req.body.email,
      hashedPassword,
      req.body.name,
    ];

    db.query(q, [values], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json("Tạo thành công.");
    });
  });
};

export const login = (req, res) => {
  const q = "SELECT * FROM users WHERE username = ?";
  db.query(q, [req.body.username], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0)
      return res.status(404).json("Không tìm thấy người dùng");

    const checkPassword = bcrypt.compareSync(
      req.body.password,
      data[0].password
    );

    if (!checkPassword)
      return res.status(400).json("sai tài khoản hoặc mật khẩu !");

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
