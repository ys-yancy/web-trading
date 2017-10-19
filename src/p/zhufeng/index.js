'use strict';

require('../../common/slider');
var Base = require('../../app/base');
var Util = require('../../app/util');
var ZHeader = require('../../common/zHeader');

class Home extends Base {
  constructor() {
    super();

    this.cacheSymbol = {};
    this._getSymbols();

    this.getClosePrice().then(() => {
      this._setInterval();
    });

    this._bind();
    this._interval();
  }

  _bind() {
    var doc = $(document);

    doc.on('mouseenter', '.J_NavItem', (e) => {
      var curEl = $(e.currentTarget);

      if (!curEl.hasClass('active')) {
        var index = curEl.index();
        curEl.siblings().removeClass('active');
        curEl.addClass('active');

        var itemEls = $('.slide-item');

        itemEls.stop(true, true);

        var curSlideItem = $(itemEls[index]);
        curSlideItem.siblings().hide();

        curSlideItem.fadeIn(1000);
      }
    });

    doc.on('mouseenter', '.banner', (e) => {
      clearTimeout(this.timer);
    });

    doc.on('mouseleave', '.banner', (e) => {
      this._interval();
    });

    doc.on('click', '.arrow-left', (e) => {
      this._switch();
    });

    // doc.on('click', '.invest-now', (e) => {
    //     var innerEl = $('.advantage-inner');
    //     var headerEl = $('#J_Header');

    //     $(window).scrollTop(innerEl.offset().top - headerEl.height());
    // });
  }

  _switch() {
    var activeEl = $('.J_NavItem.active');

    var index = activeEl.index();
    var navItemEls = $('.J_NavItem');
    var total = navItemEls.length;

    if (index === 0) {
      index = total - 1;
    } else {
      index -= 1;
    }

    $(navItemEls[index]).trigger('mouseover');
  }

  _interval() {
    clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      this._switch();
      this._interval();
    }, 10 * 1000);
  }

  getClosePrice() {
    return this.ajax({
      url: '/v1/symbol/closeprice/',
      data: {
        symbols: this.symbols.join(',')
      }
    }).then((data) => {
      data = data.data;

      this.closePriceCache = data.close_price;
      this.closeTimeCache = data.close_time;
    });
  }

  _getSymbols() {
    var symbols = [];


    $('.J_Symbol').each((index, item) => {

      var val = $(item).text().trim();
      if (val) {
        var linkEl = $(item).parent().parent();

        var symbol = linkEl.attr('data-symbolname').replace(/--/g, '.');

        this.cacheSymbol[symbol] = {
          minUnit: $(item).attr('data-unit').split('.')[1].length
        }

        symbols.push(symbol);
      }

    });

    this.symbols = symbols;
  }

  _setInterval() {
    var self = this;
    var symbolsStr = this._getSymbolStr();

    var type = 'real';

    this.ajax({
      url: getV2priceCurrentUrl(),
      data: {
        symbol: symbolsStr
      },
      unjoin: true
    }).then((data) => {
      data = data.data;

      this._parse(data);

      data.forEach((item, index) => {
        var oldSymbol = this.cacheSymbol[item.symbol];

        var minUnit = oldSymbol.minUnit || 4;

        try {
          var itemEl = $('.link[data-symbolname=' + item.symbol.replace(/\./g, '--') + ']');
        } catch (e) {

        }

        var statusEl = $('.status', itemEl);
        minUnit = oldSymbol.minUnit;

        // var symbol = self._getSymbol(item.symbol);
        var askPrice = item.ask_price[0];
        var bidPrice = item.bid_price[0];

        // if (新价格.bid >= 老价格.bid || 新价格.ask >= 老价格.ask) 两个报价颜色设置为红色
        if (oldSymbol.askPrice) {
          if (askPrice > oldSymbol.askPrice || bidPrice >= oldSymbol.bidPrice) {
            itemEl.addClass('up');
          } else {
            itemEl.removeClass('up');
          }
          // if (涨幅>0) {涨幅背景为红色}
          if ((+askPrice) + (+bidPrice) - 2 * oldSymbol.closePrice > 0) {
            itemEl.addClass('up');
          } else {
            itemEl.removeClass('up');
          }
        }


        if (askPrice) {
          askPrice = parseFloat(askPrice).toFixed(minUnit);
          $('.J_AskPrice', itemEl).text(askPrice);
          oldSymbol.askPrice = askPrice;
        }

        if (bidPrice) {
          bidPrice = parseFloat(bidPrice).toFixed(minUnit);

          $('.J_BidPrice', itemEl).text(bidPrice);

          // console.log($('.J_BidPrice', itemEl))
          oldSymbol.bidPrice = bidPrice;
        }

        bidPrice = parseFloat(bidPrice);
        askPrice = parseFloat(askPrice);

        var rate = ((bidPrice + askPrice) / 2 - this.closePriceCache[item.symbol]) / this.closePriceCache[item.symbol];
        var isUp = rate >= 0;
        rate = isNaN(rate) ? '--' : (rate.toFixed(5) * 100).toFixed(3) + '%';

        if (item.tag) {
          statusEl.html(item.tag);
          itemEl.addClass('close');
        } else {
          statusEl.html(rate);
          itemEl.removeClass('close');
        }


        if (isUp) {
          itemEl.addClass('up');
        } else {
          itemEl.removeClass('up');
        }
      });

      setTimeout(function() {
        self._setInterval();
      }, 3000);
    }).catch((e) => {
      window.console && console.log(e);
    })
  }

  _getSymbolStr() {
    var type = 'real',
      symbols = [];

    for (var i = 0, len = this.symbols.length; i < len; i++) {
      var symbol = this.symbols[i];
      var str = 'quote.' + type + '_default.' + symbol;

      symbols.push(str);
    }

    return symbols.join(',');
  }

  _parse(data) {
    //status 默认是余额不足， break表示违规，simulate表示限模拟，close表示休市
    var type = 'real';
    var self = this,
      symbols = [],
      cacheSymbol = {};

    data.forEach((item, index) => {
      var closeTimeObj = this.closeTimeCache[item.symbol];
      if (item.symbol && closeTimeObj) {

        var closeTime = closeTimeObj[0];
        var time = Date.now();

        if (closeTime && time < Util.getTime(closeTime.end) && time > Util.getTime(closeTime.start)) {
          item.tag = '休市';
          item.className = 'close';
        } else {
          item.tag = '';
          symbols.push(item);
        }
      }
    });
  }
}

new Home();