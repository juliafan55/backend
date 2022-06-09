const express = require("express");
const router = express.Router();

const { uploadImages } = require("../controllers/upload")
const { authUser } = require("../middlewares/auth")
const imageUpload = require("../middlewares/imageUpload")

router.post("/uploadImages", imageUpload, uploadImages)

module.exports = router;