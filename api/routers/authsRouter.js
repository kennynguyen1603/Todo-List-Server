import { Router } from "express";
import authController from "../controllers/authController.js";
import { validateRegistrationFields } from "../middlewares/auth/validateRegistrationFields.js";
import uploadAvatar from "../middlewares/auth/uploadAvatar.js";
import upload from "../config/multer.js";
const AuthRouter = Router();

AuthRouter.post(
  "/register",
  upload.single("avatarUrl"),
  validateRegistrationFields,
  uploadAvatar,
  authController.registerUser
);

AuthRouter.post("/login", authController.login);

AuthRouter.post("/refresh", authController.refreshAccessToken);

AuthRouter.post("/logout", authController.logout);

export default AuthRouter;
