var Wechat=require('../wechat/wechat');
module.exports=function(router,opts){
    var wechatApi=new Wechat(opts);
    //创建菜单
    router.post('/create',function(req,res){
        var menu=req.body.menu;
        wechatApi.createMenu(menu).then(function(data){
            console.log("创建菜单返回数据%j",data);
            res.json(data)
        });
    });
    //获取菜单
    router.post('/get',function(req,res){
        wechatApi.getMenu().then(function(data){
            console.log("获取菜单返回数据%j",data);
            res.json(data)
        });
    });
    //删除菜单
    router.post('/delete',function(req,res){
        wechatApi.deleteMenu().then(function(data){
            console.log("删除菜单返回数据%j",data);
            res.json(data);
            
        });
    });
    //获取当前菜单信息
    router.post('/current',function(req,res){
        wechatApi.getCurrentMenu().then(function(data){
            console.log("获取当前菜单返回数据%j",data);
            res.json(data);
        });
    });
    return router;
}