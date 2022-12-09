
const { Router } = require("express");

//express설정을 해준다.
const express = require("express");

//라우터 객체생성해준다.
const router = express.Router();


//메소드 포스트에서 바디를 불어와줘야함.
router.use(express.urlencoded({ extended: false }));




router.route("/signin")
    .get((req, res) => {
        res.render("signin");
    })

    .post(async (req, res) => {
            req.session.auth = true;
            req.session.userId = req.body.id;
            res.redirect("/chats/open");
    })


//내보내기


module.exports = router;