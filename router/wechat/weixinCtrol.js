var sha1=require('sha1');
var contentType = require('content-type');
var getRawBody = require('raw-body');
var util=require('./util');
var parseString = require('xml2js').parseString;
var weixin=require('./weixin');

module.exports=function(router,opts){
    router.get('/',function(req,res){
        //从配置文件中获取token
        var token=opts.token;

        //从请求参数中获取需要测参数，校验签名
		var signature=req.query.signature;
		var timestamp=req.query.timestamp;
		var nonce=req.query.nonce;
		var echostr=req.query.echostr;

        //将参数排序，hash编码，可以参考微信公众平台文档
        //https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1472017492_58YV5
        var str=[token,timestamp,nonce].sort().join('');
		var hashcode=sha1(str);

        //校验签名，如果服务器配置正确，将返回微信服务器echostr
        //如果错误，就返回错误(可以别的值）,程序返回。
         if(req.baseUrl==""||req.baseUrl=="/"){
            if(hashcode === signature){
                res.send(echostr.toString());
            }else{
                res.send("wrong");
            }
        }
    })
    router.post('/',function(req,res){
         //从配置文件中获取token
        var token=opts.token;

        //从请求参数中获取需要测参数，校验签名
		var signature=req.query.signature;
		var timestamp=req.query.timestamp;
		var nonce=req.query.nonce;
		var echostr=req.query.echostr;

        //将参数排序，hash编码，可以参考微信公众平台文档
        //https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1472017492_58YV5
        var str=[token,timestamp,nonce].sort().join('');
		var hashcode=sha1(str);

        //校验签名，如果正确,继续处理数据，根据请求类型，返回数据。
        //如果错误，就返回错误(可以别的值）,程序返回。
        if(hashcode !== signature){
            res.send("wrong");
            return false;
        }
        getRawBody(req,{length: req.headers['content-length'],limit: '1mb',encoding: contentType.parse(req).parameters.charset},function(err, strings){
            if(err){
                console.log(err);
                return false;
            }
            var content = util.parseXMLmessage(strings).then(function(xmlData) {
                var message = util.formatXMLMessage(xmlData.xml);
                req.weixin = message;
                weixin(req,res,opts);
            });
        });
    })
    return router;
}
