
//express설정을 해준다.
const express = require("express");
const Room = require("../model/room");
const Chatting = require("../model/chatting")
//라우터 객체생성해준다.
const router = express.Router();
const fs = require("fs");
const path = require("path");



//멀터세팅
const multer = require("multer");
const roomUpload = multer({
    storage: multer.diskStorage({ //diskStorage는 하드디스크에 업로드 파일을 저장
        destination: (req, file, callback) => { //저장할 경로
            const uploadPath = path.join(__dirname, "..", "static", "room", req.query.roomId);

            //폴더없으면 만들어주기.
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }

            req.uploadbaseURL = "/room/" + req.query.roomId + "/";
            callback(null, uploadPath);
        },

        filename: (req, file, callback) => {//저장할 파일명 설정

            let newName = Date.now() + "." + file.originalname;
            callback(null, newName);
        }

    })
});




const clients = new Set();

//메소드 포스트에서 바디를 불어와줘야함.
router.use(express.urlencoded({ extended: false }));
router.use(express.json())




//로그인 검증해주기
router.use((req, res, next) => {
    if (req.session.auth) {
        next();
    } else {
        return res.status(401).send("로그인한 상태에서만 사용가능합니다.")
    }
});





//ajax => 채팅룸에서 발생한 ajax요청을 처리할 곳.
router.post("/api/chatting", async (req, res) => {
    const room = await Room.findById(req.body.roomId)
    let joiner = room.joiners.map((one) => {
        one.joiner
    })

    try {
        //req.body에  roomId랑 talker, comment가 왔다는 조건 하에
        let result = await Chatting.create({
            ...req.body,
            talker: req.session.userId,
            data: "chat"
        });

        result = result.toObject();

        roomWss.forEach((ws, ownerId) => {
            result.type = result.talker === ownerId ? "mine" : "other";
            //result.type을 넣어주기.
            //talker랑 ownerId가 같으면 mine, 다르면 other
            ws.send(JSON.stringify({ apply: req.body.roomId, type: "new", data: result }))
        })

        res.json({ "success": true, "result": result });


    } catch (err) {
        res.json({ "success": false, "error": err.message })
    }
});


router.get("/", async (req, res) => {
    const rooms = await Room.find({}).sort("-createdAt").lean();
    res.locals.rooms = rooms
    res.render("index")
});






//==============================================
//클라이언트쪽에서 웹소켓 연결이 일어났을 때 작동함.
router.ws("/sse", (ws, req) => {
    console.log("connected by" + req.session.id);
    clients.add(ws);
    ws.on("close", () => {
        console.log("closed...")
        clients.delete(ws);
    })
});

const roomWss = new Map();
router.ws("/rooms", (ws, req) => {
    console.log("ws://~rooms" + req.query.id)
    roomWss.set(req.session.userId, ws); //map에 데이터 저장(key, value)
    ws.on("close", () => {
        roomWss.delete(ws);
    })
});
//================================================


//전체 방목록 불러오기
router.route("/open").get(async (req, res) => {
    const rooms = await Room.find({}).sort("-createdAt").populate("vrTargetCd").lean();
    const chatting = await Chatting.find({}).sort("-createdAt").lean();
    
    console.log(rooms)
    let id = req.session.userId
    res.locals.userId = id;
    res.locals.rooms = rooms;
    res.locals.chatting = chatting;
    res.render("open");

}).post(async (req, res) => {
    let data = { ...req.body, owner: req.session.userId }
    //body안에 title,type,password란 이름으로 데이터가 있다고 가정.
    let rst = await Room.create(data);
  
    //ws설정
    clients.forEach((ws) => {
        ws.send(JSON.stringify({ "type": "new" }));
    });

    res.redirect("/chats/open");
});





//방목록에서 삭제 구현하기.
router.get("/delete", async (req,res)=>{
    let id = req.session.userId

    //세션 아이디값
    const rooms = await Room.find({ "owner": { $all: [id] } })


    let roomOwner = rooms.map(async(one)=>{
       if(one.owner === id){
           const del = await Room.findByIdAndDelete(req.query.id)
           res.locals.del=del;
       }
    })

    //쿼리 아이디값(룸아이디값)

    console.log(roomOwner)

    //세션아이디값이랑 같은 필드를 하나 find함.
    
    res.locals.rooms= rooms;
    res.locals.userId = id;
    
    
    res.redirect("/chats/open");

})





//참여한 방 목록
router.route("/join").get(async (req, res) => {
    //const rooms = await Room.find({joiner:{$all:[req.body.id]}}).sort("-createdAt").lean();
    let id = req.session.userId

    

    const rooms = await Room.find({ "joiners.joiner": { $all: [id] } }).sort("-createdAt").populate("vrTargetCd").lean();
    //lean은 데이터와 펑션이 다 섞여있는거에서 데이터만 가져와주는 기능.
    const chatting = await Chatting.find({}).sort("-createdAt").lean();


    res.locals.userId = id;
    res.locals.chatting = chatting;
    res.locals.rooms = rooms
    res.render("open");

}).post(async (req, res) => {
    
    let data = { ...req.body, owner: req.session.userId }
    //body안에 title,type,password란 이름으로 데이터가 있다고 가정.
    let rst = await Room.create(data);
    
    
    //ws설정
    clients.forEach((ws) => {
        ws.send(JSON.stringify({ "type": "new" }));
    });

    res.redirect("/chats/join");
});




//참여하지 않은 방 목록
router.route("/not").get(async (req, res) => {
    //const rooms = await Room.find({joiner:{$all:[req.body.id]}}).sort("-createdAt").lean();
    let id = req.session.userId
    
    const rooms = await Room.find({ "joiners.joiner": { $nin: [id] } }).lean();
    const chatting = await Chatting.find({}).sort("-createdAt").lean();

    res.locals.userId = id;
    res.locals.chatting = chatting;
    res.locals.rooms = rooms
    res.render("open");

}).post(async (req, res) => {
    let data = { ...req.body, owner: req.session.userId }
    //body안에 title,type,password란 이름으로 데이터가 있다고 가정.
    let rst = await Room.create(data);
    

    //ws설정
    clients.forEach((ws) => {
        ws.send(JSON.stringify({ "type": "new" }));
    });

    res.redirect("/chats/not");
});




//채팅방에서 채팅불러오기
router.get("/rooms", async (req, res) => {

    let join = await Room.findOne({ _id: req.query.id, 'joiners.joiner': req.session.userId })
    let jointime;

    //참여하지 않은 사용자일때
    if (!join) {

        //룸에 조이너 넣어주기
        const room = await Room.findByIdAndUpdate(req.query.id, { $addToSet: { joiners: { joiner: req.session.userId } } }, { returnDocument: "after" }).lean();


        roomWss.forEach((ws) => {
            ws.send(JSON.stringify({ apply: req.query.id, type: "join", id: req.session.userId, joiner: room.joiners }));
        });

        res.locals.room = room;
    } else {

        jointime = join.joiners.find(function (data) {
            return data.joiner == req.session.userId
        }).jointime;


        const room = await Room.findById(req.query.id);
        res.locals.room = room;
    }

    const chatting = await Chatting.find({
        roomId: req.query.id
    }).where("createdAt").gte(jointime).sort("createdAt").lean();
    
    //입장한 다음 시간(jointime)이후의 값들만 출력해주기. 그 전의 값들은 출력X

    res.locals.chatting = chatting.map((elm) => {
        return { ...elm, type: elm.talker == req.session.userId ? "mine" : "other" }
    });

    res.render("room")
    console.log(chatting);
});




//퇴장하기
router.get("/exit", async (req, res) => {

    const room = await Room.findByIdAndUpdate(req.query.id, { $pull: { joiners: { joiner: req.session.userId } } }, { returnDocument: "after" }).lean();
    res.locals.room = room

    //웹소켓
    roomWss.forEach((ws) => {
        ws.send(JSON.stringify({ apply: req.query.id, type: "exit", id: req.session.userId, joiner: room.joiners.joiner }));
    });
    res.redirect("/chats/open")
});



//멀터세팅하고 파일 디비에 넣어주기.
router.post("/api/upload", roomUpload.single("attach"), async (req, res) => {

    try {
        const room = await Room.findById(req.body.roomId)
        let result = await Chatting.create({
            ...req.body,
            talker: req.session.userId,
            data: "file",
            content: `/room/${req.body.roomId}/${req.file.filename}`,
         
        })

        result = result.toObject();
        //result 객체로 보내기.


        roomWss.forEach((ws, ownerId) => {
            result.type = result.talker === ownerId ? "mine" : "other";
            //result.type을 넣어주기.
            //talker랑 ownerId가 같으면 mine, 다르면 other
            ws.send(JSON.stringify({
                apply: req.body.roomId,
                type: "new",
                data: result
            }))
        })
        res.json({ "success": true });

    } catch (err) {
        res.json({ "success": false })
    }
})


module.exports = router;