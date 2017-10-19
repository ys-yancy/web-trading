var cacheSymbols = {
  demo: {},
  real: {}
};

var emptySymbols = {
  demo: {},
  real: {}
};

var Cookie = require('../lib/cookie');
var IO = require('./ajax');
var Util = require('./util');

/**
 * 降低对V3接口的依赖，缓存V3返回的数据
 */
module.exports = {
  get: function(symbols) {
    var self = this;

    return new Promise((resolve, reject) => {

      var optionList = this._get(symbols);

      // 如果存在直接读取缓存
      if (optionList) {
        resolve(optionList);

        return;
      }

      if (!symbols) {
        resolve([]);
        return;
      }
      var url = this._getUrl(),
        token = Cookie.get('token'),
        data = {
          access_token: token
        };

      var type = this._getType();
      var cache = emptySymbols[type];

      var symbolsArray = [];

      symbols.forEach((symbol) => {
        if (!cache[symbol]) {
          symbolsArray.push(symbol);
        }
      });

      if (symbolsArray.length === 0) {
        resolve([]);

        return;
      } else {
        var optionList = this._get(symbolsArray);
        if (optionList) {
          resolve(optionList);
          return;
        }
      }

      // if (Array.isArray(symbols)) {
      data.symbols = symbolsArray.join(',');
      // }

      IO.ajax({
        url: url,
        data: data
      }).then((data) => {
        self._save(data.data);

        var type = this._getType();

        var cache = emptySymbols[type];

        symbols.forEach((symbol) => {
          if (!this._inSymbol(data.data, symbol)) {
            cache[symbol] = true;
          }
        });

        resolve(data.data);
      });
    });
  },

  _inSymbol: function(data, symbol) {
    var inArray = false;
    data.forEach((item) => {
      if (item.policy.symbol === symbol) {
        inArray = true;
      }
    });

    return inArray;
  },

  getQuoteKeys: function(symbols) {
    var self = this,
      list = [];

    return this.get(symbols).then(function(optionList) {
      optionList.forEach(function(item) {
        list.push(item.policy.quote_sub_routing_key);
      });

      return list.join(',')
    });

  },

  _get: function(symbols) {
    var type = this._getType();

    var cache = cacheSymbols[type];
    var optionList = [];

    for (var i = 0, len = symbols.length; i < len; i++) {
      var symbol = symbols[i];
      if (cache[symbol]) {
        optionList.push(cache[symbol]);
      } else {
        return undefined;
      }
    }

    return optionList;
  },

  _save: function(optionList) {
    var type = this._getType();
    var cache = cacheSymbols[type];

    for (var i = 0, len = optionList.length; i < len; i++) {
      if (!cache[optionList[i].policy.symbol]) {
        cache[optionList[i].policy.symbol] = optionList[i];
      }
    }
  },

  _getType: function() {
    return Cookie.get('type') === 'demo' ? 'demo' : 'real';
  },

  _getUrl: function() {
    // 实盘  actual quotation
    var demo = Cookie.get('type') === 'demo';

    var url = demo ? '/v3/demo/symbols4' : '/v3/real/symbols4';

    return url;
  },

  isClose(symbol) {
    var symbolValues = this._get([symbol]);
    if (!symbolValues) {
      return;
    }
    var symbolValue = symbolValues[0];
    if (symbolValue.close) {
      return symbolValue;
    }

    var closeTime = symbolValue.close_time[0];
    var time = Date.now();

    if (closeTime && time < Util.getTime(closeTime.end) && time > Util.getTime(closeTime.start)) {
      symbolValue.close = true;
      return symbolValue;
    }
  }
};