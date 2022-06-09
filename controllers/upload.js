exports.uploadImages = async (req, res, next) => {
    try {
        res.json("welcome from image upload")
    } catch (error) {
        return res.status(500).json({message: error.message})
    }
}