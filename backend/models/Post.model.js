import mongoose from "mongoose";

// const postSchema = new mongoose.Schema(
//   {
//     topic: { type: String, required: true },
//     creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     semesters: { type: [Number], required: true },
//     links: { type: [String], default: [] },
//     tags: { type: [String], default: [] },
//     description: { type: String, required: true },
//     upvotes: { type: Number, default: 0 },
//     downvotes: { type: Number, default: 0 },
//     comments: [
//       {
//         text: { type: String, required: true },
//         user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//         createdAt: { type: Date, default: Date.now }
//       }
//     ]
//   },
//   { timestamps: true }  // Automatically adds `createdAt` and `updatedAt`
// );


const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});




const Post = mongoose.model("Post", postSchema);
export default Post;
