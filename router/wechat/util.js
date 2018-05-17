var parseString = require('xml2js').parseString;
var Promise=require('promise');
var tpl=require("./tpl");
exports.parseXMLmessage=function(xml){
    return new Promise(function(resolve,reject){
        parseString(xml,{trim:true},function(err,data){
            if(err)reject(err);
            else resolve(data);
        })
    })
}

function formatMessage(result){
    var message={};
    if(typeof result ==='object'){
        var keys=Object.keys(result);
        for (var i=0;i<keys.length;i++){
            var item =result[keys[i]]
            var key=keys[i]
            if(!(item instanceof Array)||item.length===0){
                continue;
            }
            if(item.length===1){
                var val=item[0]
                if(typeof val ==='object'){
                    message[key]=formatMessage(val)
                }else{
                    //message[key]=(val||'').trim()
                    message[key]=(val||'')
                }
            }else{
                message[key]=[]
                for (var j=0,k=item.length;j<k;j++){
                    message[key].push(formatMessage(item[j]))
                }
            }
        }
    }
    return message;
}

exports.formatXMLMessage=formatMessage;

exports.tplXML=function(content,message){
    var info = {};
    var type = 'text';
    var fromUserName = message.FromUserName;
    var toUserName = message.ToUserName;

    if (Array.isArray(content)) {
        type = 'news';
    }
    type = content.type || type;
    info.content = content;
    info.msgType = type;
    info.createTime = (new Date().getTime())
    info.fromUserName = toUserName;
    info.toUserName = fromUserName;
    return tpl.compiled(info);

}
