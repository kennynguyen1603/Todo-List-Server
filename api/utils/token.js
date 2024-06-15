import jwt from "jsonwebtoken";
import dotenv from "dotenv";
// import { TokensModel } from "../models/tokensModel.js";
import TokensModel from "../models/tokensModel.js";
dotenv.config();
const token = {
  generateAccessToken: (userData, expiresIn) => {
    return jwt.sign({ userData }, process.env.MY_ACCESS_SECRET_KEY, {
      expiresIn: expiresIn ?? "15m",
    });
  },

  generateRefreshToken: (userData) => {
    return jwt.sign({ userData }, process.env.MY_REFRESH_SECRET_KEY, {
      expiresIn: "7d",
    });
  },

  verifyAccessToken: (accessToken) => {
    try {
      return jwt.verify(accessToken, process.env.MY_ACCESS_SECRET_KEY);
    } catch (error) {
      throw new Error("Invalid access token");
    }
  },

  verifyRefreshToken: (refreshToken) => {
    try {
      return jwt.verify(refreshToken, process.env.MY_REFRESH_SECRET_KEY);
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  },

  revokeRefreshToken: async (refreshToken) => {
    try {
      const decodedToken = jwt.decode(refreshToken);
      if (!decodedToken) {
        throw new Error("Invalid refresh token");
      }
      await TokensModel.findOneAndDelete({
        userId: decodedToken.userData.userId,
        token: refreshToken,
        type: "refreshToken",
      });
    } catch (error) {
      throw new Error("Failed to revoke refresh token");
    }
  },
};

export { token };
