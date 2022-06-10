const { validateEmail, validateLength, validateUsername } = require("../helpers/validation");
const User = require("../models/User")
const Post = require("../models/Post")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const { generateToken } = require("../helpers/tokens");
const { sendVerificationEmail } = require("../helpers/mailer");

exports.register = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            username,
            email,
            password,
            bYear,
            bMonth,
            bDay,
            gender,
        } = req.body;
        
        //validating email
        if (!validateEmail(email)) {
            return res.status(400).json({message: "Invalid email address"})
        }
        //checking if email used is already in db
        const check = await User.findOne({ email: email });
        if (check) {
            return res.status(400).json({message: "Email already taken, try with another email or login"})
        }

        //validating first name length
        if (!validateLength(first_name, 1, 30)) {
            return res.status(400).json({message: "first name must be between 1 and 30 characters"})
        }
        //validating last name length
        if (!validateLength(last_name, 1, 30)) {
            return res.status(400).json({message: "last name must be between 1 and 30 characters"})
        }
        //validating password length
        if (!validateLength(password, 6, 50)) {
            return res.status(400).json({message: "password must be at least 6 characters"})
        }

        const cryptedPassword = await bcrypt.hash(password, 12);
        
        let tempUsername = first_name + last_name;
        let newUsername = await validateUsername(tempUsername)

        const user = await new User({
            first_name,
            last_name,
            username:newUsername,
            email,
            password:cryptedPassword,
            bYear,
            bMonth,
            bDay,
            gender,
        }).save()
        const emailVerificationToken = generateToken({ id: user._id.toString() }, "30m");
        
        const url = `${process.env.BASE_URL}/activate/${emailVerificationToken}`;
        sendVerificationEmail(user.email, user.first_name, url)
        const token = generateToken({ id: user._id.toString() }, "7d");
        res.send({
            id: user._id,
            username: user.username,
            picture: user.picture,
            first_name: user.first_name,
            last_name: user.last_name,
            token: token,
            verified: user.verified,
            message: "Registered Successfuly! Please activate your email to start using Digital Hub!",
        })

        
    } catch (error) {
        res.status(500).json({message: error.message})
}
}

exports.activateAccount = async (req, res) => {
    try {
        const { token } = req.body;
        const user = jwt.verify(token, process.env.TOKEN_SECRET)
        //checking if user is already active
        const check = await User.findById(user.id);
        if (check.verified == true) {
            return res.status(400).json({ message: "This account is already activated." });
        } else {
            await User.findByIdAndUpdate(user.id, { verified: true });
            return res.status(200).json({ message: "Account has been activated successfully" });
        }
    } catch (error) {
        res.status(500).json({message: error.message})
}
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });
        //checking if there's an user
        if (!user) return res.status(400).json({message: "The email address entered is not connected to an account."})
        
        //checking if password entered is correct
        const check = await bcrypt.compare(password, user.password);
        if (!check) {
            return res.status(400).json({message: "Invalid credentials. Please try again."})
        }

        const token = generateToken({ id: user._id.toString() }, "7d");
        res.send({
            id: user._id,
            username: user.username,
            picture: user.picture,
            first_name: user.first_name,
            last_name: user.last_name,
            token: token,
            verified: user.verified,
        })
    } catch {
        res.status(500).json({message: error.message})
    }
}

exports.auth = (req, res) => {
    res.json("welcome from auth")
}

exports.getProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findById(req.user.id)
        const profile = await User.findOne({ username: username }).select("-password");
        const friendship = {
            friends: false,
            following: false,
            requestSent: false,
            requestReceived: false,
        }; 
        if (!profile) {
            return res.json({ok:false})
        }


        if (user.friends.includes(profile._id) && profile.friends.includes(user._id)) {
            friendship.friends = true;
        }

        if (user.following.includes(profile._id)) {
            friendship.following = true;
        }

        if (user.requests.includes(profile._id)) {
            friendship.requestReceived = true;
        }

        if (profile.requests.includes(user._id)) {
            friendship.requestSent = true
        }

        const posts = await Post.find({ user: profile._id })
            .populate("user")
            .sort({ createdAt: -1 })
        
        res.json({...profile.toObject(), posts, friendship});
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

exports.addFriend = async (req, res) => {
    try {
      if (req.user.id !== req.params.id) {
        const sender = await User.findById(req.user.id);
        const receiver = await User.findById(req.params.id);
        if (
          !receiver.requests.includes(sender._id) &&
          !receiver.friends.includes(sender._id)
        ) {
          await receiver.updateOne({
            $push: { requests: sender._id },
          });
          await receiver.updateOne({
            $push: { followers: sender._id },
          });
          await sender.updateOne({
            $push: { following: receiver._id },
          });
          res.json({ message: "friend request has been sent" });
        } else {
          return res.status(400).json({ message: "Already sent" });
        }
      } else {
        return res
          .status(400)
          .json({ message: "You can't send a request to yourself" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

exports.cancelRequest = async (req, res) => {
    try {
        if(req.user.id !== req.params.id){
            const sender = await User.findById(req.user.id)
            const receiver = await User.findById(req.params.id)
            if (receiver.request.includes(sender._id) &&
                !receiver.friends.includes(sender._id)) {
                await receiver.updateOne({
                    $pull: {requests: sender._id}
                })
                await receiver.updateOne({
                    $pull: {followers: sender._id}
                })
                await sender.updateOne({
                    $pull: {following: sender._id}
                })
                res.json({message:"Friend request cancelled."})
            } else {
                return res.status(400).json({message:"Already cancelled"})
            }
        } else {
            return res.status(400).json({message:"You can't send a request to yourself"})
        }
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

exports.follow = async (req, res) => {
    try {
        if(req.user.id !== req.params.id){
            const sender = await User.findById(req.user.id)
            const receiver = await User.findById(req.params.id)
            if (!receiver.request.includes(sender._id) &&
                !sender.following.includes(receiver._id)) {
                await receiver.updateOne({
                    $push: {followers: sender._id}
                })
                await sender.updateOne({
                    $push: {following: receiver._id}
                })
                res.json({message:"Successfully following"})
            } else {
                return res.status(400).json({message:"Already following"})
            }
        } else {
            return res.status(400).json({message:"You can't follow yourself"})
        }
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

exports.unfollow = async (req, res) => {
    try {
        if(req.user.id !== req.params.id){
            const sender = await User.findById(req.user.id)
            const receiver = await User.findById(req.params.id)
            if (receiver.followers.includes(sender._id) &&
                receiver.following.includes(receiver._id)) {
                await receiver.updateOne({
                    $pull: {followers: sender._id}
                })
                await sender.updateOne({
                    $pull: {following: receiver._id}
                })
                res.json({message:"Successfully unfollowing"})
            } else {
                return res.status(400).json({message:"Already not following"})
            }
        } else {
            return res.status(400).json({message:"You can't unfollow yourself"})
        }
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

exports.acceptRequest = async (req, res) => {
    try {
        if(req.user.id !== req.params.id){
            const receiver = await User.findById(req.user.id)
            const sender = await User.findById(req.params.id)
            if (receiver.requests.includes(sender._id)) {
                await receiver.update({
                    $push: {friends: sender._id, following: sender._id}
                })
                await sender.update({
                    $push: {friends: receiver._id, followers: receiver._id}
                })
                await receiver.updateOne({
                    $pull: {requests: sender._id}
                })
                res.json({message:"Friend request accepted"})
            } else {
                return res.status(400).json({message:"Already friends"})
            }
        } else {
            return res.status(400).json({message:"You can't accept a request from yourself yourself"})
        }
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

exports.unfriend = async (req, res) => {
    try {
        if(req.user.id !== req.params.id){
            const sender = await User.findById(req.user.id)
            const receiver = await User.findById(req.params.id)
            if (receiver.friends.includes(sender._id) &&
                sender.friends.includes(receiver._id)) {
                await receiver.update({
                    $pull: {friends: sender._id, following: sender._id, followers:sender._id}
                })
                await sender.update({
                    $pull: {friends: receiver._id, following: receiver._id, followers:receiver._id}
                })

                res.json({message:"Unfriend request accepted"})
            } else {
                return res.status(400).json({message:"Already not friends"})
            }
        } else {
            return res.status(400).json({message:"You can't unfriend yourself"})
        }
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

exports.deleteRequest = async (req, res) => {
    try {
        if(req.user.id !== req.params.id){
            const receiver = await User.findById(req.user.id)
            const sender = await User.findById(req.params.id)
            if (receiver.requests.includes(sender._id)){
                await receiver.update({
                    $pull: {requests: sender._id, followers: sender._id}
                })
                await sender.update({
                    $pull: { following: receiver._id }
                })

                res.json({message:"delete request accepted"})
            } else {
                return res.status(400).json({message:"Already deleted"})
            }
        } else {
            return res.status(400).json({message:"You can't delete yourself"})
        }
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}