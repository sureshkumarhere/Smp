import mongoose from 'mongoose'



const messageSchema = mongoose.Schema({
    sender: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true , 
    },
    group: {
        type: mongoose.Types.ObjectId,
        ref: 'Group',
        required: true , 
    },
    content: {
        type: String, 
    },
    attachments: [{
        public_id: {
            type: String, 
            // required: true, 
        },
        url: {
            type: String, 
            // required: true, 
        }
    }]
})


const Message = mongoose.model('Message', messageSchema);
export default Message; 