var Cookie = require('../lib/cookie');
var Util = require('./util');

var ua = navigator.userAgent;

var config = {

    demo: 2000, // demo时，价格刷新频率
    real: 500, // 实盘，价格刷新频率

    candle: {
        demo: 30 * 1000, // demo时，蜡烛图刷新频率
        real: 10 * 1000 // 实盘时，蜡烛图刷新频率
    },

    realPassword: 1000 * 60 * 60 * 24, // 单位 ms,  实盘过期时间

    orderShare: 3 * 60, // 单位 s, 分享订单匿名token的过期时间

    expiredTime: 30 * 1000, // 价格30s过期

    newsUpdateTime: 1000 * 30, // 新闻刷新时间

    calendarUpdateTime: 1000 * 60 * 2, // 经纪日历刷新时间,

    actualOrderBaseTime: 1000 * 60, // 实时订单显示为刚刚的间隔时间

    actualOrderUpdateTime: 1000 * 15, // 实时订单刷新时间

    // ajax请求前缀

    // 正式环境
    ajaxPrefix:  getAjaxPrefix(),

    // 测试环境
    // ajaxPrefix: 'http://210.72.229.191:8100',

    // 邀请链接
    invitePrefix: getInvitePrefix(),

    // 是否为Android客户端
    isAndroidAPK: false,

    // 是否为Android手机
    isAndroid: ua.match(/(Android);?[\s\/]+([\d.]+)?/), //true,

    // Android分享前缀
    androidSharePrefix: getAndroidSharePrefix(),

    appid: 'wxf587c0d17e265b55',

    //滑动验证nc_appkey
    nc_appkey: 'FFFF00000000016863B4',

    // 版本信息
    version: '2.0.1',

    tradeTime: {
      STOCK_US: 'PM22:30-AM5:00',
      FOREX: 'PM22:30-AM5:00',
      OIL: 'PM22:30-AM5:00',
      METAL_GOLD: 'PM22:30-AM5:00',
      METAL_SILVER: 'PM22:30-AM5:00',
      STOCK_INDEX: 'PM22:30-AM5:00',
      'AA.NYSE': 'PM22:30-AM5:00'  // 特殊品种
    }

};

module.exports = {
    getOrderShareAnonymousTokenExpireTime: function() {
        return config.orderShare;
    },

    getInterval: function() {
        if (Cookie.get('type') === 'demo') {
            return config.demo;
        }

        return config.real;
    },

    getCandleExpireTime: function() {
        if (Cookie.get('type') === 'demo') {
            return config.candle.demo;
        }

        return config.candle.real;
    },

    getRealPasswordExpireTime: function() {
        return config.realPassword;
    },

    getAjaxPrefix: function() {
        // return config.ajaxPrefix;
        // 这样就不需要总是在提交的时候来回改了。
        // var dev = 'http://45.121.52.91:8100';
        var dev = 'http://api-normal.thetradestar.com';
        var prod = getAjaxPrefix();
        
        // if (window.location.href.startsWith("file:///E:/"))
        //     return dev;
        if (window.location.hostname == 'waibao.invhero.com')
            return dev;
        if (window.location.hostname == '45.121.52.91.191')
            return dev;
        if (window.location.hostname == 'localhost')
            return dev;
        if (window.location.hostname == '127.0.0.1')
            return dev;
        if (window.location.hostname.startsWith("test."))
            return dev;
        return prod;
    },

    getInvitePrefix: function() {
        return config.invitePrefix;
    },

    isAndroid: function() {
        return config.isAndroid;
    },

    isAndroidAPK: function() {
        return config.isAndroidAPK;
    },

    getAppid: function() {
        return config.appid;
    },

    getAndroidSharePrefix: function() {
        return config.androidSharePrefix;
    },

    getAvatarPrefix: function(src) {
        if (src.indexOf('http') == 0) {
          return src;
        } 
        else if (Util.isDaily()) {
            return this.getAjaxPrefix() + src;
        } else {
            if (this.isAndroidAPK()) {
                return getAvatarUrl() + src.slice(8);
            } else {
                return getAvatarUrl() + src.slice(8);
            }
        }
    },

    getToken: function() {
      if (Util.isDaily()) {
        return 'token4';
      } else {
        return '56aae22e-6572-4bf1-a6ee-4c8e62ff1bb6';
      }
    },

    getTradeTime: function(symbol, category) {
      if (config.tradeTime[symbol]) {
        return config.tradeTime[symbol];
      } else {
        return config.tradeTime[category];
      }

    },

    getExpiredTime: function() {
      return config.expiredTime;
    },

    getNewsUpdateTime: function() {
        return config.newsUpdateTime;
    },

    getCalendarUpdateTime() {
        return config.calendarUpdateTime;
    },

    getActualOrderBaseTime() {
        return config.actualOrderBaseTime;
    },

    getActualOrderUpdateTime() {
        return config.actualOrderUpdateTime;
    },

    getAliyunAppkey: function() {
      return config.nc_appkey;
    },

    getAppVersion() {
        return config.version;
    }
};
