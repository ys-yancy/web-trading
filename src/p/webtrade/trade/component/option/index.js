/**
 * 自选列表
 */

'use strict';

var Core = require('../../../../../app/core');
var Util = require('../../../../../app/util');
var InfinityScroll = require('../../../../../common/infinite-scroll');
var Overlay = require('../../../../../common/overlay');
var tmpl = require('./index.ejs.html');
var searchTmpl = require('./search.ejs.html');
var CreateOrder = require('../create-order');
var optionList = require('./option-list');
var Move = require('./move');

var Category = require('./category');
// var Manage = require('./manage');

export default class Option extends Core {
  constructor(config) {
    super(config);

    this._bind();
    this._getData();

    this.category = new Category({ option: optionList, parent: this });
    // this.manage = new Manage({ option: optionList, parent: this });
  }

  _bind() {
    var doc = $(document);

    $('.loading', this.el).show();

    this.el.on('focus', '#J_Search', (e) => {
      this.category.show();

    });

    this.el.on('click', '.J_Edit', (e) => {
      // this.manage.show();
    })



    // this.el.on('click', '.trigger-wrapper', (e) => {
    //   $('.J_TabNavOption').trigger('click');
    // });

    // 显示订单
    this.el.on('click', '.J_OptionItem', _.bind(function(e) {
      var curEl = $(e.currentTarget);
      var self = this;
      this.curOptionItemEl = curEl;
      clearTimeout(this.timer);
      // if (curEl.hasClass('show')) {
      //   // this.timer = setTimeout(() => {
      //   //   this.createOrder && this.createOrder.destroy();
      //   //   curEl.removeClass('show');
      //   // }, 300);
      // } else {
      e.stopPropagation();

      this.createOrder && this.createOrder.destroy();
      // this.createOrder && this.createOrder._resetTranslateScroll();

      if ( curEl.hasClass('show') ) {
        // this.overlay.hide();
        $('.J_OptionItem', this.el).removeClass('show');
        return;
      }

      $('.J_OptionItem', this.el).removeClass('show');

      this.overlay.show(curEl, true);
      curEl.addClass('show');
      this._showOrder(curEl);
      this.broadcast('clear:selfOrderLine');
      
    }, this));



    var tipsEl = $('.J_Tips', this.el);
    var iptEl = $('#ipt');
    iptEl.on('change paste keyup', (e) => {
      var val = $('#ipt').val();

      if (val === this.prev) {
        return;
      }
      this.prev = val;

      this._search(val);

      if (!val) {
        tipsEl.show();
      } else {
        tipsEl.hide();
      }
    }).on('focus', (e) => {
      var val = $(e.currentTarget).val();


      if (!val) {
        tipsEl.show();
      } else {
        tipsEl.hide();
        $('#J_SuggestInner').parent().show();
      }
    }).on('blur focusout', (e) => {
      tipsEl.hide();
      // $('#J_SuggestInner').hide();
    });


    // 展示和隐藏添加自选按钮
    this.el.on('mouseenter', '.J_SearchItem', (e) => {

      var curEl = $(e.currentTarget);
      // curEl.addClass('hover');
      // if (!curEl.hasClass('add')) {
      //   return;
      // }
      var actionEl = $('.J_Action', curEl);
      actionEl.show();
    });

    this.el.on('mouseleave', '.J_SearchItem', (e) => {
      var curEl = $(e.currentTarget);
      // curEl.removeClass('hover');
      // if (!curEl.hasClass('add')) {
      //   return;
      // }


      var actionEl = $('.J_Action', curEl);
      actionEl.hide();
    }).on('click', '.J_SearchItem', (e) => {
      var symbol = $(e.currentTarget).attr('data-s');

      this.broadcast('change:symbol', {
        symbol: symbol
      });
    });

    // 添加自选
    this.el.on('click', '.J_Action', (e) => {
      var curEl = $(e.currentTarget);
      var parentEl = curEl.parent();
      var symbol = $('.symbol', parentEl).text().trim();
      var symbolName = $('.name', parentEl).text().trim();
      e.stopPropagation();

      if (curEl.hasClass('del')) {
        this._del(symbol).then(() => {
          $('.J_OptionItem[data-symbol=' + symbol.replace(/\./g, '--') + ']').remove();

          this._removeSymbol(symbol);
          curEl.removeClass('del');
          optionList.del(symbol);
        });

        return;
      }
      this._add(symbol).then(() => {
        // parentEl.removeClass('add');
        // curEl.hide();

        optionList.add(symbol);

        var itemEl = $('.J_SearchItem[data-symbol=' + symbol.replace(/\./g, '--') + ']');
        curEl.addClass('del');
        // $('.J_Action', itemEl).hide();

        this._update();
      });

      // parentEl.removeClass('J_SearchItem');
    });

    this.el.on('click', '.J_Del', (e) => {
      e.stopPropagation();
      var curEl = $(e.currentTarget);
      var parentEl = curEl.parents('.J_OptionItem');
      var symbol = parentEl.attr('data-symbol');
      var symbolValue = this._getSymbol(symbol);

      this._del(symbolValue.quote.symbol).then(() => {
        parentEl.remove();

        this._removeSymbol(symbolValue.quote.symbol)
          // this._update();
          // this.createOrder && this.createOrder.rePos();
      });
    });

    $(document).on('click', (e) => {
      var curEl = $(e.target);

      if (curEl.parents('.search-wrapper').length > 0) {
        return;
      }

      // $('#J_SuggestInner').parent().hide();
    });
    this.el.on('mouseleave', '.search-wrapper', (e) => {
      if (iptEl.is(':focus')) {
        return;
      }
      $('.suggest', this.el).hide();
    });

    // 订阅价格变化
    this.subscribe('stomp:price:update', this._updatePrice, this);
  }

  _removeSymbol(symbol) {
    var index = this.symbols.indexOf(symbol);
    this.symbols.splice(index, 1);
  }

  // hideOverlay() {
  //   this.overlay && this.overlay.hide();
  // }

  del(symbol) {
    return this._del(symbol).then(() => {
      this._removeSymbol(symbol);
      // curEl.removeClass('del');
      optionList.del(symbol);
    });
  }

  add(symbol) {
    return this._add(symbol).then(() => {


      optionList.add(symbol);
      this._update();
    });
  }

  _add(symbol) {
    return this.ajax({
      url: '/v1/user/fav/symbol/',
      type: 'post',
      data: {
        symbol: symbol,
        access_token: this.cookie.get('token')
      }
    }).then(() => {

    });
  }

  _del(symbol) {
    return this.ajax({
      url: '/v1/user/fav/symbol/',
      type: 'delete',
      data: {
        symbol: symbol,
        access_token: Cookie.get('token')
      }
    });
  }

  // 更新自选列表
  _update() {
    this._getData();
  }

  update() {
    this._update();
  }

  // 获取自选列表
  _getData() {
    var type = this.isDemo() ? 'demo' : 'real';

    return this.ajax({
      url: '/v3/' + type + '/symbols4/',
      data: {
        access_token: this.cookie.get('token')
      }
    }).then((data) => {

      data = data.data;
      this._parse(data);

      data = this._sortUp(data);
      
      // data = this.manage.sortUp(data);
      data = Move.prototype.sortUp(data);

      this.symbolsList = data;
      // this.manage && (this.manage.list = data);
      // this.manage.list = data;

      this.render(tmpl, data, $('#J_OptionList'));

      new Move($('#J_moveSymbolTable'));

      this.overlay = new Overlay({
        parentEl: $('#J_OptionList', $('#J_moveSymbolTable')),
        headerEl: $('thead', $('#J_moveSymbolTable')),
        isScrollTop: true
      });

    });
  }

  getData() {
    var type = this.isDemo() ? 'demo' : 'real';

    return this.ajax({
      url: '/v3/' + type + '/symbols4/',
      data: {
        access_token: this.cookie.get('token')
      }
    }).then((data) => {
      return data.data;
    });
  }

  _sortUp(data) {
    var type = this.isDemo() ? 'demo' : 'real';
    var symbols = this.symbols;
    var arr = [];
    var list = optionList.get();

    for (var i = 0, len = list.length; i < len; i++) {
      var quote = get(list[i], data);
      if (quote) {
        arr.push(quote);
      }
    }

    for (var i = 0, len = symbols.length; i < len; i++) {
      if (list.indexOf(symbols[i]) == -1) {
        var quote = get(symbols[i], data);
        if (quote) {
          arr.push(quote);
        }
      }
    }

    return arr.concat(data);

    function get(symbol, data) {
      for (var i = 0, len = data.length; i < len; i++) {
        if (data[i].policy.symbol === symbol) {
          var tmp = data[i];
          data.splice(i, 1);

          return tmp;
        }
      }
    }
  }

  _parse(data) {
    //status 默认是余额不足， break表示违规，simulate表示限模拟，close表示休市
    var type = this.isDemo() ? 'demo' : 'real';
    var self = this,
      symbols = [],
      cacheSymbol = {};
    this.symbols = [];

    $.each(data, (index, item) => {
      if (item.quote) {
        var closeTime = item.close_time[0];
        var time = Date.now();

        if (closeTime && time < Util.getTime(closeTime.end) && time > Util.getTime(closeTime.start)) {
          // item.tag = '休市';
          item.tag = closeTime.reason;
          item.className = 'close';
        } else if (item.policy.real_enabled == '0' && item.policy.demo_enabled == '0') {
          item.tag = '不可交易';
          // item.className = ''
        } else if (type === 'real' && item.policy.real_enabled == '0') {
          item.tag = '限模拟';
          item.className = 'simulate';
        } else {
          symbols.push(item);
        }
        try {

          var bidPrice = parseFloat(item.quote.bid_price[0]);
          var askPrice = parseFloat(item.quote.ask_price[0]);
          var rate = (bidPrice + askPrice) / 2 - item.close_price > 0 ? true : false;
          var rateVal = (bidPrice + askPrice) / 2 - item.close_price;

          var ratePercent = rateVal / item.close_price;
          ratePercent = isNaN(ratePercent) ? '--' : (ratePercent.toFixed(5) * 100).toFixed(3);

          item.up = rate;
          item.rate = ratePercent;
          item.rateVal = isNaN(rateVal) ? '--' : rateVal.toFixed(2);

        } catch (e) {
          item.up = false;
        }

        cacheSymbol[item.policy.symbol] = {
          minUnit: item.policy.min_quote_unit,
          askPrice: item.quote.ask_price[0],
          bidPrice: item.quote.bid_price[0],
          closePrice: item.close_price
        };

        item.quote.subAsk = this._substring(item.quote.ask_price[0]);
        item.quote.subBid = this._substring(item.quote.bid_price[0]);

        this.symbols.push(item.policy.symbol);
      }
    });

    // console.log(cacheSymbol)

    this.cacheSymbol = cacheSymbol;

    // 计算余额不足


    this.getAccount().then((account) => {
      $.each(self.symbolsList, (index, item) => {
        self.checkStatus(item, account.account).then(function(status) {
          if (status.tag) {
            var itemEl;
            itemEl = $('.status[data-symbol=' + item.policy.symbol.replace(/\./g, '--') + ']');
            itemEl.addClass(status.type);
          }
        });
      });
    });
  }

  // 更新价格
  _updatePrice(data) {
    // console.log(data);
    // $.each(data, (index, item) => {
    var oldSymbol = this.cacheSymbol[data.symbol];
    var minUnit = oldSymbol.minUnit;

    try {
      var symbol = data.symbol.replace(/\./g, '--');
      var itemEl = $('.J_OptionItem[data-symbol=' + symbol + ']');
      //当前订单的价格
      var orderItemEl = $('.openTicket[data-symbol=' + symbol + ']');
    } catch (e) {
      return;
    }

    if (itemEl.length === 0) {
      return;
    }

    var percentEl = $('.status', itemEl);
    minUnit = minUnit.split('.')[1].split('').length;

    var askPrice = data.askPrice;
    var bidPrice = data.bidPrice;

    // if (新价格.bid >= 老价格.bid || 新价格.ask >= 老价格.ask) 两个报价颜色设置为红色
    if (askPrice > oldSymbol.askPrice || bidPrice >= oldSymbol.bidPrice) {
      itemEl.addClass('up');
    } else {
      itemEl.removeClass('up');
    }

    // if (涨幅>0) {涨幅背景为红色}
    if ((+askPrice) + (+bidPrice) - 2 * oldSymbol.closePrice > 0) {
      !percentEl.hasClass('disabled') && percentEl.addClass('up');
    } else {
      percentEl.removeClass('up');
    }

    if (data.ask_price && data.ask_price[0] && askPrice) {
      var subAsk = this._substring(data.ask_price[0]);

      $('.J_AskPriceInt', itemEl).text(subAsk.str);
      $('.J_AskPriceFloat', itemEl).text(subAsk.substr);

      oldSymbol.askPrice = askPrice;
    }

    if (data.bid_price && data.bid_price[0] && bidPrice) {
      var subBid = this._substring(data.bid_price[0]);

      $('.J_BidPriceInt', itemEl).text(subBid.str);
      $('.J_BidPriceFloat', itemEl).text(subBid.substr);

      oldSymbol.bidPrice = bidPrice;
    }

    if (data.askPrice && data.bidPrice) {
      var symbolVal = this.cacheSymbol[data.symbol];
      var curPrice = (parseFloat(data.bidPrice) + parseFloat(data.askPrice)) / 2
      var rate = curPrice - symbolVal.closePrice > 0 ? true : false;
      var rateVal = curPrice - symbolVal.closePrice;
      var ratePercent = rateVal / symbolVal.closePrice;
      ratePercent = isNaN(ratePercent) ? '--' : (ratePercent.toFixed(5) * 100).toFixed(3);
      var rateVal = isNaN(rateVal) ? '--' : rateVal.toFixed(2);

      var statusEl = $('.status', itemEl);

      rate ? statusEl.addClass('up') : statusEl.removeClass('up');

      statusEl.attr({
        'data-rate': ratePercent + '%',
        'data-rateval': rateVal
      });

      $('.status-val', statusEl).text(ratePercent + '%');
    }

    //更新当前订单的价格
    try{

      this.broadcast('update:curOrderPrice', {
        symbol: orderItemEl.attr('data-symbol'),
        ask_price: data.ask_price[0],
        bid_price: data.bid_price[0]
      })
      // 买跌ask 买涨bid
      $('.openTicketPriceNum', orderItemEl).text(data.ask_price[0]);
      $('.openTicketPriceNum.up', orderItemEl).text(data.bid_price[0]);

    }catch(e){
      console.log(e);
    }

  }

  /**
   * 截取最后两位
   */
  _substring(string, count) {
    count = count || 2;
    var len = string.length;

    return {
      str: string.substring(0, len - count),
      substr: string.substring(len - count)
    }
  }
  search(q) {
    this._search(q);
  }


  // 搜索
  _search(q) {
    if (q === this.prevQ) {
      return;
    } else {
      this.prevQ = q;
    }

    this.infinity && this.infinity.destroy();
    // $('#J_SuggestInner').hide
    this._query(q);
  }

  _query(q) {
    var self = this,
      token = Cookie.get('token'),
      optionList = this.symbols;

    var count = 40;
    var params = {
      access_token: Cookie.get('token'),
      kw: q,
      start: 0,
      count: count
    };
    var url = '/v1/symbol/search/';
    var suggestInnerEl = $('#J_SuggestInner');

    this.infinity = new InfinityScroll({
      loadingConfig: {
        el: $('#J_Loading'),
        needInit: false,
      },
      params: params,
      el: suggestInnerEl,
      referEl: suggestInnerEl.parent(),
      url: url,
      tmpl: searchTmpl,
      emptyTmpl: '暂无内容',
      infinite: true,
      hasNextPage: true,
      beforeRequest: function(params) {
        return {
          count: count,
          start: params.page * count
        };
      },
      parse: function(data, params) {
        if (data && data.data) {
          var hasNextPage = true;

          if (data.data.length === 0 || data.data.length < count) {
            hasNextPage = false;
          }
          var symbols = [];

          $.each(data.data, function(index, item) {
            var symbol = item.symbol;
            symbols.push(symbol);

            item.kw = q;

            item.add = optionList.indexOf(symbol) !== -1 ? false : true;
          });

          if (params.page === 0) {
            suggestInnerEl.html('');
          }

          suggestInnerEl.parent().show();

          self._getCategory(symbols);


          return {
            data: data.data,
            hasNextPage: hasNextPage
          }
        }

        return data;
      },

      callback: function() {

      }
    });
  }

  _getCategory(symbols) {
    this.getSymbols(symbols).then((data) => {
      (data || []).forEach(symbolValue => {
        var itemEl = $('.J_SearchItem[data-symbol=' + symbolValue.policy.symbol.replace(/\./g, '--') + ']');
        $('.category', itemEl).text(symbolValue.policy.category);
      });
    })
  }

  _showOrder(referEl) {
    var symbol = referEl.attr('data-symbol');
    var symbolValue = this._getSymbol(symbol);
    var statusEl = $('.status', referEl);

    this.broadcast('change:symbol', {
      symbol: symbolValue.policy.symbol
    });

    this.createOrder = new CreateOrder({
      referEl: referEl,
      symbolValue: _.clone(symbolValue),
      enable: !statusEl.hasClass('disabled'),
      rate: statusEl.attr('data-rate'),
      rateVal: statusEl.attr('data-rateval'),
      parent: this
    }).on('refresh', (e) => {
      referEl.trigger('click');
    }).on('destroy', (e) => {
      this.overlay && this.overlay.hide();
      this.createOrder && this.createOrder._resetTranslateScroll();
      $('.bd', this.el).removeClass('hidden');
      $('.J_OptionItem', this.el).removeClass('show');
    });

    $('.bd', this.el).addClass('hidden');

    // this.createOrder.setPos(referEl);
    // this.createOrder.setSymbol(symbolValue);
  }

  /**
   * 根据 symbol 获取品种的详细信息
   */
  _getSymbol(symbol) {
    var info = null;
    symbol = symbol.replace(/--/g, '.');

    this.symbolsList.forEach((item) => {
      if (item.quote.symbol === symbol) {
        info = item;
      }
    });

    return info;
  }

}
