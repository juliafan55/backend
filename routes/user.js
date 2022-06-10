const express = require("express");
const router = express.Router();

const { register, activateAccount, login, auth, getProfile } = require("../controllers/user")
const { authUser } = require("../middlewares/auth")

router.post("/register", register)
router.post("/activate", activateAccount)
router.post("/login", login)
router.post("/auth", authUser, auth)
router.get("/getProfile/:username", authUser, getProfile)


module.exports = router;