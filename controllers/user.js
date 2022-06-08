const { validateEmail, validateLength, validateUsername } = require("../helpers/validation");
const User = require("../models/User")
const bcrypt = require("bcrypt")

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
        res.json(user);
    } catch (error) {
        res.status(500).json({message: error.message})
}
}