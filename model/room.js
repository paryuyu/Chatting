

const mongoose = require("mongoose");
const roomSchema = new mongoose.Schema({

    title: String,
    owner: String,
    chat: [String],
    joiners: [{
        joiner: String,
        jointime: { type: Date, default: Date.now } //디폴트 써두면 자동생성됨.
    }],

    type: String,
    password: String,

    createdAt: { type: Date, default: Date.now },
         //이건 몽구스에 등록할 이름이랑 동일해야함

roomId:{
    type:String,
    ref:"chatting"
  },
});


roomSchema.virtual("sign").get(()=>{
    return "Edupoll"
  });


roomSchema.virtual("vrTargetCd",{
    localField:"_id",
    ref:"chatting",
    foreignField:"roomId",
    justOne: true
  
})



module.exports = mongoose.model("room", roomSchema)
