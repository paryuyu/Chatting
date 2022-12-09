const mongoose = require("mongoose");
const chattingSchema = new mongoose.Schema({
    roomId: { type: mongoose.SchemaTypes.ObjectId, ref: "room", required: true },
    talker: { type: String, required: true },
    content: String,
    data: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    //읽을 수 있는 사람으로 추가
    readable: [String],
    unread: [String],
})

module.exports = mongoose.model("chatting", chattingSchema)