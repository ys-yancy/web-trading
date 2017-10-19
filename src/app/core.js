"use strict";

var Base = require('./base');
var Cookie = require('../lib/cookie');
var login = require('./login');
var Util = require('./util');
var Symbol = require('./symbol');
var Config = require('./config');
var stomp = require('./stomp');


// var login = new Login();
window.Cookie = Cookie;
var listenLogin = false;

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
// 例子： 
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.Format = function(fmt) { //author: meizz 
  var o = {
    "M+": this.getMonth() + 1, //月份 
    "d+": this.getDate(), //日 
    "h+": this.getHours(), //小时 
    "m+": this.getMinutes(), //分 
    "s+": this.getSeconds(), //秒 
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
    "S": this.getMilliseconds() //毫秒 
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

function PageBase() {
  PageBase.superclass.constructor.apply(this, arguments);
  this._preBind();
}

Base.extend(PageBase, Base, {

  getSymbols: function(symbols) {
    return Symbol.get(symbols);
  },

  getIntervalTime: function() {
    return Config.getInterval();
  },

  getCandleExpireTime: function() {
    return Config.getCandleExpireTime();
  },

  _preBind: function() {
    var doc = $(document);

    doc.on('click', '.J_VerifyLogin', $.proxy(this._verifyLogin, this));
    doc.on('tap', '.dialog-btn', function(e) {
      var curEl = $(e.currentTarget);
      curEl.addClass('active');
    });
  },

  _verifyLogin: function(e) {
    e.preventDefault();
    var url = $(e.currentTarget).attr('href');
    this.login().then(function() {
      location.href = url;
    });
  },


  isDemo: function() {
    return Cookie.get('type') === 'demo' || !Cookie.get('type');
  },

  goReal: function() {
    return !!Cookie.get('goType');
  },

  getLogin: function() {
    return login;
  },

  getOption: function(symbols) {
    var self = this,

      url = getUrl(),
      token = Cookie.get('token'),
      data = {
        access_token: token
      };

    if (Array.isArray(symbols)) {
      data.symbols = symbols.join(',');
    }

    return new Promise((resolve, reject) => {

      this.ajax({
        url: url,
        data: data
      }).then(function(data) {

        resolve(data.data);
      });
    });

    function getUrl() {
      // 实盘  actual quotation
      var demo = self.isDemo();

      var url = demo ? '/v3/demo/symbols4' : '/v3/real/symbols4';
      return url;
    }
  },

  login: function() {
    return login.login();
  },

  // getToken: function() {
  //   var self = this,
  //     deferred = new $.Deferred();

  //   var token = Cookie.get('token');

  //   if (token) {
  //     deferred.resolve(token);
  //   } else {
  //     login.registerAnonymous().then(function(token) {
  //       deferred.resolve(token);
  //     });
  //   }

  //   return deferred.promise();
  // },

  // getRealToken: function(showCancel) {
  //   var self = this,
  //     deferred = new $.Deferred();
  //   var realToken = Cookie.get('real_token');

  //   if (realToken) {
  //     deferred.resolve(realToken, true);
  //   } else {
  //     login.login().then(function() {
  //       self.getAccount().then(function(data) {
  //         var realAccount = data.account.real;
  //         if (!listenLogin) {
  //           login.on('get:realToken', function(realToken) {
  //             self.broadcast('get:realToken');
  //             deferred.resolve(realToken);
  //           });
  //           login.on('reject:realToken', function() {
  //             deferred.reject();
  //             self.broadcast('reject:realToken');
  //           });
  //           listenLogin = true;
  //         }

  //         if (!realAccount.trade_password) {
  //           login.showSetup();
  //         } else if (login.isExpire() || login.isFirst()) {
  //           login.showTrade(showCancel);
  //         }
  //       });
  //     }, function() {
  //       deferred.reject();
  //     });
  //   }

  //   return deferred.promise();
  // },

  // 获取当前价格
  getCurrentPrice: function(symbols, returnObj) {
    var self = this,
      type = this.isDemo() ? 'demo' : 'real',
      str,
      typeVal = typeof symbols;

    return new Promise((resolve, reject) => {
      if (!Array.isArray(symbols)) {
        symbols = [symbols];
      }

      var prices = this.getPrice(symbols);

      if (prices) {

        if (typeVal === 'string') {
          if (returnObj) {
            var obj = prices[0] || {};
            obj.price = _getPrice(obj);
            resolve(obj);
            return;
          } else {
            var item = prices[0];

            resolve(_getPrice(item));

            return;
          }

        } else {

          if (returnObj) {
            resolve(prices);
            return;
          }

          var list = {};
          $.each(prices, function(index, item) {
            var symbol = item.symbol;
            var price = _getPrice(item);
            list[symbol] = price;
          });

          resolve(list);

          return;
        }
      }

      var allIn = true;
      var symbolValues = [];

      symbols.forEach((symbol) => {
        var symbolValue = Symbol.isClose(symbol);
        if (symbolValue) {
          symbolValues.push(symbolValue);
          stomp.add(symbolValue);
        } else {
          allIn = false;
        }
      });

      if (allIn) {

        if (typeVal === 'string') {
          var symbolValue = symbolValues[0];
          if (returnObj) {
            symbolValue.price = _getPrice(symbolValue);
            resolve(symbolValue);
          } else {
            resolve(_getPrice(symbolValue));
          }

          return;
        }

        if (returnObj) {
          resolve(symbolValues);
          return;
        }

        var list = {};
        symbolValues.forEach((symbolValue) => {
          var price = _getPrice(symbolValue);
          list[symbolValue.symbol] = price;
        });

        resolve(list);

        return;
      }

      Symbol.getQuoteKeys(symbols).then(function(symbolStr) {
        if (!symbolStr) {
          resolve([]);
          return;
        }
        return self.ajax({
          // url: '/v1/symbol/price/',
          // 换个接口取价格
          url: self.priceUrl,
          // url: 'http://account.etgbroker.com/v2/symbol/price',
          data: {
            // access_token: Cookie.get('token'),
            symbol: symbolStr
          },
          unjoin: true
        }).then(function(data) {
          if (data && data.data) {
            if (typeVal === 'string') {
              if (returnObj) {
                var obj = data.data[0] || {};
                obj.price = _getPrice(obj);
                resolve(obj);
              } else {
                var item = data.data[0];

                resolve(_getPrice(item));
              }
            } else {
              if (returnObj) {
                resolve(data.data);
              } else {
                var list = {};
                $.each(data.data, function(index, item) {
                  var symbol = item.symbol;
                  var price = _getPrice(item);
                  list[symbol] = price;
                });

                resolve(list);
              }
            }
          }
        });
      });

    });




    function _getPrice(item) {
      if (!item) {
        return '--';
      }
      if (item.ask_price && item.ask_price.length !== 0) {
        return item.ask_price[0];
      }

      if (item.bid_price && item.bid_price.length !== 0) {
        return item.bid_price[0];
      }

      return '--';
    }
  },

  // 获取当前价格
  getCurrentPriceObject: function(symbols, returnObj) {
    var self = this,
      type = this.isDemo() ? 'demo' : 'real',
      str,
      typeVal = typeof symbols;

    if (!Array.isArray(symbols)) {
      symbols = [symbols];
    }


    var symbolArr = [];
    $.each(symbols, function(index, symbol) {
      symbolArr.push('quote.' + type + '_default' + '.' + symbol);
    });

    str = symbolArr.join(',');


    return this.ajax({
      // url: '/v1/symbol/price/',
      // 换个接口取价格
      url: this.priceUrl,
      // url: 'http://account.etgbroker.com/v2/symbol/price',
      data: {
        // access_token: Cookie.get('token'),
        symbol: str
      },
      unjoin: true
    }).then(function(data) {
      // return this.getCurrentPrice(symbols, true).then(function(data) {
      if (data && data.data) {
        if (typeVal === 'string') {
          if (returnObj) {
            var obj = data.data[0] || {};
            obj.price = _getPriceObject(obj);
            return obj;
          } else {
            var item = data.data[0];

            return _getPriceObject(item);
          }
        }

        if (returnObj) {
          return data.data;
        }

        var list = {};
        $.each(data.data, function(index, item) {
          var symbol = item.symbol;
          var price = _getPriceObject(item);
          list[symbol] = price;
        });

        return list;
      }
    });

    function _getPriceObject(item) {
      var p = new Object();
      if (!item) {
        return '--';
      }
      if (item.ask_price && item.ask_price.length !== 0) {
        p.ask_price = item.ask_price[0];
      }

      if (item.bid_price && item.bid_price.length !== 0) {
        p.bid_price = item.bid_price[0];
      }

      return p;
    }
  },


  /**
   * 判断品种当前状态, 需要显示的错误提示
   * symbol: 从2.2.2.4 接口获取的symbol对象
   * account: 从2.2.2.5 接口获取的account对象
   **/
  checkStatus: function(symbol, account) {
    var self = this;

    return new Promise(function(resolve, reject) {

      var closeTime = symbol.close_time[0];
      var curaccount = self.isDemo() ? account.demo : account.real;
      var time = Date.now(),
        status = {};

      if (closeTime && time < Util.getTime(closeTime.end) && time > Util.getTime(closeTime.start)) {

        status = {
          tag: '休市',
          className: 'close',
          type: 'close',
          start: closeTime.end,
          closeTime: closeTime.start,
          reason: closeTime.reason
        };
        resolve(status);
      } else if (symbol.policy.real_enabled == '0' && symbol.policy.demo_enabled == '0') {
        status.tag = '不可交易';
        status.type = 'un-trade';
        resolve(status);
        // item.className = ''
      } else if (!self.isDemo() && symbol.policy.real_enabled == '0') {
        status.tag = '限模拟';
        status.className = 'simulate';
        status.type = 'simulate';
        resolve(status);
      } else {
        // 如果已经开仓了, 那么就不用检查余额不足了
        if (self.open) {
          resolve({});
        } else {
          var free_margin = curaccount.free_margin;
          self.calMarginWithMarketPrice(symbol, symbol.policy.min_vol, account).then(function(margin) {
            if (free_margin <= margin) {

              resolve({
                tag: '余额不足',
                type: 'more-money',
                className: 'more-money'
              });
            } else {
              resolve({});
            }
          });
        }
      }

    });
  },

  /**
   * 输入交易账户, 交易品种, 交易量, 按当前市场价格计算占用保证金
   * symbol: 从2.2.2.4 接口获取的symbol对象
   * volume: 交易量, 单位 手(Lot)
   * account: 从2.2.2.5 接口获取的account对象
   **/
  calMarginWithMarketPrice: function(symbol, volume, account) {
    var self = this;
    // 获取品种的当前市场价格
    return this.getCurrentPrice(symbol.policy.symbol, true).then(function(price) {

      var midPirce = price.price === '--' ? 0 : (parseFloat(price.bid_price[0]) + parseFloat(price.ask_price[0])) / 2;

      return self.getMargin(midPirce, symbol, volume, account);
    });
  },

  /**
   * 输入开仓价格, 交易账户, 交易品种, 交易量, 计算占用保证金
   * openPrice: 设定的开仓价格
   * symbol: 从2.2.2.4 接口获取的symbol对象
   * volume: 交易量, 单位 手(Lot)
   * account: 从2.2.2.5 接口获取的account对象
   **/
  getMargin: function(openPrice, symbol, volume, accountData) {
    var self = this;

    return new Promise(function(resolve, reject) {

      var isDemo = self.isDemo() ? true : false;
      // 杠杆
      var max_leverage = isDemo ? symbol.policy.demo_max_leverage : symbol.policy.real_max_leverage;
      var account = isDemo ? accountData.demo : accountData.real;
      var currency = account.currency;
      var trading_leverage = account.leverage * symbol.policy.leverage_multiplier; // 这里的account.leverage是对应demo或者real账户的leverage
      var isHasFixedMargin = symbol.policy.margin_is_fixed == '1' ? true : false;

      trading_leverage = trading_leverage < max_leverage ? trading_leverage : max_leverage;

      // 品种成交价格
      var mid_price = openPrice,
        trading_currency = symbol.policy.trading_currency,
        trading_home_symbol = trading_currency;

      var trading_home_price = 0;

      // 如果该品种有固定保证金， 就用固定保证金计算
      if ( isHasFixedMargin ) {
        var fixed_margin_ratio = parseFloat(symbol.policy.fixed_margin_ratio);
        var fixed_margin = fixed_margin_ratio * volume;
        resolve(fixed_margin);
      } else {
        // 品种trading_currency于账户home_currency的报价
        if (trading_currency == currency) { //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
          trading_home_price = 1;

          resolve(margin());
        } else {
          trading_home_symbol = trading_currency + currency; //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!

          self.getCurrentPrice(trading_home_symbol, true).then(function(price) {
            if (price && price.bid_price) {
              trading_home_price = (parseFloat(price.bid_price[0]) + parseFloat(price.ask_price[0])) / 2;
              resolve(margin());
            } else {
              trading_home_symbol = currency + trading_currency;
              self.getCurrentPrice(trading_home_symbol, true).then(function(price) {
                if (price && price.bid_price) {
                  trading_home_price = (parseFloat(price.bid_price[0]) + parseFloat(price.ask_price[0])) / 2;
                  trading_home_price = 1 / trading_home_price;
                  var marginVal = margin();
                  resolve(marginVal);
                } else {
                  reject();
                }
              });
            }
          });
        }
      }

      function margin() {
        var margin = parseFloat(symbol.policy.lot_size) * volume * parseFloat(mid_price) / (parseFloat(trading_leverage) / parseFloat(trading_home_price));
        return margin;
      }
    });
  },

  getAccount: function() {
    var self = this;

    return this.ajax({
      url: '/v3/user/',
      data: {
        access_token: Cookie.get('token')
      }
    }).then(function(data) {
      // 需要设置昵称
      // if (data.data.nickname === '') {
      //   // login._setNickname();
      // }
      // if (data.data.hb_is_first == 1 && Cookie.get('hbalert') != '1' && self._initGetHbDialog !== undefined && getIfShowFirstHBWL()) {
      //   Cookie.set('hbalert', '1', {
      //     expires: Infinity
      //   });
      //   if (!self.getGBDialog) {
      //     var a = data.data.hb_amount_available == undefined ? 15 : data.data.hb_amount_available;
      //     self._initGetHbDialog(a);
      //   }
      //   self.getGBDialog.show();
      // }
      return data.data;
    }, function(a, b) {
      console.log(a);

      return a;
    });
  },

  /**
   * 传入价格信息, 计算对应的止盈止损的金额, 用户下单UI
   * account 账户对象
   * cmd 交易类型 buy 或者 sell
   * symbol 商品对象
   * volume 交易量, 例如0.02
   * openPrice 开仓价格, 例如EURUSD开仓 1.10233
   * stopLoss 止损价格, 例如EURUSD止损 1.08000
   * takeProfit 止盈价格, 例如EURUSD止盈 1.20000
   *
   **/
  calMoney: function(accountData, symbol, volume, openPrice, stopLoss, takeProfit) {
    var self = this;
    // 开仓价格与当前价格的价差, cmd还有挂单的可能性, 但是挂单没有浮动盈亏
    var stoploss_price_delta = 0;
    var takeprofit_price_delta = 0;

    return new Promise(function(resolve, reject) {


      if (stopLoss != 0) {
        stoploss_price_delta = stopLoss - openPrice;
        if (stoploss_price_delta > 0) {
          stoploss_price_delta = 0 - stoploss_price_delta;
        }
        /*
        if (symbol.cmd == 'buy') {
            stoploss_price_delta = stopLoss - openPrice;
        } else {
            stoploss_price_delta = openPrice - stopLoss;
        }
        */
      }
      if (takeProfit != 0) {
        takeprofit_price_delta = takeProfit - openPrice;
        if (takeprofit_price_delta < 0) {
          takeprofit_price_delta = 0 - takeprofit_price_delta;
        }
        /*
        if (symbol.cmd == 'buy') {
            takeprofit_price_delta = takeProfit - openPrice;
        } else {
            takeprofit_price_delta = openPrice - takeProfit;
        }
        */
      }


      // 品种trading_currency于账户home_currency的报价
      var trading_currency = symbol.policy.trading_currency;
      var trading_home_price = 0;
      var account = self.isDemo() ? accountData.demo : accountData.real;

      if (trading_currency == account.currency) { //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
        trading_home_price = 1;
        resolve(money());
      } else {
        var trading_home_symbol = trading_currency + account.currency; //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
        self.getCurrentPrice(trading_home_symbol, true).then(function(price) {
          if (price && price.bid_price) {
            trading_home_price = (parseFloat(price.bid_price[0]) + parseFloat(price.ask_price[0])) / 2;
            resolve(money());
          } else {
            trading_home_symbol = account.currency + trading_currency;
            self.getCurrentPrice(trading_home_symbol, true).then(function(price) {
              if (price && price.bid_price) {
                trading_home_price = (parseFloat(price.bid_price[0]) + parseFloat(price.ask_price[0])) / 2;
                trading_home_price = 1 / trading_home_price;
                var moneyVal = money();
                resolve(moneyVal);
              } else {
                reject();
              }
            });
          }
        });
      };

      function money() {
        return {
          takeProfit: parseFloat(takeprofit_price_delta) * parseFloat(symbol.policy.lot_size) * volume * parseFloat(trading_home_price),
          stopLoss: parseFloat(stoploss_price_delta) * parseFloat(symbol.policy.lot_size) * volume * parseFloat(trading_home_price)
        }
      }

    });
  },

  /**
   * 计算默认交易量, 使用可用保证金的10%算
   *
   **/
  calVolume: function(symbol, accountData, preparedMargin) {
    var self = this;

    return this.calMarginWithMarketPrice(symbol, symbol.policy.min_vol, accountData).then(function(margin) {
      var account = self.isDemo() ? accountData.demo : accountData.real;

      var maxMargin = preparedMargin;
      preparedMargin = preparedMargin * .1;

      var volume = getVolume(preparedMargin);
      var maxVolume = getVolume(maxMargin);


      return {
        volume: volume,
        maxVolume: maxVolume
      };

      function getVolume(hasMargin) {

        // 不够交易最小交易量的情况
        if (hasMargin < margin)
          return 0;
        var vol = hasMargin / margin;
        var min_vol = symbol.policy.min_vol;
        vol = vol * min_vol;
        if (min_vol < 1) {
          min_vol = 1 / min_vol;
          vol = vol.toFixed(min_vol.toString().length - 1);
        } else {
          vol = parseInt(vol / min_vol);
        }

        return vol;
      }
    }).catch((e) => {
      console.log(e);
    })
  },

  getCurrentOrderList: function(type) {
    var self = this,
      type = type || (this.isDemo() ? 'demo' : 'real');

    if (type === 'demo') {
      return this._getCurrentOrderList(type);
    }

    return this.getRealToken().then(function(realToken) {
      return self._getCurrentOrderList(type, realToken);
    }, function() {
      var a = 1;
    });
  },

  getRealToken: function() {
    // Cookie.set('type', 'real');
    // Cookie.set('realToken', 'token50008119');

    // return Promise.resolve('token50008119');
    if (!Cookie.get('real_token')) {
      // return Promise.reject();
      location.href = './login.html';
    } else {
      return Promise.resolve(Cookie.get('real_token'));
    }
  },

  _getCurrentOrderList: function(type, realToken) {
    var self = this;

    var data = {
      access_token: Cookie.get('token')
    };

    if (type === 'real') {
      data.real_token = realToken;
    }

    return this.ajax({
      // 修改接口
      // url: '/v1/orders/' + type + '/current',
      url: '/v1/orders/' + type + '/current/mobtrade',
      data: data
    }).then(function(data) {
      var margin = 0,
        profit = 0,
        symbols = [];

      $.each(data.data, function(index, item) {
        var symbol = item.symbol;
        if (symbols.indexOf(symbol) === -1) {
          symbols.push(symbol);
        }
        margin += parseFloat(item.margin);
        profit += parseFloat(item.profit);
      });

      // 记录当前订单列表

      // self.orderList = {
      //     list: data.data,
      //     symbols: symbols,
      //     margin: margin,
      //     profit: profit
      // };


      return {
        list: data.data,
        symbols: symbols,
        margin: margin,
        profit: profit
      };

    }, function(e) {
      if (e.status === 1403) {
        // login.passwordDialog.show();
      }
    });
  },

  getHistoryOrderList: function(type) {
    var self = this,
      type = type || (this.isDemo() ? 'demo' : 'real');

    if (type === 'demo') {
      return this._getHistoryOrderList(type);
    }

    return this.getRealToken().then(function(realToken) {
      return self._getHistoryOrderList(type, realToken);
    });
  },

  _getHistoryOrderList: function(type, realToken) {
    var self = this;

    var data = {
      access_token: Cookie.get('token')
    };

    if (type === 'real') {
      data.real_token = realToken;
    }

    return this.ajax({
      // 修改接口
      // url: '/v1/orders/' + type + '/history',
      url: '/v1/orders/' + type + '/history/mobtrade',
      data: data
    }).then(function(data) {
      var margin = 0,
        profit = 0,
        symbols = [];

      $.each(data.data, function(index, item) {
        var symbol = item.symbol;
        if (symbols.indexOf(symbol) === -1) {
          symbols.push(symbol);
        }
        margin += parseFloat(item.margin);
        profit += parseFloat(item.profit);
      });

      return {
        list: data.data,
        symbols: symbols,
        margin: margin,
        profit: profit
      };

    }, function(e) {
      if (e.status === 1403) {
        // login.passwordDialog.show();
      }
    });
  },


  /**
   * 传入账户信息, 订单信息, 计算当前持仓的浮动盈亏  1个订单
   *
   * @param {Boolean} returnObj 返回每个订单的浮动盈亏  默认返回全部
   */
  getFloatingProfit: function(account, orderList, symbols) {
    var self = this,
      orderLen = orderList.length,
      mainProfit = 0,
      floatList = {},
      count = 0,
      type = self.isDemo() ? 'demo' : 'real';

    return new Promise((resolve, reject) => {

      if (orderLen === 0) {
        resolve(0);
      }

      this.getCurrentPrice(symbols, true).then(function(prices) {
        Symbol.get(symbols).then(function(optionList) {
          try {
            var obj = getProfitList(optionList, prices, orderList);
          } catch (e) {
            // console.log(e);
          }

          Promise.all(obj.deferreds).then((data) => {
            // console.log(data, mainProfit)
            resolve(mainProfit);

            var hash = {};

            obj.orderIds.forEach((ticket, index) => {
              hash[ticket] = data[index];
            });
            self.broadcast('get:floatMarginList', hash || [])
          });
          // $.when.apply($, deferreds).done(function() {
          //   resolve(mainProfit);

          //   self.broadcast('get:floatMarginList', floatList || [])
          // });
        });
      });

    });

    function getProfitList(optionList, prices, orderList) {
      var deferreds = [];
      var orderIds = [];

      $.each(orderList, function(index, item) {
        deferreds.push(getProfit(item, prices, optionList));
        orderIds.push(item.ticket);
      });

      return {
        deferreds: deferreds,
        orderIds: orderIds
      };
    }

    function getProfit(item, prices, optionList) {
      return new Promise(function(resolve, reject) {
        var symbol = item.symbol,
          current_price = getPrice(prices, symbol),
          policy = getSym(optionList, symbol).policy,
          // 在这里取是因为针对买涨买跌应该取不同的价格, 这里最方便
          ba = self.bottomAccount == undefined ? self : self.bottomAccount;

        // 如果从服务器没有获得某品种的价格, 那么就不做计算
        if (!current_price) {
          resolve(0);
          return;
        }


        // 开仓价格与当前价格的价差, cmd还有挂单的可能性, 但是挂单没有浮动盈亏
        var price_delta = 0;
        if (item.status == 'open' && item.cmd.indexOf('buy') != -1) {
          price_delta = current_price.bid_price[0] - item.openPrice;

          // 尝试解决当前订单列表中每个订单当前价格的更新问题
          if (ba.prices) {
            ba.prices[policy.symbol] = current_price.bid_price[0];
          }
        } else if (item.status == 'open' && item.cmd.indexOf('sell') != -1) {
          price_delta = item.openPrice - current_price.ask_price[0];
          // 尝试解决当前订单列表中每个订单当前价格的更新问题
          if (ba.prices) {
            ba.prices[policy.symbol] = current_price.ask_price[0];
          }
        }

        // 品种trading_currency于账户home_currency的报价
        var trading_currency = policy.trading_currency;
        var trading_home_price = 0;

        if (trading_currency == account[type].currency) { //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
          trading_home_price = 1;
          resolve(profit(trading_home_price, item));
        } else {
          var trading_home_symbol = trading_currency + account[type].currency; //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
          self.getCurrentPrice(trading_home_symbol, true).then(function(temp_price) {
            if (temp_price && temp_price.bid_price) {
              trading_home_price = parseFloat(temp_price.bid_price[0]);

              // trading_home_price = (parseFloat(temp_price.bid_price[0]) + parseFloat(temp_price.ask_price[0]) )/ 2;
              resolve(profit(trading_home_price, item));
            } else {
              trading_home_symbol = account[type].currency + trading_currency; //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
              self.getCurrentPrice(trading_home_symbol, true).then(function(temp_price) {
                // temp_price = self.getCurrentPrice(trading_home_symbol, account.type);
                if (temp_price && temp_price.ask_price) {

                  trading_home_price = parseFloat(temp_price.ask_price[0]);

                  // trading_home_price = (parseFloat(temp_price.bid_price[0]) + parseFloat(temp_price.ask_price[0])) / 2;
                  trading_home_price = 1 / trading_home_price;
                  resolve(profit(trading_home_price, item));
                } else {
                  resolve(profit(0, item));
                }
              });
            }
          });

        }

        function profit(trading_home_price, item) {
          // 只有status=open的订单才需要计算profit
          var profitNum = parseFloat(item.profit);
          if (item.status == 'open') {
            profitNum = parseFloat(price_delta) * parseFloat(policy.lot_size) * parseFloat(item.volume) * parseFloat(trading_home_price);
            profitNum = profitNum + parseFloat(item.swap || 0) - parseFloat(item.commission || 0);
          }
          floatList[item.ticket] = profitNum;
          mainProfit += profitNum;
          return profitNum;
        }

      });


    }

    function getPrice(prices, symbol) {
      for (var i = 0, len = prices.length; i < len; i++) {
        if (prices[i].symbol === symbol) {
          return prices[i];
        }
      }
    }

    function getSym(optionList, symbol) {
      for (var i = 0, len = optionList.length; i < len; i++) {
        if (optionList[i].policy.symbol === symbol) {
          return optionList[i];
        }
      }
    }
  },

  getFloatingProfitList(account, orderList, symbols) {
    var self = this,
      orderLen = orderList.length,
      mainProfit = 0,
      floatList = {},
      count = 0,
      type = self.isDemo() ? 'demo' : 'real';

    return new Promise((resolve, reject) => {

      if (orderLen === 0) {
        resolve(0);
      }

      this.getCurrentPrice(symbols, true).then(function(prices) {
        Symbol.get(symbols).then(function(optionList) {
          try {
            var obj = getProfitList(optionList, prices, orderList);
          } catch (e) {
            // console.log(e);
          }

          Promise.all(obj.deferreds).then((data) => {
            resolve({floatList: floatList, prices: prices});
          });
        });
      });

    });

    function getProfitList(optionList, prices, orderList) {
      var deferreds = [];
      var orderIds = [];

      $.each(orderList, function(index, item) {
        deferreds.push(getProfit(item, prices, optionList));
        orderIds.push(item.ticket);
      });

      return {
        deferreds: deferreds,
        orderIds: orderIds
      };
    }
    function getProfit(item, prices, optionList) {
      return new Promise(function(resolve, reject) {
        var symbol = item.symbol,
          current_price = getPrice(prices, symbol),
          policy = getSym(optionList, symbol).policy,
          // 在这里取是因为针对买涨买跌应该取不同的价格, 这里最方便
          ba = self.bottomAccount == undefined ? self : self.bottomAccount;

        // 如果从服务器没有获得某品种的价格, 那么就不做计算
        if (!current_price) {
          resolve(0);
          return;
        }


        // 开仓价格与当前价格的价差, cmd还有挂单的可能性, 但是挂单没有浮动盈亏
        var price_delta = 0;
        if (item.status == 'open' && item.cmd.indexOf('buy') != -1) {
          price_delta = current_price.bid_price[0] - item.openPrice;

          // 尝试解决当前订单列表中每个订单当前价格的更新问题
          if (ba.prices) {
            ba.prices[policy.symbol] = current_price.bid_price[0];
          }
        } else if (item.status == 'open' && item.cmd.indexOf('sell') != -1) {
          price_delta = item.openPrice - current_price.ask_price[0];
          // 尝试解决当前订单列表中每个订单当前价格的更新问题
          if (ba.prices) {
            ba.prices[policy.symbol] = current_price.ask_price[0];
          }
        }

        // 品种trading_currency于账户home_currency的报价
        var trading_currency = policy.trading_currency;
        var trading_home_price = 0;

        if (trading_currency == account[type].currency) { //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
          trading_home_price = 1;
          resolve(profit(trading_home_price, item));
        } else {
          var trading_home_symbol = trading_currency + account[type].currency; //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
          self.getCurrentPrice(trading_home_symbol, true).then(function(temp_price) {
            if (temp_price && temp_price.bid_price) {
              trading_home_price = parseFloat(temp_price.bid_price[0]);

              // trading_home_price = (parseFloat(temp_price.bid_price[0]) + parseFloat(temp_price.ask_price[0]) )/ 2;
              resolve(profit(trading_home_price, item));
            } else {
              trading_home_symbol = account[type].currency + trading_currency; //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
              self.getCurrentPrice(trading_home_symbol, true).then(function(temp_price) {
                // temp_price = self.getCurrentPrice(trading_home_symbol, account.type);
                if (temp_price && temp_price.ask_price) {

                  trading_home_price = parseFloat(temp_price.ask_price[0]);

                  // trading_home_price = (parseFloat(temp_price.bid_price[0]) + parseFloat(temp_price.ask_price[0])) / 2;
                  trading_home_price = 1 / trading_home_price;
                  resolve(profit(trading_home_price, item));
                } else {
                  resolve(profit(0, item));
                }
              });
            }
          });

        }

        function profit(trading_home_price, item) {
          // 只有status=open的订单才需要计算profit
          var profitNum = parseFloat(item.profit);
          if (item.status == 'open') {
            profitNum = parseFloat(price_delta) * parseFloat(policy.lot_size) * parseFloat(item.volume) * parseFloat(trading_home_price);
            profitNum = profitNum + parseFloat(item.swap || 0) - parseFloat(item.commission || 0);
          }
          floatList[item.ticket] = profitNum;
          mainProfit += profitNum;
          return profitNum;
        }

      });


    }

    function getPrice(prices, symbol) {
      for (var i = 0, len = prices.length; i < len; i++) {
        if (prices[i].symbol === symbol) {
          return prices[i];
        }
      }
    }

    function getSym(optionList, symbol) {
      for (var i = 0, len = optionList.length; i < len; i++) {
        if (optionList[i].policy.symbol === symbol) {
          return optionList[i];
        }
      }
    }
  },

  cookie: Cookie,
  getPrice: function(symbols) {
    return stomp.getPrice(symbols);
    // if (Util.supportWebsocket()) {
    //     if (!this.symbolStompObj) {
    //         this.symbolStompObj = new Stomp({
    //             symbols: symbols
    //         });

    //         console.log('stomp')
    //     }

    //     this.symbolStompObj.add(symbols);

    //     var prices = this.symbolStompObj.get(symbols);

    //     if (prices) {
    //         return prices;
    //     }
    // }
  }
});

module.exports = PageBase;