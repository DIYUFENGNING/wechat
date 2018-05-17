var Token =require('../../cognate/token')
var opts=require('../../../config/config').wechat
var authInfo=require('../../../config/config').authToken
var visitUrl=require('../../../config/config').visit_url
var request=require('request');
var Promise=require('promise')
var Moment=require('moment');
var remoteRequest=global.remoteRequest;
var thisFile="sevenDay.js"

module.exports=function(router){
	var tokenApi=new Token(opts);
    router.get('/sevenDay',function(req,res){
        var url='https://open.weixin.qq.com/connect/oauth2/authorize?appid='+opts.appID+'&redirect_uri='+authInfo.activePrefix_url+'sevenDayPage'+'&response_type=code&scope='+authInfo.scope+'&state='+authInfo.state+'#wechat_redirect';
		global.logger.info("%s|签到跳转页面url:%s",thisFile,url);
        res.redirect(url);
    })
    router.get('/sevenDayPage',function(req,res){
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
                if(data1.uid && data1.openId  && data1.info){
					global.logger.info("%s|用户已经绑定",thisFile);
					Process(data1.uid,function(err,data){
						if(!err && data){
							global.logger.info("%s|用户uid:%s 到活动页面",thisFile,data1.uid);
							res.render('active/sevenDay.html',{uid:data1.uid,awardArr:data});
						}else{
							global.logger.info("%s|用户uid:%s 活动不存在",thisFile,data1.uid);
							res.render('noActive.html',{uid:data1.uid});
						}
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
	router.post('/getSevenDayAward',function(req,res){
		var data=req.body;
		processAward(data,function(err){
			if(err){
				global.logger.error("%s|通知游戏服给玩家发奖品:%j,通知游戏服错误error:%s",thisFile,msg,err);
				res.json({errcode:'2001',errMsg:'database error,create failed'});
				return;
			}
			global.logger.info("%s|玩家领取奖品记录成功，玩家与奖品信息:%j",thisFile,data);
			res.json({errcode:'0',errMsg:'OK'});
		})
	})
    return router
}
function Process(uid,cb){
	 global.DBManager.wechatSevenDay.findAll({attributes:['day','awardContent','awardDesc']}).then(function(result){
		if(result.length==0){
			global.logger.info("%s|7 天活动奖品信息没有配置",thisFile);
			cb(null,null);
		}
		var awardArr=[];
		for(var i=0;i<result.length;i++){
			var award=result[i].dataValues;
			award.awardContent=JSON.parse(award.awardContent);
			awardArr.push(award);
		}
		global.logger.info("%s|7天活动奖品信息：%j",thisFile,awardArr);
		global.DBManager.wechatSevenDayRecord.findAll({attributes:['day','getTime'],where:{uid:uid}}).then(function(_result){
			var getArr={};
			var key=0;
			var flag=false;
			var nowDate=Moment().format("YYYY-MM-DD");
			for (var i=0;i<_result.length;i++){
				var tmp=_result[i].dataValues;
				getArr[''+tmp.day]=tmp;
				if(tmp.getTime==nowDate){
					flag=true;
				}
				key++;
			}
			for (var j=0;j<awardArr.length;j++){
				if(getArr[''+awardArr[j].day]){
					awardArr[j].isGet=2
				}else{
					awardArr[j].isGet=0
				}
			}
			if(!flag){
				awardArr[key].isGet=1;
			}
			global.logger.info("%s|7天活动，处理用户领取过的数据",thisFile);
			cb(null,awardArr);
		}).catch(function(err){
			global.logger.info("%s|7天活动查询文件领取信息出现错误error:%s",thisFile,err);
			console.log(err)
	        cb(err,null);
		})
	 }).catch(function(err){
		global.logger.info("%s|7天活动,查取活动配置信息出现错误error:%s",thisFile,err);
		cb(err,null);
	});
}
function processAward(data,cb){
	var uid=data.uid;
	var day=parseInt(data.day);
	var nowDate=Moment().format("YYYY-MM-DD");
	global.DBManager.wechatSevenDay.findOne({attributes:['awardContent',],where:{day:day}}).then(function(result){
		var  awardContent=result.dataValues.awardContent;
		var saveData={
			uid:uid,
			day:day,
			awardContent:awardContent,
			getTime:nowDate
		}
	//	console.dir(awardContent) '{"award":[{"propId": 1001,"amount": 28000,"icon": "//resource.wanchuangyou.com/gh_resource/2.0.3.0004/chargeRebate/images/Icon/HD_Icon02.png"}]}'
		var awards=JSON.parse(awardContent).award;
		var sendAward={};
		for(var i=0;i<awards.length;i++){
			sendAward[awards[i]["propId"]]=awards[i]["amount"]
		}
		console.dir(sendAward)
		var msg={
            reqType:18002,
            param:{
               uid:uid,
               award:sendAward
            }
        }
		global.logger.info("%s|向游戏服请求的发送奖品信息的数据：%j",thisFile,msg);
		remoteRequest.request("weiXinMail",msg,function(err,result){
            if(err != null){
				global.logger.error("%s|请求游戏服给玩家uid:%s发送奖品出现错误,error:%s",thisFile,uid,err);
               cb(err);
			   return;
            }
			global.logger.info("%s|请求游戏服给玩家uid:%s发送奖品成功，返回信息:%s",thisFile,uid,result);
			global.DBManager.wechatSevenDayRecord.create(saveData).then(function(results){
				global.logger.info("%s|玩家uid:%s领取奖品记录成功",thisFile,uid);
            	cb(null)
        	}).catch(function(err){
				global.logger.error("%s|玩家uid:%s领取奖品记录到数据库出错，错误信息:%s",thisFile,uid,err);
            	cb(err)
        	})
        })
	}).catch(function(err){
		global.logger.error("%s|查询奖品信息出错，错误信息:%s",thisFile,err)
		cb(err);
	})
}
