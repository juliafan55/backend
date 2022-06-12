const express = require("express");
const router = express.Router();

const { register, activateAccount, login, auth, getProfile, addFriend, cancelRequest, follow, unfollow, acceptRequest, unfriend, deleteRequest, updateProfilePicture } = require("../controllers/user")
const { authUser } = require("../middlewares/auth")

router.post("/register", register)
router.post("/activate", activateAccount)
router.post("/login", login)
router.post("/auth", authUser, auth)
router.get("/getProfile/:username", authUser, getProfile)
router.put("/addFriend/:id", authUser, addFriend)
router.put("/cancelRequest/:id", authUser, cancelRequest)
router.put("/follow/:id", authUser, follow)
router.put("/unfollow/:id", authUser, unfollow)
router.put("/acceptRequest/:id", authUser, acceptRequest)
router.put("/unfriend/:id", authUser, unfriend)
router.put("/deleteRequest/:id", authUser, deleteRequest)
router.put("/updateProfilePicture", authUser, updateProfilePicture)


module.exports = router;