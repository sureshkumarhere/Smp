const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
		},
		lastName: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		regNo: {
			type: String, 
			required: true,
			unique:true, 

		}, 
		image: {
			type: String,
			default: function () {
				// generate an initials avatar using Dicebear
				const seed = `${this.firstName} ${this.lastName}`;
				return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
			},
		},
		accountType: {
			type: String,
			enum: ["student", "mentor", "admin"],
			default: "student",
		},
	},
	{
		timestamps: true,
	}
);

const User = mongoose.model("User", userSchema);
module.exports = User;
