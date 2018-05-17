var adminClient = require('pomelo-admin').adminClient;
var Stepify = require("stepify");
var RemoteRequest = function( cfg ){
    if( !cfg ) throw new Error("must have cfg");
	var config = cfg  ;
    this.REQUEST_TIME_OUT = 5000; // 超时时间
    this.REQUEST_TIMES_MAX = 3 ;
    this.RECONNECT_TIME_INTVERL = 3000;

    this.config = {
        username: config.username,
        password: config.password,
        md5: false
    };

    this.client = new adminClient( this.config);
    var self = this ;
    function Connect(){
        self.id = 'ghgw-' + Date.now();
        self.client.connect(self.id,config.host, config.port, function(err){
            if( err ){
                global.logger.warn( "RemoteRequest | " + err );
                return ;
            }
            global.logger.info( "RemoteRequest | Connect Success %j", config );
        });
    }
    Connect(); // 开始就进行连接

    //  启动定时器 重连
    this.ReConnect = function(){
        self.inst = setTimeout(function(){
            Connect();
        },this.RECONNECT_TIME_INTVERL);
    }
    var self = this ;
    this.client.on("error",function(err){
        global.logger.error( "RemoteRequest | Connect error,err:", err );
        self.ReConnect();
    });

    this.client.on("close",function(){
        global.logger.error( "RemoteRequest | Connect Close" );
        self.ReConnect();
    });
}


RemoteRequest.prototype.requestOnce = function(moduleId, msg, cb){
    var times = 0 ;
    var self = this ;
    var timeout = false ;
    var inst = setTimeout(function(){
        timeout = true ;
        cb("request time out");
    },this.REQUEST_TIME_OUT);

    self.client.request(moduleId, msg, function(err,result){
        clearTimeout( inst) ;
        if( timeout === true ){
            return ;
        }
        cb(err,result);
    });
}

RemoteRequest.prototype.request = function(moduleId, msg, cb){
    var beginTime = new Date().getTime();
    var i = 0 ;
    var self = this ;
    var workflow = Stepify()
        .step( "begin",function(){
            if( i >= self.REQUEST_TIMES_MAX ){
                cb(new Error("request time out"));
                return ;
            }
            this.done(null);
        })
        .step(function(){
            var selfStep = this ;
            self.requestOnce(moduleId, msg, function(err,res){
                if( err === "request time out" ){ // 超时的话重试3次
                    i ++ ;
                    selfStep.jump("begin");
                    return ;
                }
                cb(err,res);
            });
        })
        .run()
}

module.exports = function(cfg){
    var remoteRequest = new RemoteRequest(cfg);
    return remoteRequest ;
}
