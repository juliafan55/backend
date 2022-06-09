const express = require("express");
const router = express.Router();

const { createPost, getAllPosts } = require("../controllers/post")
const { authUser } = require("../middlewares/auth")

router.post("/createPost", authUser, createPost)
router.get("/getAllposts", authUser, getAllPosts)


module.exports = router;