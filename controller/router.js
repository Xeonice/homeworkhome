var file = require("../modles/file.js");
var formidable = require("formidable");
var db = require("../modles/db.js");
var utils = require("../modles/utils.js");
getJson = function (req,callback) {
    var json = {
        "username" : req.session.username || "请登录",
        "islogin" : req.session.login,
        "xuehao" : req.session.xuehao,
        "isadmin" : req.session.isAdmin
    }
    callback(json);
}

exports.logout = function (req,res,next) {
     req.session.islogin = false;
    delete req.session.username;

    file.getAllFolder(function (allFolder) {
        utils.getJson(req,function (json) {
            json.albums = allFolder;
            json.islogin = false;
            res.render("index",json);
        })
    });
}
exports.showIndex = function (req,res) {
    //res.render("test");
    file.getAllFolder(function (allFolder) {
        utils.getJson(req,function (json) {
            json.albums = allFolder;
            res.render("index",json);
        })
    });
}
exports.login = function (req, res, next) {
    utils.getJson(req,function (json) {
        res.render("login",json);
    })
}
exports.showAlbum = function (req, res,next) {
    if(!req.session.login){
        next();
        return;
    }
    var fileName = req.params.albumName;

    file.getAllFileByFolderName(fileName,function (err, filesArray) {
        if(err){
            next();
            return;
        }
        utils.getJson(req,function (json) {
            json.files = filesArray;
            json.filename = fileName;
            res.render("showfile", json);
        });
    });
}
exports.shangchuan = function (req,res,next) { //显示上传页面
    if(!req.session.login){
        next();
        return;
    }
    utils.getJson(req,function (json) {
        res.render("shangchuan",json);
    })
}
exports.register = function (req, res) {
    res.render("register");
}
exports.doshangchuan = function (req, res, next) {
    if(!req.session.login){
        next();
        return;
    }
    file.saveFileToDir(req,"1",function (err) {
        if(err){
            return;
        }
        res.set('refresh', '3;url=http://218.195.250.2/');
        res.send("提交作业成功，3秒后返回首页");
    })
  

        // var xuehao =req.session.xuehao;
        // var extname = path.extname(files.zuoye.name);
        // var name =req.session.username;
        // var oldpath = files.zuoye.path;
        // var newpath =   form.uploadDir + "/uploads/"+xuehao+"/" + xuehao + "_" + name +extname;
        // if(!fs.existsSync(form.uploadDir + "/uploads/"+xuehao )){
        //     fs.mkdirSync(form.uploadDir + "/uploads/" +xuehao);
        // }
        // fs.renameSync(oldpath,newpath,function (err) {
        //     if(err){
        //         //res.send("失败12344");
        //         res.send(err);
        //     }
        // });



}
exports.doregist = function (req, res, next) {
    var form = new formidable.IncomingForm();
    form.parse(req,function (err, fields) {
        console.log(fields);
        db.insertOne("users",{
            "dengluming" : fields.xuehao,
            "mima" : fields.mima
        },function (mongoError,res) {
            if(mongoError){
                res.send("-1");
                return;
            }
            res.send("1");
        });
    });
}
exports.checklogin = function (req, res, next) {
    var form = new formidable.IncomingForm();
    form.parse(req,function (err, fields) {
        var username = fields.xuehao;
        var password = fields.mima;
        console.log(username + password);
        db.find("students",{"sno" : username}, function (err, result) {
            if(err){
                res.send("-1");
                return;
            }
            if(result.length == 0){
                res.send("-2");
                return;
            }
            if(password == result[0].mima){
                req.session.login = "1";
                req.session.xuehao = username;
                req.session.username = result[0].name;
                req.session.isAdmin = result[0].isadmin;
                res.send("1");
                return;
            }else{
                res.send("-1");
                return;
            }
        });
    });
}
exports.doxiugaimima = function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req,function (err, fields) {
        console.log(fields);
        db.find("students",{"sno":req.session.xuehao, "mima" : fields.oldmima},function (err, result) {
            console.log(result);
            if(result.length == 0){
                res.end("-2");//负二表示密码错误
                return;
            }
            db.updateMany("students",{
                "sno" : req.session.xuehao
            },{
                $set:{"mima" : fields.newmima}
            }, function (mongoError,result2) {
                if(mongoError){
                    console.log(mongoError);
                }
                res.end("1");
                return;
            });
        })

    });
}
exports.xiugaimima = function (req, res, next) {
    if(!req.session.login){
        next();
        return;
    }
    utils.getJson(req,function (json) {

    })
}
exports.showUserCenter = function (req, res, next) {
    if(req.session.xuehao != req.params.xuehao){
        res.render("你没有权限访问别人的个人中心");
    }
    utils.getJson(req,function (json) {
        res.render("userCenter", json);
    });
}
exports.showErr = function (req, res) {
    utils.getJson(req,function (json) {
        res.render("err",json);
    })
}
exports.admin = function (req, res, next) {
    console.log(req.session.isAdmin);
    if(!req.session.isAdmin){
        next();
        return;
    }
    utils.getJson(req,function (json) {
        res.render("setHomework",json);
    });
}
exports.setHomework = function (req, res, next) {
    if(!req.session.isAdmin){
        next();
        return;
    }
    var form = new formidable.IncomingForm();
    form.parse(req,function (err, fields) {
        if(err){
            res.send("作业布置失败");
            return;
        }
        console.log(fields);
        db.insertOne("homeworks",{
            "end_time" : fields.end_time,
            "zuoyebiaoti" : fields.zuoyebiaoti,
            "zuoyeyaoqiu" : fields.zuoyeyaoqiu,
            "classType" : fields.usertype,
            "class" : fields.classlist
        },function (mongoError,result) {
            if(mongoError){
                res.send("-1");
                return;
            }
            res.send("1");
        });
    });

}
exports.showHomework = function (req, res, next) {
    if(!req.session.login){
        next();
        return;
    }

    utils.getJson(req,function (json) {
        file.getAllHomework("",function (err, result) {
            if(err){
                res.render("获取作业出现问题");
                return;
            }
            json.homework = result;
            res.render("showHomework",json);
        });
    });
}