import cloudinary from "../../config/cloudinary.js";
// import upload from "../config/multer.js";
const uploadAvatar = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).send({ message: "Avatar is required" });
  }

  const { buffer, mimetype } = req.file;
  const dataUrl = `data:${mimetype};base64,${buffer.toString("base64")}`;

  try {
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: "avatars",
      resource_type: "image",
    });

    req.body.avatarUrl = result.secure_url;
    next();
  } catch (error) {
    res.status(500).send({ message: "Failed to upload avatar", error });
  }
};

export default uploadAvatar;
