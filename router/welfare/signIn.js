var Token =require('../cognate/token')
var opts=require('../../config/config').wechat
var authInfo=require('../../config/config').authToken
var visitUrl=require('../../config/config').visit_url
var request=require('request');
var Promise=require('promise')
var Moment=require('moment');
var remoteRequest=global.remoteRequest;
var thisFile="signIn.js"

module.exports=function(router){
	var tokenApi=new Token(opts);
    router.get('/page',function(req,res){
        var url='https://open.weixin.qq.com/connect/oauth2/authorize?appid='+opts.appID+'&redirect_uri='+authInfo.signIn_url+'&response_type=code&scope='+authInfo.scope+'&state='+authInfo.state+'#wechat_redirect'
		global.logger.info("%s|签到跳转页面url:%s",thisFile,url);
        res.redirect(url);
    })
    router.get('/signIn',function(req,res){
        var code =req.query.code;
		global.logger.info("%s|跳转路径携带参数code：%s",thisFile,code);
        tokenApi.getAuthToken(code).then(function(data){
            var _data=data;
			  global.logger.info("%s|获取的access_token信息:%j",thisFile,_data)
			  global.DBManager.wechatUserInfo.findOne({where:{openId:_data.openid}}).then(function(result){
                if(!result){
					global.logger.info("%s|数据库fishdb的wechatUserInfo表中，没有openID:%s的用户，用户没绑定，处理到绑定页面",thisFile,_data.openid);
                    return Promise.resolve(false);
                }else{
					global.logger.info("%s|数据库fishdb的wechatUserInfo表中，有openID:%s的用户",thisFile,_data.openid);
                    return Promise.resolve(result);
                }
            }).then(function(data1){
                if(data1 && data1.uid && data1.openId  && data1.info){
					global.logger.info("%s|用户已经绑定",thisFile);
                  	global.DBManager.wechatSignInAward.findAll().then(function(result){
						var AwardArr=result[0].dataValues;
						global.logger.info("%s|签到领取的奖励:%j",thisFile,AwardArr);
						var getTime=Moment(new Date()).format("YYYY-MM-DD");
						global.DBManager.wechatSignInAwardRecord.findOne({where:{uid:data1.uid,openId:data1.openId,getTime:getTime}}).then(function(result){
							if(!result){
								var isGet=false;
    		                    res.render('signIn.html',{uid:data1.uid,openId:data1.openId,AwardArr:AwardArr,isGet:isGet});
								global.logger.info("%s|用户uid:%s当前的奖励没领取，返回领取",data1.uid);
								return;
							}
							var isGet=true;
                            res.render('signIn.html',{uid:data1.uid,openId:data1.openId,AwardArr:AwardArr,isGet:isGet});
							global.logger.info("%s|用户uid:%s当前的奖励已领取，返回已领取",data1.uid);
						}).catch(function(err){
							 global.logger.error("%s|从数据库中查询奖品是否领取信息失败error:%s",thisFile,err);
							 res.render('404.html');	
						})
					}).catch(function(err){
						global.logger.error("%s|从数据中查询签到奖品信息失败error:%s",thisFile,err);
						res.render('404.html');
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
    })


	router.post('/getAward',function(req,res){
		var data=req.body;
/*{ uid: '4423935',
 *  openId: 'oJ93R07DIB5MLhMamBbdc6QErU8A',
 *  itemName: '金币',
 *  itemId: '1001',
 *  itemNum: '100' }
 * */	
		data.getTime=Moment(new Date()).format("YYYY-MM-DD");
		global.logger.info("%s|领取奖品信息:%j",thisFile,data);
		var sendAward={};
		sendAward[data.itemId]=data.itemNum;
		 var msg={
            reqType:18002,
            param:{
               uid:data.uid,
               award:sendAward
            }
        }
		remoteRequest.request("weiXinMail",msg,function(err,result){
            if(err != null){
               res.json({
					 errcode:'3001',
                	errMsg:'send award eamil failed'
				})
				global.logger.error("%s|通知游戏服给玩家发奖品:%j,通知游戏服错误error:%s",thisFile,msg,err);
               return;
            }
			global.logger.info("%s|通知游戏服给玩家发送信息成功",thisFile);
           	global.DBManager.wechatSignInAwardRecord.create(data).then(function(result){
            	res.json({
                	errcode:'0',
                	errMsg:'OK'
            	})
				global.logger.info("%s|玩家领取奖品记录成功，玩家与奖品信息:%j",thisFile,data);
        	}).catch(function(err){
				global.logger.error("%s|玩家领取奖品记录失败，错误信息error:%s",thisFile,err);
            	res.json({
                	errcode:'2001',
                	errMsg:'database error,create failed'
            	})
        	})
        })

	})
    return router
}
