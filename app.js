//1. 회원가입/로그인 - 1:1대화 , 1:N대화 지원하는 웹서비스
//2. 대화중에 이미지나 파일을 공유할 수 있게 만들기


const express = require("express");
const app = express();

const path = require("path");

const uri = "mongodb+srv://mernyuyu:wkdrnahr777@cluster0.qeg74yn.mongodb.net/?retryWrites=true&w=majority"
const mongoose = require("mongoose")
mongoose.connect(uri,{dbName:"study"});


//웹소켓 설정
const expressWs=require("express-ws")
const wsInstance = expressWs(app);



app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "view"));

app.use(express.static(path.join(__dirname, "static")));



const session = require("express-session");
const session_secret = "P@ssw0rd"

app.use(session({
    secret: "P@sww0rd", //필수설정 -> 비밀키
    resave: true, //요청이 왔을 때 세션에 수정사항이 생기지 않더라도 세션을 다시 저장할지 설정
    saveUninitialized: true}));
    
app.use("/account", require("./router/accountRoute"));
app.use("/chats", require("./router/chatsRoute"));

app.listen(8080,() => { console.log("server start") })
