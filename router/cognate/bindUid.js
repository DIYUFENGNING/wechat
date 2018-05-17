/**
 * 获取access_token 的Url=https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code,
 * 此处的access_token 与公众号中的access_token不一样。
 */
var Token =require('./token')
var opts=require('../../config/config').wechat
var authInfo=require('../../config/config').authToken
var urlInfo=require('../../config/config').visit_url
var request=require('request');
var Promise=require('promise');
var remoteRequest=global.remoteRequest;
var thisFile="bindUid.js"
module.exports=function(router){
    var tokenApi=new Token(opts);
	 router.get('/code',function(req,res){
        var url='https://open.weixin.qq.com/connect/oauth2/authorize?appid='+opts.appID+'&redirect_uri='+authInfo.redirect_url+'&response_type=code&scope='+authInfo.scope+'&state='+authInfo.state+'#wechat_redirect'
		global.logger.info("%s|跳转路径:%s",thisFile,url);
        res.redirect(url);
    })

    router.get('/bind',function(req,res){
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
                if(data1 && data1.dataValues.uid && data1.dataValues.openId && data1.dataValues.openId!='' && data1.dataValues.info &&data1.dataValues.info!=''){
					global.logger.info("%s|用户已经绑定",thisFile);
                    res.render('afterBatch.html',{uid:data1.uid});
                }else{
					_data.scopes=_data.scope;
					delete _data.scope;
					global.logger.info("%s|用户没有绑定",thisFile);
                    res.render('beforeBatch.html',_data);
                }
            }).catch(function(err){
				global.logger.error("%s|请求绑定页面出错，错误信息:%j",thisFile,err);
                res.status(404);
                res.render('404.html');
            })
        })
    })
	router.post('/checkCode',function(req,res){
        var uid=req.body.uid;
        var wechatInfo=req.body;
        var checkCode=Math.random().toString(16).substr(3,6);
		global.logger.info("%s|获取验证码，用户uid:%s请求的数据%j,生成验证码:%s",thisFile,uid,wechatInfo,checkCode);
		global.DBManager.wechatUserInfo.findOne({where:{openId:wechatInfo.openid}}).then(function(result){
            if(!result){
				global.logger.info("%s|数据库的wechatUserInfo表中没有当前用户uid:%s,openid:%s的信息，下面开始创建",thisFile,uid,wechatInfo.opneId);
                global.DBManager.wechatUserInfo.create({uid:uid,openId:wechatInfo.openid,checkCode:checkCode}).then(function(_reslut){
                    global.logger.info("%s|生成验证码后的用户基本信息，写入数据库的wechatUserInfo表中成功",thisFile)
					var msg={
						reqType:18001,
						param:{
							uid:uid,
							code:checkCode
						}
					}
					global.logger.info("%s|请求游戏服务器发送验证码邮件，请求信息：%j",thisFile,msg);
					remoteRequest.request("weiXinMail",msg,function(err,result){
						if(err != null){
							res.json({'errcode':3001,'errMsg':'send email error'});
							global.logger.error("%s|向游戏服请求给uid:%s用户发邮件失败error：%s。",thisFile,uid,err);
							return;
						}
						res.json({'errcode':0,'errMsg':'OK'});
						global.logger.info("%s|向游戏服请求给uid:%s用户发邮件成功result:%j。",thisFile,uid,result);
						
					})
                }).catch(function(err){
                    res.json({'errcode':2001,'errMsg':'database error,create failed'});
					global.logger.error("%s|向数据库中创建用户的带有验证码基本信息失败error：%s。",thisFile,err);
                })
            }else {
				global.logger.info("%s|数据库的wechatUserInfo表中有当前用户uid:%s,openid:%s的信息，下面开始更新验证码",thisFile,uid,wechatInfo.opneId);
                global.DBManager.wechatUserInfo.update({uid:uid,checkCode:checkCode},{where:{openId:wechatInfo.openid}}).then(function(result){
					global.logger.info("%s|用户已经存在，还没绑定，更新验证码成功",thisFile)
                    var msg={
                        reqType:18001,
                        param:{
                            uid:uid,
                            code:checkCode
                        }
                    }
					global.logger.info("%s|更新验证码，请求游戏服务器发送验证码邮件，请求信息：%j",thisFile,msg);
                    remoteRequest.request("weiXinMail",msg,function(err,result){
                        if(err != null){
                            res.json({'errcode':3001,'errMsg':'send email error'});
							global.logger.error("%s|更新验证码，向游戏服请求给uid:%s用户发邮件失败error：%s。",thisFile,uid,err);
                            return;
                        }
                        res.json({'errcode':0,'errMsg':'OK'});
						global.logger.info("%s|更新验证码，向游戏服请求给uid:%s用户发邮件成功result:%j。",thisFile,uid,result);
                    })
                }).catch(function(err){
                    res.json({'errcode':2001,'errMsg':'database error,create failed'});
					global.logger.error("%s|更新验证码失败，error:%j",thisFile,err);
                })
            }
        })
    });
	router.post('/bind',function(req,res){
        var checkCode =req.body.checkCode;
        var uid=req.body.uid;
        var wechatInfo=req.body;
		global.logger.info("%s|绑定处理，获取验证码，用户uid:%s请求的数据%j,请求验证码:%s",thisFile,uid,wechatInfo,checkCode);
        global.DBManager.wechatUserInfo.findOne({ attributes: ['checkCode'],where:{uid:uid}}).then(function(result){
			if(!result.dataValues.checkCode){
				res.json({
					errcode:"3002",
					errMsg:"checkCode not exist"
				});
				global.logger.info("%s|当前用户uid:%s的验证码不存在",thisFile,uid);
			}
            if(result.dataValues.checkCode==checkCode){
			
              if(wechatInfo.expires_in>(new Date().getTime())){
                  tokenApi.getUserInfo(wechatInfo).then(function(_datas){
                      global.DBManager.wechatUserInfo.update({info:JSON.stringify(_datas)},{where:{uid:uid}}).then(function(result){
						  res.json({
						  	errcode:'0',
							errMsg:'OK',
							redirect_uri:urlInfo.code
						  })
						global.logger.info("%s|当前用户uid:%s绑定成功",thisFile,uid);
                      }).catch(function(err){
                          res.json({
						  	errcode:'2003',
                            errMsg:'database error ,update failed'
						  })
						  global.logger.info("%s|当前用户uid:%s绑定失败",thisFile,uid),err;
                          return Promise.reject(err);
                      })
                  })
              }else{
					global.logger.info("%s|当前access_token过期",thisFile);
                  tokenApi.refreshToken(wechatInfo).then(function(_datas){
                      tokenApi.isValidAuthToken(_datas).then(function(_result){
                          if(_result){
								global.logger.info("%s|当前access_token有效",thisFile);
                               tokenApi.getUserInfo(wechatInfo).then(function(_dataS){
                                global.DBManager.wechatUserInfo.update({info:JSON.stringify(_dataS)},{where:{uid:uid}}).then(function(result){
									res.json({
        		                   	    errcode:'0',
		                            	errMsg:'OK',
                		            	redirect_uri:authInfo.redirect_url
                        		    })
									global.logger.info("%s|当前用户uid:%s绑定失败",thisFile,uid);
                                }).catch(function(err){
                                    res.json({
        			                    errcode:'2003',
		            	                errMsg:'database error ,update failed'
                        		    })
									global.logger.info("%s|当前用户uid:%s绑定失败error:%s",thisFile,uid,err);
                                    return Promise.reject(err);
                                })
                            })
                          }else{
                              res.json({
                                errcode: '3002',
                                errMsg: "access_token过期，refresh_token过期"
                              })
							global.logger.info("%s|当前access_token过期，需要用户重新请求页面",thisFile);
                          }
                      })
                  })
              }
            }else{
                res.json({
                    errcode: '3001',
                    errMsg: "验证码不正确"
                });
				global.logger.info("%s|验证码不正确",thisFile);
            }
        }).catch(function(err){
            res.json({
                errcode: '2001',
                errMsg: "数据库异常"
            });
			 global.logger.error("%s|获取数据中玩家uid:%s的验证码错误",thisFile,uid);
        })
        
        
    });

    router.post('/unbind',function(req,res){
        var uid=req.body.uid;
		global.logger.info("%s|玩家uid:%s请求解绑",thisFile,uid);
        global.DBManager.wechatUserInfo.destroy({where:{uid:uid}}).then(function(result){
             res.json({'errcode':'0','errMsg':'OK'});
			 global.logger.info("%s|玩家uid:%s解绑成功",thisFile,uid);
        }).catch(function(err){
              res.json({'errcode':'2003','errMsg':'database error,delete dailed'});
			  global.logger.info("%s|玩家uid:%s解绑失败:%j",thisFile,uid,err);  
        });
    });
    return router;
}
