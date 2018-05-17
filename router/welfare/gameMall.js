var Token =require('../cognate/token')
var opts=require('../../config/config').wechat
var authInfo=require('../../config/config').authToken
var visitUrl=require('../../config/config').visit_url
var request=require('request');
var Promise=require('promise')
var Moment=require('moment');
var thisFile="gameMall.js"

module.exports=function(router){
	var tokenApi=new Token(opts);
    router.get('/pages',function(req,res){
        var url='https://open.weixin.qq.com/connect/oauth2/authorize?appid='+opts.appID+'&redirect_uri='+authInfo.mall_url+'&response_type=code&scope='+authInfo.scope+'&state='+authInfo.state+'#wechat_redirect';
		global.logger.info("%s|签到跳转页面url:%s",thisFile,url);
        res.redirect(url);
    })
    router.get('/mallPage',function(req,res){
        var code =req.query.code;
		global.logger.info("%s|跳转路径携带参数code：%s",thisFile,code);
        tokenApi.getAuthToken(code).then(function(data){
            var _data=data;
			  global.logger.info("%s|获取的access_token信息:%j",thisFile,_data);
			  global.DBManager.wechatUserInfo.findOne({where:{openId:_data.openid}}).then(function(result){
                if(!result){
					global.logger.info("%s|数据库fishdb的wechatUserInfo表中，没有openID:%s的用户，用户没绑定，处理到绑定页面",thisFile,_data.openid)
                    return Promise.resolve(false);
                }else{
					global.logger.info("%s|数据库fishdb的wechatUserInfo表中，有openID:%s的用户",thisFile,_data.openid);
                    return Promise.resolve(result);
                }
            }).then(function(dataInfo){
				var data1=dataInfo.dataValues;
                if(data1 && data1.uid && data1.openId  && data1.info){
					 global.DBManager.wechatMall.findAll({where:{isDisplay:true}}).then(function(_datas){
						if(!_datas){
							//返回一个商场没开通的页面，尽请等待页面，稍后在做
							return;
						}
						var coinArr=[];
						var diamandArr=[];
						for(var i=0;i<_datas.length;i++){
							if(_datas[i].dataValues.itemId=='1001'){
								coinArr.push(_datas[i].dataValues)
							}else{
								diamandArr.push(_datas[i].dataValues);
							}
						}
						global.logger.info("%s|商品信息获得成功，显示到客户端",thisFile) //data1.openId
						res.render('mall.html',{uid:data1.uid,openid:data1.openId,coinArr:coinArr,diamandArr:diamandArr});
					 }).catch(function(err){
						console.log(err);
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
	router.post("/order",function(req,res){
		var data=req.body;
		var url="https://hwiap.wanchuangyou.com:8487/preorder/1001/pubaccount.js"
		request({method:"POST",url:url,body:data,json:true,rejectUnauthorized: false},function(err,resp,_body){
			if(err){
				res.json({"code":-1,"error":err});
				return;
			}
			res.json(_body)
		})
	})
	router.post('/buy',function(req,res){
		var data=req.body;
		console.dir(data);
		data.getTime=Moment(new Date()).format("YYYY-MM-DD");
		global.DBManager.wechatSignInAwardRecord.create(data).then(function(result){
			res.json({
				errcode:'0',
				errMsg:'OK'
			})
		}).catch(function(err){
			console.log(err)
			res.json({
				errcode:'2001',
				errMsg:'database error,create failed'
			})
		})
	})
    return router
}
