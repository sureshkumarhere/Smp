const Chat = require("../models/chat");
const Message = require("../models/message");

const createMessage = async (req, res) => {
    // Add files = [] to destructuring
    const { message, chatId, image_urls = [], video_urls = [], files = [] } = req.body;
    
    // Allow messages with media/files even if text is empty
    if (!message && image_urls.length === 0 && video_urls.length === 0 && files.length === 0) {
        return res.status(400).json({ message: "Message or media content is required" });
    }

    try {
        const newMessage = await Message.create({
            sender: req.user._id,
            message: message || "", // Allow empty message if media exists
            chat: chatId,
            image_urls,
            video_urls,
            files // Save generic files (PDF, DOCX, ZIP, etc.)
        });

        // Update chat's latest message
        await Chat.findByIdAndUpdate(chatId, {
            latestMessage: newMessage._id
        });

        // Populate response data (existing functionality preserved)
        const fullMessage = await Message.findById(newMessage._id)
            .populate("sender", "-password")
            .populate({
                path: "chat",
                populate: { 
                    path: "users groupAdmin", 
                    select: "-password" 
                }
            });

        return res.status(201).json({ data: fullMessage });

    } catch (error) {
        console.error("Error creating message:", error);
        return res.status(500).json({ 
            message: "Failed to create message",
            error: error.message 
        });
    }
};

const allMessage = async (req, res) => {
    try {
        const chatId = req.params.chatId;
        const messages = await Message.find({ chat: chatId })
            .populate("sender", "-password")
            .populate("chat")
            .sort({ createdAt: 1 }); // Preserve message order

        return res.status(200).json({ data: messages });

    } catch (error) {
        console.error("Error fetching messages:", error);
        return res.status(500).json({ 
            message: "Failed to retrieve messages",
            error: error.message 
        });
    }
};

const clearChat = async (req, res) => {
    try {
        const chatId = req.params.chatId;
        await Message.deleteMany({ chat: chatId });
        return res.status(200).json({ message: "Chat history cleared successfully" });

    } catch (error) {
        console.error("Error clearing chat:", error);
        return res.status(500).json({ 
            message: "Failed to clear chat history",
            error: error.message 
        });
    }
};

module.exports = { createMessage, allMessage, clearChat };
