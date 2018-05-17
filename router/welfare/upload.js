var Token =require('../cognate/token')
var opts=require('../../config/config').wechat
var authInfo=require('../../config/config').authToken
var visitUrl=require('../../config/config').visit_url
var request=require('request');
var Promise=require('promise')
var Moment=require('moment');
var multer  = require('multer');
var uploadMu = multer({ 
	dest: 'uploads/',
	rename:function(fieldname,filename){
		 return filename.replace(/\W+/g, '-').toLowerCase() + Date.now()
	}	
 });
var thisFile="upload.js"

module.exports=function(router){
	var tokenApi=new Token(opts);
    router.get('/upload',function(req,res){
        var url='https://open.weixin.qq.com/connect/oauth2/authorize?appid='+opts.appID+'&redirect_uri='+authInfo.upload_url+'&response_type=code&scope='+authInfo.scope+'&state='+authInfo.state+'#wechat_redirect';
		global.logger.info("%s|跳转路径:%s",thisFile,url);
        res.redirect(url);
    })
    router.get('/uploadPage',function(req,res){
        var code =req.query.code;
		global.logger.info("%s|跳转路径携带参数code：%s",thisFile,code);
        tokenApi.getAuthToken(code).then(function(data){
            var _data=data;
			  global.logger.info("%s|获取的access_token信息:%j",thisFile,_data)
			  global.DBManager.wechatUserInfo.findOne({where:{openId:_data.openid}}).then(function(result){
                if(!result){
					lobal.logger.info("%s|数据库fishdb的wechatUserInfo表中，没有openID:%s的用户，用户没绑定，处理到绑定页面",thisFile,_data.openid);
                    return Promise.resolve(false);
                }else{
					global.logger.info("%s|数据库fishdb的wechatUserInfo表中，有openID:%s的用户",thisFile,_data.openid);
                    return Promise.resolve(result);
                }
            }).then(function(dataInfo){
				var data1=dataInfo.dataValues;
                if(data1 && data1.uid && data1.openId  && data1.info){
					global.logger.info("%s|用户uid:%s存在，跳转到上传页面",thisFile,data1.uid);
					res.render('uploadImage.html',{uid:data1.uid})
                }else{
					global.logger.info("%s|用户没绑定，跳转到绑定页面",thisFile);
					res.render('goBind.html',{url:visitUrl.code});
                }
            }).catch(function(err){
				global.logger.error("%s|查询玩家uid:%s信息错误error:%s",thisFile,_data.uid,err);
                res.status(404);
                res.render('404.html');
            })
        })
    })
	router.post('/uploadHybird',uploadMu, function (req, res){
			var fileInfo=req.files;
			var commData=req.body;
			var Msg=commData.Msg;
			commData.file=JSON.stringify(req.files)
			global.logger.info("%s|上传图片信息:%j,文字信息:%s",thisFile,commData.file,Msg);
			if(Msg){
				global.DBManager.wechatUserBug.create(commData).then(function(result){
					 global.logger.info("%s|文件上传，记录到数据库成功",thisFile);
					 res.json({
                    	errcode:'0',
                    	errMgs:'OK'
                	})
				}).catch(function(err){
					global.logger.error("%s|文件上传,记录到数据库失败:%s",thisFile.err);
					res.json({
						errcode:'2001',
                        errMgs:'database error,create BUGInfo failed'
					})
				})
			}
	})
    return router
}
