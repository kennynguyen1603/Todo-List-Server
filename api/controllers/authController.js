import UsersModel from "../models/usersModel.js";
import TokensModel from "../models/tokensModel.js";
import bcrypt from "bcrypt";
import { token } from "../utils/token.js";

const authController = {
  // Register a new user
  registerUser: async (req, res) => {
    try {
      const { username, email, password, career, avatarUrl } = req.body;
      const saltRounds = 10;

      const existingUser = await UsersModel.findOne({
        $or: [{ username }, { email }],
      });
      if (existingUser) {
        return res
          .status(409)
          .send({ message: "Username or email already exists!" });
      }

      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);

      const createdUser = await UsersModel.create({
        username,
        email,
        password: hashedPassword,
        career: career,
        avatarUrl: avatarUrl,
      });

      return res.status(201).send({
        data: createdUser,
        message: "User registered successfully!",
        success: true,
      });
    } catch (error) {
      return res.status(error.status || 500).send({
        data: null,
        message: error.message || "Internal server error",
        success: false,
      });
    }
  },
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password)
        throw new Error("Username and password are required");

      const user = await UsersModel.findOne({ username });

      if (!user) {
        return res.status(401).send({ message: "User not found!" });
      }

      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const accessToken = token.generateAccessToken(
        { userId: user._id, email: user.email },
        "15m"
      );
      const refreshToken = token.generateRefreshToken({
        userId: user._id,
        email: user.email,
      });

      req.session.user = { id: user._id, email: user.email };

      await new TokensModel({
        userId: user._id,
        token: refreshToken,
        type: "refreshToken",
      }).save();

      return res.status(200).send({
        message: "Login successful",
        token: {
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        user: {
          userId: user._id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      return res.status(error.status || 500).send({
        data: null,
        message: error.message || "Internal server error",
        success: false,
      });
    }
  },
  refreshAccessToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw new Error("Refresh token is required");

      let decodedToken = token.verifyRefreshToken(refreshToken);
      if (!decodedToken) {
        return res.status(403).send({ message: "Invalid Refresh Token!" });
      }

      const tokenRecord = await TokensModel.findOne({
        userId: decodedToken.userData.userId,
        token: refreshToken,
        type: "refreshToken",
      });

      if (!tokenRecord)
        return res.status(403).send({ message: "Invalid Refresh Token!" });

      const user = await UsersModel.findById(decodedToken.userData.userId);

      const newAccessToken = token.generateAccessToken(
        { userId: tokenRecord.userId, email: user.email },
        "15m"
      );

      const newRefreshToken = token.generateRefreshToken({
        userId: tokenRecord.userId,
        email: user.email,
      });

      await token.revokeRefreshToken(refreshToken);

      await new TokensModel({
        userId: user._id,
        token: newRefreshToken,
        type: "refreshToken",
      }).save();

      return res.status(200).send({
        message: "Access token refreshed successfully",
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      return res.status(error.status || 500).send({
        data: null,
        message: error.message || "Internal server error",
        success: false,
      });
    }
  },
  logout: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) throw new Error("Refresh Token Is Required!");

      const deleted = await TokensModel.findOneAndDelete({
        token: refreshToken,
      });
      if (!deleted) {
        return res.status(404).send({ message: "Refresh Token not found" });
      }

      return res.status(200).send({ message: "Logout successful" });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },
};

export default authController;
