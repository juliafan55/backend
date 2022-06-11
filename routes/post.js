const express = require("express");
const router = express.Router();

const { createPost, getAllPosts, comment, deletePost } = require("../controllers/post")
const { authUser } = require("../middlewares/auth")

router.post("/createPost", authUser, createPost)
router.get("/getAllPosts", authUser, getAllPosts)
router.put("/comment", authUser, comment)
router.delete("/deletePost/:id", authUser, deletePost)


module.exports = router;