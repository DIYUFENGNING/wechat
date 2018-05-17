var Wechat=require('../wechat/wechat');
module.exports=function(router,opts){
    var wechatApi=new Wechat(opts);
    //更新user tag
    router.post('/remark',function(req,res){
        var openId=req.body.openId;
        var remark=req.body.remark;
        wechatApi.remarkUser(openId,remark).then(function(data){
            console.log("创建菜单返回数据%j",data);
            res.json(data)
        });
    });
    //获取user info
    router.post('/get',function(req,res){
        var openIds=req.body.openIds;
        var lang=req.body.lang;
        wechatApi.fetchUser(openIds,lang).then(function(data){
            console.log("获取菜单返回数据%j",data);
            res.json(data)
        });
    });
    
    //获取user 列表
    router.post('/list',function(req,res){
        var openId=req.body.openId;
        wechatApi.listUsers(openId).then(function(data){
            console.log("获取当前菜单返回数据%j",data);
            res.json(data);
        });
    });
    return router;
}