const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    image_urls: [
      {
        type: String,
      },
    ],
    video_urls: [
      {
        type: String,
      },
    ],
    // New: generic files (PDF, DOCX, ZIP, etc.)
    files: [
      {
        url: { type: String },
        name: { type: String }, // original filename
      },
    ],
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
