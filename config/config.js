
var util=require("../libs/util");
var path=require('path');
var wechat_file=path.join(__dirname,'./wechat.txt');
module.exports={
	"wechat":{
		"appID":"wx63e04fe98fc74772",
		"appsecret":"8241a22c4bbca8fcc2863bb2b000930d",
		"token":"guangxinxiliujianjun",
		 getAccessToken:function(){
				return util.readFileAsync(wechat_file);
		},
		saveAccessToken:function(data){
			data=JSON.stringify(data);
			return util.writeFileAsync(wechat_file,data);
		}
	},
	server:{
      port:9000
  	},
  	authToken:{
        redirect_url:'https://wechattest.wanchuangyou.com/cognate/bind',
		signIn_url:'https://wechattest.wanchuangyou.com/welfare/signIn',
		mall_url:'https://wechattest.wanchuangyou.com/mall/mallPage',
		active_url:'https://wechattest.wanchuangyou.com/active/activePage',
		miniGame_url:'https://wechattest.wanchuangyou.com/miniGame/miniGamePage',
		activePrefix_url:'https://wechattest.wanchuangyou.com/active/',
		upload_url:'https://wechattest.wanchuangyou.com/upload/uploadPage',
        state:'123',
        scope:'snsapi_userinfo'
    },
    visit_url:{
      code:'https://wechattest.wanchuangyou.com/cognate/code',
      page:'https://wechattest.wanchuangyou.com/welfare/page',
      mall:'https://wechattest.wanchuangyou.com/mall/pages',
      active:'https://wechattest.wanchuangyou.com/active/active',
      upload:'https://wechattest.wanchuangyou.com/upload/upload',
	  activePrefix:'https://wechattest.wanchuangyou.com/active/',
	  miniGame:'https://wechattest.wanchuangyou.com/miniGame/miniGame'
    },
	DBConfig:{
    fishdb:{
        "host":"localhost",
        "port":3306,
        "user":"admin111",
        "password":"12345",
        "database":"fishdb",
        "charset":"UTF8_GENERAL_CI",
        "connectNum":10,
        "idleTimeoutMillis":30000
    }
 	},	
	GameServerConfig:{
		"host": "10.168.162.3",
    	"port":3005,
    	"username": "monitor",
    	"password": "monitor"
	}
}
