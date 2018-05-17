var Sequelize=require('sequelize');
module.exports = function (config) {
        var seqFishDB = new Sequelize(config.fishdb.database, config.fishdb.user, config.fishdb.password, {
        host: config.fishdb.host,
        port: config.fishdb.port,
        dialect: 'mysql',
        pool: {
            max: config.fishdb.connectNum,
            min: 0,
            idle: config.fishdb.idleTimeoutMillis
        },
        timezone: '+08:00',
        logging: global.logger.debug
    });

    var table={
        wechatUserInfo:seqFishDB.define('wechatUserInfo',{
			id: {
                type: Sequelize.INTEGER, primaryKey: true,autoIncrement:true
            },
            openId:{
                type: Sequelize.STRING
            },
            uid:{
                type:Sequelize.STRING
            },
            info:{
                type:Sequelize.TEXT
            },
			checkCode:{
                type:Sequelize.STRING(8)
            }
        },{
            freezeTableName: true,
            timestamps: false
        }),
		wechatSignInAward:seqFishDB.define('wechatSignInAward',{
			id: {
                type: Sequelize.INTEGER, primaryKey: true,autoIncrement:true
            },
			itemId:{
				type:Sequelize.STRING(8)
			},
			itemName:{
				type:Sequelize.STRING(255)
			},
			itemNum:{
				type:Sequelize.INTEGER
			},
			itemImg:{
				type:Sequelize.STRING(255)
			}
		},{
            freezeTableName: true,
            timestamps: false
        }),
		wechatSignInAwardRecord:seqFishDB.define('wechatSignInAwardRecord',{
			id: {
                type: Sequelize.INTEGER, primaryKey: true,autoIncrement:true
            },
			uid:{
				type:Sequelize.STRING(255)
			},
			openId:{
				type:Sequelize.STRING(255)
			},
			 itemId:{
                type:Sequelize.STRING(8)
            },
            itemName:{
                type:Sequelize.STRING(255)
            },
            itemNum:{
                type:Sequelize.INTEGER
            },
			getTime:{
				type:Sequelize.STRING(255)
			}
		},{
            freezeTableName: true,
            timestamps: false
        }),
		wechatMall:seqFishDB.define('wechatMall',{
			id: {
                type: Sequelize.INTEGER, primaryKey: true,autoIncrement:true
            },
			goodsId:{
				type:Sequelize.STRING(20)
			},
            itemId:{
                type:Sequelize.STRING(8)
            },
            itemName:{
                type:Sequelize.STRING(255)
            },
            itemNum:{
                type:Sequelize.INTEGER
            },
			itemImg:{
                type:Sequelize.STRING(255)
            },
			itemPrice:{
				type:Sequelize.INTEGER
			},
			isDisplay:{
				type:Sequelize.BOOLEAN
			}
		},{
            freezeTableName: true,
            timestamps: false
      	}),
	  	wechatActive:seqFishDB.define('wechatActive',{
		 	id: {
                type: Sequelize.INTEGER, primaryKey: true,autoIncrement:true
            },
			activeName:{
				type:Sequelize.STRING(255)
			},
			englishName:{
				type:Sequelize.STRING(255)
			},
			activeDesc:{
				type:Sequelize.TEXT
			},
			activeIcon:{
				type:Sequelize.STRING(255)
			},
			isOpen:{
				type:Sequelize.BOOLEAN
			},
			startTime:{
				type:Sequelize.DATE
			},
			stopTime:{
				type:Sequelize.DATE
			}
	  	},{
            freezeTableName: true,
            timestamps: false
      	}),
		wechatSevenDay:seqFishDB.define("wechatSevenDay",{
			 id: {
                type: Sequelize.INTEGER, primaryKey: true,autoIncrement:true
            },
			day:{
				type:Sequelize.INTEGER(2)
			},
			awardContent:{
				type:Sequelize.TEXT
			},
			awardDesc:{
				type:Sequelize.STRING(255)
			}
		},{
            freezeTableName: true,
            timestamps: false
        }),
		wechatSevenDayRecord:seqFishDB.define("wechatSevenDayRecord",{
			 id: {
                type: Sequelize.INTEGER, primaryKey: true,autoIncrement:true
            },
			uid:{
				type:Sequelize.STRING(255)
			},
            day:{
                type:Sequelize.INTEGER(2)
            },
            awardContent:{
                type:Sequelize.TEXT
            },
			getTime:{
				type:Sequelize.STRING(255)
			}
		},{
            freezeTableName: true,
            timestamps: false
        }),
		wechatMiniGame:seqFishDB.define('wechatMiniGame',{
            id: {
                type: Sequelize.INTEGER, primaryKey: true,autoIncrement:true
            },
            miniGameName:{
                type:Sequelize.STRING(255)
            },
            englishName:{
                type:Sequelize.STRING(255)
            },
            miniGameUrl:{
                type:Sequelize.STRING(255)
            },
            miniGameDesc:{
                type:Sequelize.TEXT
            },
            miniGameIcon:{
                type:Sequelize.STRING(255)
            },
            isOpen:{
                type:Sequelize.BOOLEAN
            },
            startTime:{
                type:Sequelize.DATE
            },
            stopTime:{
                type:Sequelize.DATE
            }
        },{
            freezeTableName: true,
            timestamps: false
        }),
		wechatUserBug:seqFishDB.define('wechatUserBug',{
            id: {
                type: Sequelize.INTEGER, primaryKey: true,autoIncrement:true
            },
            file:{
                type:Sequelize.STRING(1024)
            },
            uid:{
                type:Sequelize.STRING(255)
            },
            Msg:{
                type:Sequelize.STRING(255)
            },
            phoneNumber:{
                type:Sequelize.STRING(255)
            }
        },{
            freezeTableName: true,
            timestamps: false
        })
    }
     for (var key in table) {
        table[key].sync();
    }
    table.seqFishDB = seqFishDB;
    return table;
}
