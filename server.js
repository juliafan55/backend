//dependencies
const express = require("express");
const app = express();

const cors = require("cors");
const dotenv = require("dotenv").config()

const mongoose = require("mongoose")

//middleware
app.use(cors())
app.use(express.json())

//dynamically adding routes
const {readdirSync} = require("fs")
readdirSync("./routes").map((r) => app.use("/", require("./routes/" + r)));

//db
mongoose.connect(process.env.MONGODB, {
    useNewUrlParser: true,
})
    .then(() => console.log("db connected"))
    .catch((err) => console.log("error connecting to db", err));






app.listen(process.env.PORT, () => console.log("backend running"));