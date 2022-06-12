const Post = require("../models/Post");

exports.createPost = async (req, res) => {
  try {
    const post = await new Post(req.body).save();
    await post.populate("user", "first_name last_name cover picture username")
    res.json(post);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


exports.getAllPosts = async (req, res) => {
  try {
    // const posts = await Post.find()
    //   .populate("user")
    //   .sort({ createdAt: -1 });
    // res.json(posts);
    const userPosts = await Post.find({ user: req.user.id })
      .populate("user", "first_name last_name picture username cover")
      .populate("comments.commentBy", "first_name last_name picture username")
      .sort({ createdAt: -1 })
    res.json(userPosts)
  
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



exports.comment = async (req, res) => {
  try {
    const { comment, image, postId } = req.body;
    let newComments = await Post.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: {
            comment: comment,
            image: image,
            commentBy: req.user.id,
            commentAt: new Date(),
          },
        },
      },
      {
        new: true,
      }
    ).populate('comments.commentBy', "first_name last_name username commentAt picture");
    res.json(newComments.comments)
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndRemove(req.params.id)
    res.json({status:"ok"})
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}