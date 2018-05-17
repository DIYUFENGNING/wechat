var Wechat=require('../wechat/wechat');
module.exports=function(router,opts){
    var wechatApi=new Wechat(opts);
    //上传素材，包括临时还是永久
    router.post('/upload',function(req,res){
        var type=req.body.type;
        var material=req.body.material;
        var permanent=req.body.permanent;
        wechatApi.uploadMaterial(type,material,permanent).then(function(data){
            res.json(data);
        });
    });
    //获取素材，包括临时还是永久
    router.post('/get',function(req,res){
        var mediaId=req.body.mediaId;
        var permanent=req.body.permanent;
        wechatApi.fetchMaterial(mediaId,permanent).then(function(data){
            res.json(data);
        });
    });
    //删除素材
    router.post('/delete',function(req,res){
        var mediaId=req.body.mediaId;
        wechatApi.deleteMaterial(mediaId).then(function(data){
            res.json(data);
        });
    });
    //更新素材
    router.post('/update',function(req,res){
        var mediaId=req.body.mediaId;
        var news=req.body.news;
        wechatApi.updateMaterial(mediaId,news).then(function(data){
            res.json(data);
        });
    });
    //获得蔬菜数量
    router.post('/count',function(req,res){
        wechatApi.countMaterial().then(function(data){
            res.json(data);
        });
    });
    //绑定素材
    router.post('/batch',function(req,res){
        var options=req.body.options;
        wechatApi.batchMaterial(options).then(function(data){
            res.json(data);
        });
    });
    return router;
}