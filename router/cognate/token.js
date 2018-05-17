var Promise=require('promise');
var request=require('request');
var prefix="https://api.weixin.qq.com/sns/";
var api={
    authToken:prefix+'oauth2/access_token?',
    refreshToken:prefix+'oauth2/refresh_token?',
    userInfo:prefix+'userinfo?',
    isValid:prefix+'auth?'
}


function Token(opts){
    this.appId=opts.appID;
	this.token = opts.token;
	this.appsecret=opts.appsecret;
}

Token.prototype.isValidAuthToken=function(data){
    var access_token=data.access_token;
    var openid=data.openid;
    var url=api.isValid+'access_token='+access_token+'&openid='+openid
    return new Promise(function(resolve,reject){
         request({url:url,json:true},function(error,response,body){
             if(error){
                 reject(error)
             }
             var _data=body;
             if(_data.errcode==0){
                 resolve(true);
             }else{
                 resolve(false);
             }
         })
    })
}

Token.prototype.getAuthToken=function(code){
    var that=this;
    var appid=this.appId;
    var secret=this.appsecret;
    var url=api.authToken+"appid="+appid+"&secret="+secret+"&code="+code+"&grant_type=authorization_code"
    return new Promise(function(resolve,reject){
        request({method:'GET',url:url,json:true},function(error,response,body){
            if(error){
                reject(error);
            }
            var data=body;
			if(data.errcode){
				reject(data)
			}
            var now=(new Date().getTime());
            var expires_in=now+(data.expires_in-20)*1000;
            data.expires_in=expires_in;
            resolve(data);
        })
    })
}

Token.prototype.refreshToken=function(outData){
    var that=this;
    return new Promise(function(resolve,reject){
            var refresh_Token=outData.refresh_Token;
            var appid=that.appId;
            var url=api.refreshToken+"appid="+appid+"&grant_type=refresh_token&refresh_token="+refresh_Token
            request({url:url,json:true},function(error,response,body){
                if(error){
                    reject(error);
                }
                var data=body;
                var now=(new Date().getTime());
                var expires_in=now+(data.expires_in-20)*1000;
                data.expires_in=expires_in;
                resolve(data);
            })
    })
}

Token.prototype.getUserInfo=function(outData){
    return new Promise(function(resolve,reject){
            var access_token=outData.access_token;
            var openid=outData.openid;
            var url=api.userInfo+'access_token='+access_token+'&openid='+openid+'&lang=zh_CN'
            request({url:url,json:true},function(error,response,body){
                 if(error){
                    reject(error);
                }
                var data=body;
                resolve(data);
            })
    })
}

module.exports=Token;
