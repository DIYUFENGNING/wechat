/**
 * Created by Administrator on 2015/7/14.
 */
var adminClient = require('pomelo-admin').adminClient;
var config = {
	//"host": "121.42.214.167",
	"host":"192.168.1.45",
	"port": 3005,
	"username": "monitor",
	"password": "monitor"
}

var client  = new adminClient({
    username: config.username,
    password: config.password,
    md5: false
});

var id = 'pomelo_cli_' + Date.now();
console.log(client);

client.connect(id, config.host, config.port, function(err){
    if(err) {
        console.error('fail to connect to admin console server:');
        console.error(err);
        alert(err);
    } else {
        console.info('admin console connected.');
    }
/*
    client.request('onlineUser', {type: "onlineUser"}, function (err, msg) {
        if (err) {
            console.error('fail to request online user:');
            console.error(err);
            return;
        }

        console.log( msg );
    });
*/	
	var Mail = function(){
		this.receiver = ['*'];  // 接受者列表
		this.mailTopic = "just test"; // 邮件主题
		this.mailContent = "just test";// 邮件内容
		this.mailSendTime = new Date();
		this.mailAvailDays = 1;
		this.Attachments = {}; // 邮件附件
	}
	
	var mail = new Mail();
	console.log(mail);
	client.request("sendMail", mail, function( err,msg){
		if( err ){
			console.error('fail to request sendMail:');
			console.error(err );
			return ;
		}

		//if( msg.code )
		console.error('request sendMail result:');	
		console.log(msg);
	});
});



