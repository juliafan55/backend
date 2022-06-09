const { validateEmail, validateLength, validateUsername } = require("../helpers/validation");
const User = require("../models/User")
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