var Token =require('../cognate/token')
var opts=require('../../config/config').wechat
var authInfo=require('../../config/config').authToken
var visitUrl=require('../../config/config').visit_url
var request=require('request');
var Promise=require('promise')
var Moment=require('moment');
var thisFile="minigames.js"

module.exports=function(router){
	var tokenApi=new Token(opts);
    router.get('/miniGame',function(req,res){
        var url='https://open.weixin.qq.com/connect/oauth2/authorize?appid='+opts.appID+'&redirect_uri='+authInfo.miniGame_url+'&response_type=code&scope='+authInfo.scope+'&state='+authInfo.state+'#wechat_redirect';
		global.logger.info("%s|签到跳转页面url:%s",thisFile,url);
        res.redirect(url);
    })
    router.get('/miniGamePage',function(req,res){
        var code =req.query.code;
		global.logger.info("%s|跳转路径携带参数code：%s",thisFile,code);
        tokenApi.getAuthToken(code).then(function(data){
            var _data=data;
			  global.logger.info("%s|获取的access_token信息:%j",thisFile,_data);
			  global.DBManager.wechatUserInfo.findOne({where:{openId:_data.openid}}).then(function(result){
                if(!result){
					global.logger.info("%s|数据库fishdb的wechatUserInfo表中，没有openID:%s的用户，用户没绑定，处理到绑定页面",thisFile,_data.openid);
                    return Promise.resolve(false);
                }else{
					global.logger.info("%s|数据库fishdb的wechatUserInfo表中，有openID:%s的用户",thisFile,_data.openid);
                    return Promise.resolve(result);
                }
            }).then(function(dataInfo){
				var data1=dataInfo.dataValues;
				var nowtime=Moment().format("YYYY-MM-DD HH:mm:ss");
                if(data1 && data1.uid && data1.openId  && data1.info){
				global.DBManager.wechatMiniGame.findAll({attributes:['miniGameName','englishName','miniGameDesc','miniGameIcon','miniGameUrl'],where:{isOpen:true,startTime:{'$lt':nowtime},stopTime:{'$gt':nowtime}}}).then(function(result){
						if(result.length==0){
							global.logger.info("%s|数据库中没有配置小游戏信息",thisFile);
							res.render('noMiniGame.html',{uid:data1.uid});
							return;
						}
						var gameArr=[];
						for (var i=0;i<result.length;i++){
							var game=result[i].dataValues;
							game.miniGameUrl=game.miniGameUrl+'?uid='+(data1.uid).replace("渔夫",'');
							gameArr.push(game);
						}
						global.logger.info("%s|小游戏信息%j",thisFile,gameArr);
					 	res.render('miniGame.html',{uid:data1.uid,gameArr:gameArr});
					 }).catch(function(err){
						global.logger.info("%s|获取小游戏信息失败error:%s",thisFile,error);
						res.render('noMiniGame.html',{uid:data1.uid});
					 })
                }else{
					global.logger.info("%s|用户没绑定，跳转到绑定页面",thisFile);
					res.render('goBind.html',{url:visitUrl.code});
                }
            }).catch(function(err){
				global.logger.error("%s|获取code失败error:%s",thiFile,err);
                res.status(404);
                res.render('404.html');
            })
        })
    });
	//下面是扩展小游戏获取奖励信息，请求接口
	router.post('/birdInfo',function(req,res){
		console.log(req.body);
		res.json({errMsg:"OK"})
	})
	//sevenDay(router)
    return router
}
