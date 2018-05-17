var Wechat=require('../wechat/wechat');
module.exports=function(router,opts){
    var wechatApi=new Wechat(opts);
    //创建Tag
    router.post('/create',function(req,res){
        var tagName=req.body.tagName;
        wechatApi.createTag(tagName).then(function(data){
            res.json(data)
        })
    });
    //获取已建Tag
    router.post('/get',function(req,res){
        wechatApi.fetchTag().then(function(data){
            res.json(data);
        })
    });
    //更新Tag
    router.post('/update',function(req,res){
        var id=req.body.tagid;
        var name=req.body.tagName;
        wechatApi.updateTag(id,name).then(function(data){
            res.json(data);
        })
    });
    //删除
    router.post('/del',function(req,res){
        var id=req.body.tagid;
        wechatApi.deleteTag(id).then(function(data){
            res.json(data);
        })
    });
    //货补不同标签的用户
    router.post('/getTagUsers',function(req,res){
        var tagid=req.body.tagid;
        var next_openid=req.body.next_openid;
        wechatApi.getTagusers(tagid,next_openid).then(function(data){
            res.json(data);
        })
    });
    //给用户打标签
    router.post('/batchtagging',function(req,res){
        var openid_list=req.body.openid_list;
        var tagid=req.body.tagid;
        wechatApi.batchTag(openid_list,tagid).then(function(data){
            res.json(data);
        })
    });
    //给用户标签去掉
    router.post('/batchuntagging',function(req,res){
        var openid_list=req.body.openid_list;
        var tagid=req.body.tagid;
        wechatApi.batchUnTag(openid_list,tagid).then(function(data){
            res.json(data);
        })
    });
    //获取当前用户的Tag
    router.post('/getList',function(req,res){
        var openid=req.body.openid;
        wechatApi.getTagList(openid).then(function(data){
            res.json(data);
        })
    });
    return router;
}