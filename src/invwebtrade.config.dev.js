var config = {

  demo: 2000, // demo时，价格刷新频率
  real: 500, // 实盘，价格刷新频率

  candle: {
    demo: 30 * 1000, // demo时，蜡烛图刷新频率
    real: 10 * 1000 // 实盘时，蜡烛图刷新频率
  },

  realPassword: 60 * 60, // 单位 s,  实盘过期时间

  orderShare: 3 * 60, // 单位 s, 分享订单匿名token的过期时间


  // ajax请求前缀

  // 正式环境
  // ajaxPrefix:  'https://api.invhero.com',

  // 测试环境
  ajaxPrefix: 'http://210.72.229.191:8100',

};

window.$Global = {
  getOrderShareAnonymousTokenExpireTime: function() {
    return config.orderShare;
  },

  getInterval: function() {
    // if (Cookie.get('type') === 'demo') {
    //   return config.demo;
    // }

    // return config.real;
  },

  getCandleExpireTime: function() {
    // if (Cookie.get('type') === 'demo') {
 //   return config.candle.demo;
 // }

 // return config.candle.real;
  },

  getRealPasswordExpireTime: function() {
    return config.realPassword;
  },

  getAjaxPrefix: function() {
    return config.ajaxPrefix;
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

  getLever: function() {
    return config.lever;
  },

  getProfitIndex: function() {
    return config.profitIndex;
  },

  getFreeMargin: function() {
    return config.freeMargin;
  },

  getBroadcastConfig: function(type) {
    return config.broadcast[type];
  }
};