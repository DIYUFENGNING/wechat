var Token =require('../cognate/token')
var opts=require('../../config/config').wechat
var authInfo=require('../../config/config').authToken
var visitUrl=require('../../config/config').visit_url
var request=require('request');
var Promise=require('promise')
var Moment=require('moment');
var thisFile="actives.js"

var sevenDay=require('./active/sevenDay')


module.exports=function(router){
	var tokenApi=new Token(opts);
    router.get('/active',function(req,res){
        var url='https://open.weixin.qq.com/connect/oauth2/authorize?appid='+opts.appID+'&redirect_uri='+authInfo.active_url+'&response_type=code&scope='+authInfo.scope+'&state='+authInfo.state+'#wechat_redirect';
		global.logger.info("%s|签到跳转页面url:%s",thisFile,url);
        res.redirect(url);
    })
    router.get('/activePage',function(req,res){
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
					 global.logger.info("%s|用户已经绑定",thisFile);
					 global.DBManager.wechatActive.findAll({attributes:['activeName','englishName','activeDesc','activeIcon'],where:{isOpen:true,startTime:{'$lt':nowtime},stopTime:{'$gt':nowtime}}}).then(function(result){
						if(result.length==0){
							global.logger.info("%s|数据库中没有配置活动信息",thisFile);
							res.render('noActive.html',{uid:data1.uid});
							return;
						}
						var activeArr=[];
						for (var i=0;i<result.length;i++){
							var active=result[i].dataValues;
							active.activeUrl=visitUrl.activePrefix+active.englishName;
							activeArr.push(active);
						}
					 	res.render('active.html',{uid:data1.uid,activeArr:activeArr});
						global.logger.info("%s|活动信息%j",thisFile,activeArr);
					 }).catch(function(err){
                        global.logger.info("%s|获取活动信息失败error:%s",thisFile,err);
                        res.render('noActive.html',{uid:data1.uid});
                     })
                }else{
					res.render('goBind.html',{url:visitUrl.code});
					global.logger.info("%s|用户没绑定，跳转到绑定页面",thisFile);
                }
            }).catch(function(err){
				global.logger.error("%s|获取code失败error:%s",thiFile,err);
                res.status(404);
                res.render('404.html');
            })
        })
    })
	sevenDay(router)
    return router
}
