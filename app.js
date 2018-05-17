'use strict';
//引用模块
var express=require('express');
var bodyParser = require('body-parser');
var ejs=require('ejs');
var router=express.Router();
//读取配置文件

var config=require('./config/config');
var GameServerConfig = config.GameServerConfig;
global.logger = require('./logger.js');
global.DBManager = require("./DBManager/DB.js")(config.DBConfig);
global.remoteRequest=require("./libs/RemoteRequest/Client.js")(GameServerConfig);


var wechatModule=require('./router/wechat/weixinCtrol')(router,config.wechat)
var menuRouter=require('./router/black/menuRouter')(router,config.wechat)
var tagRouter=require('./router/black/tagRouter')(router,config.wechat)
var userRouter=require('./router/black/userRouter')(router,config.wechat)
var userRouter=require('./router/black/userRouter')(router,config.wechat)
var authTokenRouter=require('./router/cognate/bindUid')(router)
var signInRouter=require('./router/welfare/signIn')(router)
var mallRouter=require('./router/welfare/gameMall')(router)
var activeRouter=require('./router/welfare/actives')(router)
var miniGameRouter=require('./router/welfare/minigames')(router)
var uploadRouter=require('./router/welfare/upload')(router)

var app=express();

app.set("view engine", 'ejs');
app.engine('html', ejs.renderFile);
app.set('views', __dirname + '/views');
app.use(express.static('public'));
app.use(express.static('uploads'));


app.use(bodyParser.json({limit:'10mb'}));
app.use(bodyParser.urlencoded({limit:'10mb', extended: false}));

app.use(wechatModule);
app.use('/menu',menuRouter);
app.use('/tag',tagRouter);
app.use('/user',userRouter);
app.use('/cognate',authTokenRouter);
app.use('/welfare',signInRouter);
app.use('/mall',mallRouter);
app.use('/active',activeRouter);
app.use('/miniGame',activeRouter);
app.use('/upload',uploadRouter);

app.get("/aaa",function(req,res){
	console.log("有请求")
	res.send("aaaaaaaaaaaaaaa");	
})
app.listen(config.server.port,function(){
	global.logger.info("server run at http://0.0.0.0:"+config.server.port);
});
