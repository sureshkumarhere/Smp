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
		image_urls: [{
			type: String,
		}], 
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
