var Token =require('../../cognate/token')
var opts=require('../../../config/config').wechat
var authInfo=require('../../../config/config').authToken
var visitUrl=require('../../../config/config').visit_url
var request=require('request');
var Promise=require('promise')
var Moment=require('moment');

module.exports=function(router){
	var tokenApi=new Token(opts);
    router.get('/sevenDay',function(req,res){
        var url='https://open.weixin.qq.com/connect/oauth2/authorize?appid='+opts.appID+'&redirect_uri='+authInfo.activePrefix_url+'sevenDayPage'+'&response_type=code&scope='+authInfo.scope+'&state='+authInfo.state+'#wechat_redirect'
        res.redirect(url);
    })
    router.get('/sevenDayPage',function(req,res){
        var code =req.query.code;
        tokenApi.getAuthToken(code).then(function(data){
            var _data=data;
			  global.DBManager.wechatUserInfo.findOne({where:{openId:_data.openid}}).then(function(result){
                if(!result){
                    return Promise.resolve(false);
                }else{
                    return Promise.resolve(result);
                }
            }).then(function(dataInfo){
				var data1=dataInfo.dataValues;
				var nowtime=Moment().format("YYYY-MM-DD HH:mm:ss");
                if(data1.uid && data1.openId  && data1.info){
					Process(data1.uid,function(err,data){
						if(!err && data){
							res.render('active/sevenDay.html',{uid:data1.uid,awardArr:data});
						}else{
							res.render('noActive.html',{uid:data1.uid});
						}
					})
                }else{
					res.render('goBind.html',{url:visitUrl.code});
                }
            }).catch(function(err){
				console.log(err)
                res.status(404);
                res.render('404.html');
            })
        })
    })
	router.post('/getSevenDayAward',function(req,res){
		var data=req.body;
		processAward(data,function(err){
			if(err){
				res.json({errcode:'2001',errMsg:'database error,create failed'});
				return;
			}
			res.json({errcode:'0',errMsg:'OK'});
		})
	})
    return router
}
function Process(uid,cb){
	 global.DBManager.wechatSevenDay.findAll({attributes:['day','awardContent','awardDesc']}).then(function(result){
		if(result.length==0){
			cb(null,null);
		}
		var awardArr=[];
		for(var i=0;i<result.length;i++){
			var award=result[i].dataValues;
			award.awardContent=JSON.parse(award.awardContent);
			awardArr.push(award);
		}
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
			cb(null,awardArr);
		}).catch(function(err){
			console.log(err)
	        cb(err,null);
		})
	 }).catch(function(err){
		console.log(err)
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
		global.DBManager.wechatSevenDayRecord.create(saveData).then(function(results){
			cb(null)
		}).catch(function(err){
			cb(err)
		})
	}).catch(function(err){
		cb(err);
	})
}
