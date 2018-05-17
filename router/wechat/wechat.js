'use strict';
//引用模块
var Promise=require('bluebird');
var request=Promise.promisify(require('request'));
var util=require('./util');
var fs=require('fs');
var _=require('lodash');
var exec=require('child_process').exec;
var prefix="https://api.weixin.qq.com/cgi-bin/";
var mpPrefix="https://mp.weixin.qq.com/cgi-bin/";
var semanticUrl="https://api.weixin.qq.com/semantic/semproxy/search?";
var api={
	access_token:prefix+'token?grant_type=client_credential',
	temporary:{
		upload:prefix+'media/upload?',
		fetch:prefix+'media/get?'
	},
	permanent:{
		upload:prefix+'material/add_material?',
		fetch:prefix+'material/get_material?',
		uploadNews:prefix+'material/add_news?',
		uploadNewsPic:prefix+'material/uploadimg?',
		del:prefix+'material/del_material?',
		update:prefix+'material/update_news?',
		count:prefix+'material/get_materialcount?',
		batch:prefix+'material/batchget_material?'
	},
	tag:{
		create:prefix+'tags/create?',
		fetch:prefix+'tags/get?',
		update:prefix+'tags/update?',
		del:prefix+'tags/delete?',
		getTagUsers:prefix+'user/tag/get?',
		batchtagging:prefix+'tags/members/batchtagging?',
		batchuntagging:prefix+'tags/members/batchuntagging?',
		getList:prefix+'tags/getidlist?',
	},
	user:{
		remark:prefix+'user/info/updateremark?',
		fetch:prefix+'user/info?',
		batchFetch:prefix+'user/info/batchget?',
		list:prefix+'user/get?'
	},
	mass:{
		group:prefix+'message/mass/sendall?',
		openId:prefix+'message/mass/send?',
		del:prefix+'message/mass/delete?',
		preview:prefix+'message/mass/preview?',
		check:prefix+'message/mass/get?',
	},
	menu:{
		create:prefix+'menu/create?',
		get:prefix+'menu/get?',
		del:prefix+'menu/get?',
		current:prefix+'get_current_selfmenu_info?'
	},
	qrcode:{
		create:prefix+'qrcode/create?',
		show:mpPrefix+'showqrcode?'
	},
	shortUrl:{
		create:prefix+'shorturl?'
	},
	ticket:{
		get:prefix+'ticket/getticket?'
	}
}
 
function Wechat(opts){
	this.appID=opts.appID;
	this.token = opts.token;
	this.appsecret=opts.appsecret;
	this.getAccessToken=opts.getAccessToken;
	this.saveAccessToken=opts.saveAccessToken;
	this.fetchAccessToken();

}
Wechat.prototype.fetchAccessToken=function(){
	var that=this
	if(this.access_token && this.expires_in) {
		if(this.isValidAccessToken(this)){
			return Promise.resolve(this);
		}
	}
	return this.getAccessToken().then(function(data){
		try{
			data=JSON.parse(data);
		}catch(e){
			return that.updateAccessToken();
		}
		if(that.isValidAccessToken(data)){
			return Promise.resolve(data);
		}else{
			return that.updateAccessToken();
		}
	})
	.then(function(data){
		that.access_token=data.access_token;
		that.expires_in=data.expires_in;
		that.saveAccessToken(data);
		return Promise.resolve(data);
	})
}
Wechat.prototype.isValidAccessToken=function(data){
	if(!data || !data.access_token || !data.expires_in){
		return false
	}
	var access_token=data.access_token;
	var expires_in=data.expires_in;
	var now=(new Date().getTime());
	if(now < expires_in){
		return true;
	}else{
		return false;
	}
}
Wechat.prototype.updateAccessToken=function(){
	var appID=this.appID;
	var appsecret=this.appsecret;
	var url=api.access_token+'&appid='+appID+'&secret='+appsecret;
	return new Promise(function(resolve,reject){
			request({url:url,json:true},function(error,response,body){
				if(error){
					reject(error);
					return;
				}
				if(typeof response == 'undefined'){
					reject("请求超时");
					return;
				}
				var data=body;
				if(data.errcode){
					reject(data);
					return;
				}
				
				var now=(new Date().getTime());
				var expires_in=now+(data.expires_in-20)*1000;
				data.expires_in=expires_in;
				resolve(data);
			})
	})
}



Wechat.prototype.uploadMaterial=function(type,material,permanent){
	var that=this;
	var form={};
	var uploadUrl=api.temporary.upload
	if(permanent){
		uploadUrl=api.permanent.upload
		_.extend(form,permanent);
	}
	if(type==='pic'){
		uploadUrl=api.permanent.uploadNewsPic
	}
	if(type==='news'){
		uploadUrl=api.permanent.uploadNews;
		form=material;
	}else{
		form.media=fs.createReadStream(material);
	}
	
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=uploadUrl+'&access_token='+data.access_token;
				var options={method:"POST",url:url,json:true};
				if(!permanent){
					url+='&type='+type
				}else{
					form.access_token=data.access_token
				}
				
				if(type=='news'){
					options.body=form
				}else{
					options.formData=form;
				}
				request(options,function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("Upload material fails");
                    }		
				})	
		})
	})
}
Wechat.prototype.fetchMaterial=function(mediaId,material,permanent){
	var that=this;
	var form={};
	var fetchUrl=api.temporary.fetch;
	if(permanent){
		fetchUrl=api.permanent.fetch;
	}
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=fetchUrl+'&access_token='+data.access_token;
				var options={method:"GET",url:url,body:form,json:true};
				if(permanent){
					form.media_id=mediaId;
					form.access_token=data.access_token;
					options.body=form;
				}else{
					if(type==='video'){
						url=url.replace('https://','http://');
					}
					url+='&media_id='+mediaId
				}

				if(type=='news'||type=='video'){
					request(options,function(error,response,body){
						if(error){
							reject(error);
						}
						var _data=body;
						if(_data){
							resolve(_data)
						}else{
							reject("get count of  material fails");
						}				
				  })
				}else{
					resolve(url);
				}
			})
	})
}
Wechat.prototype.deleteMaterial=function(mediaId){
	var that=this;
	var form={
		media_id:mediaId
	};
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.permanent.del+'&access_token='+data.access_token+'&media_id='+mediaId;
				request({method:"POST",url:url,body:form,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("delete material fails");
                    }				
				})
			})
	})
}
Wechat.prototype.updateMaterial=function(mediaId,news){
	var that=this
	var form={
		media_id:mediaId
	};
	_.extend(form,news);
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.permanent.update+'&access_token='+data.access_token+'&media_id='+mediaId;
				request({method:"POST",url:url,body:form,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("update material fails");
                    }				
				})
			})
	})
}
Wechat.prototype.countMaterial=function(){
	var that=this
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.permanent.count+'&access_token='+data.access_token;
				request({method:"GET",url:url,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("get count of  material fails");
                    }				
				})
			})
	})
}
Wechat.prototype.batchMaterial=function(options){
	var that=this
	options.type=options.type||'image';
	options.offset=options.offset||0;
	options.count=options.count||10;


	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.permanent.batch+'&access_token='+data.access_token;
				request({method:"POST",url:url,body:options,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("get count of  material fails");
                    }				
				})
			})
	})
}



Wechat.prototype.createTag=function(name){
	var that=this
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.tag.create+'&access_token='+data.access_token;
				var options={
					tag:{
						name:name
					}
				}
				request({method:"POST",url:url,body:options,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("create tag fails");
                    }				
				})
			})
	})
}
Wechat.prototype.fetchTag=function(){
	var that=this
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.tag.fetch+'&access_token='+data.access_token;
				request({method:"GET",url:url,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("get group fails");
                    }				
				})
			})
	})
}

Wechat.prototype.updateTag=function(id,name){
	var that=this
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.tag.update+'&access_token='+data.access_token;
				var options={
					tag:{
						id:id,
						name:name
					}
				}
				request({method:"POST",url:url,body:options,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("update group fails");
                    }				
				})
			})
	})
}

Wechat.prototype.deleteTag=function(id){
	var that=this
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.tag.del+'&access_token='+data.access_token;;
				var options={
					tag:{
						id:id
					}
				};
				request({method:"POST",url:url,body:options,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("delete group fails");
                    }				
				})
			})
	})
}

Wechat.prototype.getTagusers=function(tagid,next_openid){
	var that=this
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.tag.getTagUsers+'&access_token='+data.access_token;;
				var options={
					tagid:tagid,
					next_openid:next_openid||""
				};
				request({method:"POST",url:url,body:options,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("delete group fails");
                    }				
				})
			})
	})
}

Wechat.prototype.batchTag=function(openid_list,tagid){
	var that=this
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.tag.batchtagging+'&access_token='+data.access_token;;
				var options={
					tagid:tagid,
					openid_list:openid_list
				};
				request({method:"POST",url:url,body:options,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("delete group fails");
                    }				
				})
			})
	})
}
Wechat.prototype.getTagList=function(openid){
	var that=this
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.tag.getList+'&access_token='+data.access_token;;
				var options={
					openid:openid
				};
				request({method:"POST",url:url,body:options,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("delete group fails");
                    }				
				})
			})
	})
}
Wechat.prototype.batchUnTag=function(openid_list,tagid){
	var that=this
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.tag.batchuntagging+'&access_token='+data.access_token;;
				var options={
					tagid:tagid,
					openid_list:openid_list
				};
				request({method:"POST",url:url,body:options,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("delete group fails");
                    }				
				})
			})
	})
}

Wechat.prototype.remarkUser=function(openId,remark){
	var that=this
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.user.remark+'&access_token='+data.access_token;;
				var options={
					openid:openId,
					remark:remark
				};
				request({method:"POST",url:url,body:options,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("Remark user fails");
                    }				
				})
			})
	})
}

Wechat.prototype.fetchUser=function(openIds,lang){
	var that=this
	lang=lang||"zh_CN";
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url;
				var options={json:true};
				if(_.isArray(openIds)){
					url=api.user.batchFetch+'&access_token='+data.access_token;
					options.method="POST";
					options.url=url;
					options.body={
						user_list:openIds
					};
				}else{
					url=api.user.fetch+'&access_token='+data.access_token;
					url+="&openid="+openIds+"&lang="+lang
					options.method="GET";
					options.url=url;
				}
				
				request(options,function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("get userInfo fails");
                    }				
				})
			})
	})
}
Wechat.prototype.listUsers=function(openId){
	var that=this
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.user.list+'&access_token='+data.access_token;
				if(openId){
					url+='&next_openid='+openId
				}
				request({method:"GET",url:url,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("list user fails");
                    }				
				})
			})
	})
}

Wechat.prototype.sendByTag=function(type,message,tagId){
	var that=this
	var msg={
		filter:{},
		msgtype:type
	};
	msg[type]=message;
	if(!tagId){
		msg.filter.is_to_all=true;
	}else{
		msg.filter.is_to_all=false;
		msg.filter.tag_id=tagId;
	}
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.mass.group+'&access_token='+data.access_token;
				request({method:"POST",url:url,body:msg,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("send to tag fails");
                    }				
				})
			})
	})
}
Wechat.prototype.sendByOpenId=function(type,message,openIds){
	var that=this
	var msg={
		touser:openIds,
		msgtype:type
	};
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.mass.openId+'&access_token='+data.access_token;
				request({method:"POST",url:url,body:msg,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("send by openId fails");
                    }				
				})
			})
	})
}
Wechat.prototype.deleteMass=function(messageId){
	var that=this
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.mass.del+'&access_token='+data.access_token;
				var msg={
					msg_id:messageId,
				};
				request({method:"POST",url:url,body:msg,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("send by openId fails");
                    }				
				})
			})
	})
}
Wechat.prototype.previewMass=function(type,message,openIds){
	var that=this
	var msg={
		touser:openId,
		msgtype:type
	};
	msg[type]=message;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.mass.preview+'&access_token='+data.access_token;
				request({method:"POST",url:url,body:msg,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("preview mass fails");
                    }				
				})
			})
	})
}
Wechat.prototype.checkMass=function(messageId){
	var that=this
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.mass.check+'&access_token='+data.access_token;
				var msg={
					msg_id:messageId,
				};
				request({method:"POST",url:url,body:msg,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("check mass fails");
                    }				
				})
			})
	})
}


Wechat.prototype.createMenu=function(menuJsonData){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.menu.create+'&access_token='+data.access_token;
				request({method:'POST',url:url,body:menuJsonData,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("create menu fails");
                    }					
				})
			})
	})
}
Wechat.prototype.getMenu=function(){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.menu.get+'&access_token='+data.access_token;
				request({method:'GET',url:url,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("Get menu fails");
                    }					
				})
			})
	})
}
Wechat.prototype.deleteMenu=function(){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.menu.get+'&access_token='+data.access_token;
				request({method:'GET',url:url,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("Delete menu fails");
                    }					
				})
			})
	})
}

Wechat.prototype.getCurrentMenu=function(){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.menu.current+'&access_token='+data.access_token;
				request({method:'GET',url:url,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("Get menu fails");
                    }					
				})
			})
	})
}

Wechat.prototype.createQrcode=function(qr){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.qrcode.create+'&access_token='+data.access_token;
				request({method:'POST',url:url,body:qr,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("create qrcode fails");
                    }					
				})
			})
	})
}
Wechat.prototype.showQrcode=function(ticket){
	return api.qrcode.mpPrefix+'ticket='+encodeURI(ticket);
}

Wechat.prototype.createShortUrl=function(action,url){
	var that=this;
	action=action||'long2short';
	var form={
		action:action,
		long_url:url
	}
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.shortUrl.create+'&access_token='+data.access_token;
				request({method:'POST',url:url,body:form,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("create qrcode fails");
                    }					
				})
			})
	})
}
Wechat.prototype.semantic=function(semanticData){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=semanticUrl+'&access_token='+data.access_token;
				semanticData.appid=data.appID;
				request({method:'POST',url:url,body:semanticData,json:true},function(error,response,body){
					if(error){
						reject(error);
					}
					var _data=body;
					if(_data){
                        resolve(_data)
                    }else{
                        reject("Sematic fails");
                    }					
				})
			})
	})
}
Wechat.prototype.reply=function(content,message){
 return new Promise(function(resolve, reject) {
        var xml = util.tplXML(content, message)
        resolve(xml);
    })
}

module.exports=Wechat;
