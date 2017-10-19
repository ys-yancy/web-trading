'use strict';

require('./index.css');
var Core = require('../../../../../app/core');
var app = require('../../../../../app');
var tmpl = require('./index.ejs.html');
var util = require('../../../../../app/util');

var Big = require('../../../../../lib/big');

var Attribute = require('../attribute');

export default class CreateOrder extends Core {
  constructor(config) {
    super(config);

    this._render().then(() => {
      this.setPos(this.referEl);
      this._bind();

      this._getVolume().then((volume) => {
        if (!volume) {
          return;
        }
        if (volume.maxVolume > 0 && volume.volume <= 0) {
          volume.volume = this.symbolValue.policy.min_vol;
        }

        $('#J_Volume').val(volume.volume);
        this.maxVolume = volume.maxVolume;

        return this._updateMargin(volume.volume);
      });
    });
  }

  _bind() {
    // 隐藏
    $(document).on('click', (e) => {
      var targetEl = $(e.toElement || e.relatedTarget || e.target);
      // console.log(this.el.find(targetEl))
      if (targetEl.parents('#J_Attribute').length > 0 || this.el.find(targetEl).length > 0 || targetEl.hasClass('create-order') || targetEl.parents('.create-order').length > 0) {
        return;
      }

      // 实时订单
      if (targetEl.parents('#ActualOrder').length > 0) {
        return;
      }

      // 先隐藏在销毁，不会那么突兀
      this.el.hide();
      this.destroy();
      $('.cushion').remove();
      this._resetTranslateScroll();
      
      // setTimeout(() => {
      //   this.destroy();
      // }, 500);
      

    });

    this.el.on('click', '.extra', (e) => {
      // this.el.toggleClass('hidden');
      // this._setPlaceholderHeight();
      this.destroy();
    });

    // 展开 & 查看属性
    this.el.on('click', '.J_Fold', _.bind(this._fold, this));
    this.el.on('click', '.J_More', _.bind(this._showAttrbute, this));

    // 增加 & 减少交易量
    this.el.on('click', '.J_Minus', _.bind(this._minus, this));
    this.el.on('click', '.J_Add', _.bind(this._add, this));
    this.volumeEl.bind('change paste keyup blur', (e) => {
      this._setVolume();
      // e.type === 'blur' && this.volumeEl.parent().removeClass('focus');
    }).on('focus', (e) => {
      this.volumeEl.parent().addClass('focus');
    })

    // 挂单
    this.el.on('click', '.J_Radio', _.bind(this._openGuadan, this));

    // 更新价格
    this.subscribe('stomp:price:update', (e) => {
      if (e.symbol === this.symbolValue.policy.symbol) {
        this._updatePrice(e);
      }
    }, this);

    var guadanPriceWrapperEl = $('.J_GuadanPriceWrapper', this.el);

    // 监听挂单价格
    this.guadanInputEl.bind('change keyup blur', _.bind(function() {
      var val = this.guadanInputEl.val();
      this._setGuadanPrice(val);

      if (val) {
        this.el.removeClass('open-guadan');
      } else {
        this.el.addClass('open-guadan');
      }
    }, this)).on('focus', (e) => {
      // guadanPriceWrapperEl.show();
    }).on('blur', (e) => {
      // guadanPriceWrapperEl.hide();
    });

    // 设置止盈 & 止损
    this.profitInputEl.bind('change keyup blur focus be:change', _.bind(function(e) {
      var val = this.profitInputEl.val();
      if (e.type === 'focus' && !val) {
        return;
      }

      this._setProfitPrice(val);

      // if (e.type === 'blur' || e.type === 'change') {

      if (!this.takeprofitLine && val) {
        this.takeprofitLine = this.chart.setTakeprofitLine(val)
      } else {
        if (this.takeprofitLine) {
          if (!val) {
            this.takeprofitLine.remove();
            this.takeprofitLine = null;
          } else {
            this.takeprofitLine
              .setText('止盈：' + val)
              .setPrice(val)
          }
        }
      }
      // }
    }, this));
    this.stoplossInputEl.bind('change keyup blur focus be:change', _.bind(function(e) {
      var val = this.stoplossInputEl.val();

      if (e.type === 'focus' && !val) {
        return;
      }
      this._setStoplossPrice(val);

      // if (e.type === 'blur' || e.type === 'change') {

      if (!this.stoplossLine && val) {
        this.stoplossLine = this.chart.setStoplossLine(val)
      } else {
        if (this.stoplossLine) {
          if (!val) {
            this.stoplossLine.remove();
            this.stoplossLine = null;
          } else {
            this.stoplossLine
              .setText('止损：' + val)
              .setPrice(val)
          }
        }
      }
      // }
    }, this));

    // 下单
    this.el.on('click', '.J_Btn', (e) => {
      var curEl = $(e.currentTarget);
      var up = curEl.hasClass('up');

      if (curEl.hasClass('disabled')) {
        return;
      }

      // 判断是否可以下单
      if (!this.status.type && this._validate(up)) {
        var params = this._getParams(up);

        this._addOrder(params, up, curEl);
      }
    });

    this.chart = app.get('chart');

    this.chart.on('remove:stoploss', this._removeStoploss, this);
    this.chart.on('remove:takeprofit', this._removeTakeprofit, this);
    this.chart.on('update:stoploss', this._updateStoploss, this);
    this.chart.on('update:takeprofit', this._updateTakeprofit, this);

    this.subscribe('resize:window', this.setPos, this);
  }

  _removeTakeprofit() {
    this._updateTakeprofit({ price: '' });
    this.destroyLine();
  }

  _removeStoploss() {
    this._updateStoploss({ price: '' });
    this.destroyLine();
  }

  _updateTakeprofit(e) {
    var minQuoteUnit = util.getMinQuoteUnit(this.symbolValue.policy.min_quote_unit);
    try {
      e.price = e.price.toFixed(minQuoteUnit);
    } catch (e) {}

    this.profitInputEl.val(e.price);
    this.profitInputEl.trigger('change');
  }

  _updateStoploss(e) {
    var minQuoteUnit = util.getMinQuoteUnit(this.symbolValue.policy.min_quote_unit);
    try {
      e.price = e.price.toFixed(minQuoteUnit);
    } catch (e) {}

    this.stoplossInputEl.val(e.price);;
    this.stoplossInputEl.trigger('change');
  }

  destroyLine() {
    try {
      this.takeprofitLine && this.takeprofitLine.remove();
      this.stoplossLine && this.stoplossLine.remove();
    } catch (e) {
      console.log(e);
    }
  }

  _fold(e) {

    // 原先为展开，现在要关闭
    // 同时将数据还原
    if (!this.el.hasClass('unfold')) {
      var radioEl = $('.J_Radio', this.el);
      if (radioEl.hasClass('active')) {
        radioEl.trigger('click');
      }

      this.guadanInputEl.val('');
      this.profitInputEl.val('');
      this.stoplossInputEl.val('');

      $('.J_Btn', this.el).removeClass('disabled');

      // 防止隐藏展开后，消失问题
      // this.unfoldAnim = true;
      // setTimeout(() => {
      //   this.unfoldAnim = false;
      // }, 500);
    }
    this.el.toggleClass('unfold');

    this._setPlaceholderHeight();
  }

  _setPlaceholderHeight() {
      // 获取高度有延迟
      this.placeholdEl.height(this.el.outerHeight() - this.referEl.height());
      this._setTranslateScroll(this.referEl);
  }

  _showAttrbute(e) {
    var curEl = $(e.target);
    this.attribute = new Attribute({
      symbolValue: this.symbolValue,
      referEl: this.referEl
    });
    $('.deta-leverage').text(curEl.siblings('.leverage').attr('data-leverage'));
  }

  _minus(e) {
    var curVal = parseFloat(this.volumeEl.val());
    var minVol = parseFloat(this.symbolValue.policy.min_vol);
    var pip = parseFloat(this.symbolValue.policy.min_vol);
    var val = Big(curVal).minus(pip);

    var volume = val < minVol ? curVal : val;

    this.volumeEl.val(volume);
    this._updateMargin(volume);
  }

  _add(e) {

    var curVal = parseFloat(this.volumeEl.val());
    var maxVol = parseFloat(this.symbolValue.policy.max_vol);
    var pip = parseFloat(this.symbolValue.policy.min_vol);
    var val = new Big(curVal).plus(pip);
    var volume = val > maxVol || parseFloat(this.maxVolume) < parseFloat(val) ? curVal : val;
    this.volumeEl.val(volume);
    this._updateMargin(volume);
  }

  _setVolume(submit) {
    var volume = this.volumeEl.val(),
      parentEl = this.volumeEl.parent(),
      minVolume = this.symbolValue.policy.min_vol,
      maxVolume = this.maxVolume,
      message;

    if (!volume) {
      this.showError(parentEl, '交易量不能为空');
      return;
    } else if (parseFloat(volume) < parseFloat(minVolume)) {
      message = '最小交易量' + minVolume;
      // this._showError(curEl, message);
      this.showError(parentEl, message);
      return;
    } else if (parseFloat(volume) > parseFloat(maxVolume)) {
      message = '超过最大可买';
      this.showError(parentEl, message);
      return;
    }

    if (!submit) {
      this._updateMargin(volume);
    }

    this.hideError(parentEl);

    return true;
  }

  _openGuadan(e) {
    var curEl = $(e.currentTarget);
    var parentEl = curEl.parent();
    var inputEl = $('input', parentEl);
    var btnEls = $('.J_Btn', this.el);

    if (curEl.hasClass('active')) {
      curEl.removeClass('active');
      inputEl.prop('disabled', true);
      inputEl.prop('placeholder', '');
      this.guadan = false;

      this.hideError(parentEl);
      btnEls.removeClass('disabled');
      this.el.removeClass('open-guadan');
      this.guadanInputEl.val('');

      this._updatePrice();
    } else {
      curEl.addClass('active');
      inputEl.prop('disabled', false);
      inputEl.prop('placeholder', '请输入挂单价格');
      this.guadan = true;

      this.el.addClass('open-guadan');
      if (!this.guadanInputEl.val()) {
        btnEls.addClass('disabled');
      }
    }
  }

  _setGuadanPrice(price) {
    price = price || this.guadanInputEl.val();
    var parentEl = this.guadanInputEl.parent();
    var minOpenPriceGap = parseFloat(this.symbolValue.policy.min_open_price_gap),
      pip = parseFloat(this.symbolValue.policy.pip),
      message = '最小差' + minOpenPriceGap + '点';

    if (!price) {
      this.showError(parentEl, '开仓价格不能为空');
      $('.J_Btn', this.el).addClass('disabled');
      return;
    } else if (this.guadan) {
      // 小于 10 个点差
      if (Math.abs(this.price - price) < minOpenPriceGap * pip) {
        if (price < this.price) {
          this.showError(parentEl, '开仓价格应该小于当前价格10个点');
        } else {
          this.showError(parentEl, '开仓价格应该大于当前价格10个点');
        }
        return;
      }
      // $('.J_Btn', this.el).addClass('disabled');
      // if (price < this.price) {
      //   $('.J_Btn.down', this.el).removeClass('disabled');
      // } else {
      //   $('.J_Btn.up', this.el).removeClass('disabled');
      // }

      $('.J_Btn', this.el).removeClass('disabled');

      this.hideError(parentEl);
    } else if ((Math.abs(this.price - price) < minOpenPriceGap * pip) && !this.guadan) {
      this.showError(parentEl, message);

      return;
    } else {
      this.hideError(parentEl);
      $('.J_Btn', this.el).removeClass('disabled');
    }

    this.profitInputEl.trigger('be:change');
    this.stoplossInputEl.trigger('be:change');
    try {
      var askPrice = this._substring(price);

      $('.J_AskPriceInt', this.el).text(askPrice.str);
      $('.J_AskPriceFloat', this.el).text(askPrice.substr);
      $('.J_BidPriceInt', this.el).text(askPrice.str);
      $('.J_BidPriceFloat', this.el).text(askPrice.substr);
    } catch (e) {}

    this._checkBtn();

    return true;
  }

  _setProfitPrice(val, submit, up) {
    val = val || this.profitInputEl.val();
    var curEl = this.profitInputEl,
      parentEl = curEl.parent();

    var type = this._checkFirst();
    if (type === 'stoploss') {
      if (this.bidPrice < val) {
        $('.J_Btn', this.el).addClass('disabled');
        $('.J_Btn.down').removeClass('disabled');
        this.mockUp = false;
      } else {
        $('.J_Btn', this.el).addClass('disabled');
        $('.J_Btn.up').removeClass('disabled');
        this.mockUp = true;
      }
    } else if (type === 'profit') {
      if (this.askPrice < val) {
        $('.J_Btn', this.el).addClass('disabled');
        $('.J_Btn.up').removeClass('disabled');
        this.mockUp = true;
      } else {
        $('.J_Btn', this.el).addClass('disabled');
        $('.J_Btn.down').removeClass('disabled');
        this.mockUp = false;
      }
    }

    if (!submit && $('.J_Btn.disabled').length === 1) {
      submit = true;
      var mockSubmit = true;
      up = $('.J_Btn.disabled').hasClass('down') ? true : false;
    }

    var minOpenPriceGap = this.symbolValue.policy.min_open_price_gap,
      pip = this.symbolValue.policy.pip,
      message,
      errMsg,
      price = this.guadan ? this.guadanInputEl.val() : (up ? this.askPrice : this.bidPrice);

    if (!submit) {
      this._checkBtn();
    }


    if (!val) {
      this.hideError(parentEl);
      this.takeProfit = 0;

      $('.J_Num', this.profitInputEl.parent()).text('0.00');
      return true;
    }


    if (!/^\d+(\.\d+)?$/.test(val)) {
      this.showError(parentEl, '目标价格必须为数字');
      return;
    }

    val = parseFloat(val);

    if (Math.abs(price - val) < minOpenPriceGap * pip) {
      this.showError(parentEl, '最小价差小于' + minOpenPriceGap);
      return;
    }


    if (submit) {
      if (up) {
        if (val < price) {
          errMsg = '应高于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
          this.showError(parentEl, errMsg);
          return;
        }
      }

      if (!up) {
        if (val > price) {
          errMsg = '应低于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
          this.showError(parentEl, errMsg);
          return;
        }
      }
    } else if (!this.guadan) {

      // 非挂单预测
      if (this.mockUp !== undefined) {
        if (this.mockUp) {
          if (val < price) {
            errMsg = '应高于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
            this.showError(parentEl, errMsg);
            return;
          }
        } else {
          if (val > price) {
            errMsg = '应低于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
            this.showError(parentEl, errMsg);
            return;
          }
        }
      }
    }

    // 计算浮动盈亏
    if (!submit) {

      this.takeProfit = parseFloat(val);
      if (!this.symbolValue) {
        return;
      }
      this._getFloatMoney();
    }

    if (mockSubmit) {
      this.takeProfit = parseFloat(val);
      // if (!this.symbolValue) {
      //   return;
      // }
      this._getFloatMoney();
    }


    this.hideError(parentEl);

    return true;
  }

  _checkFirst() {
    if (this.guadan) {
      return;
    }

    var stoploss = this.stoplossInputEl.val();
    var profit = this.profitInputEl.val();

    if (stoploss && profit) {
      return;
    }

    if (stoploss && !profit) {
      return 'stoploss';
    } else if (!stoploss && profit) {
      return 'profit';
    } else {
      $('.J_Btn', this.el).removeClass('disabled');
    }
  }

  _checkBtn() {
    var profit = parseFloat(this.profitInputEl.val());
    var stoploss = parseFloat(this.stoplossInputEl.val());
    var avaiable = { enable: false };

    // if (!(this.guadan && !this.guadanInputEl.val())) {
    //   // $('.J_Btn', this.el).removeClass('disabled');
    // }

    if (!profit || !stoploss) {
      return;
    }

    if (this.guadan) {
      var price = parseFloat(this.guadanInputEl.val());
      if (!price) {
        return;
      }

      if (price < profit && price > stoploss) {
        avaiable.enable = true;
        avaiable.type = 'up';
      } else if (price > profit && price < stoploss) {
        avaiable.enable = true;
        avaiable.type = 'down';
      }
    } else {
      if (profit > this.askPrice && stoploss < this.askPrice) {
        avaiable.enable = true;
        avaiable.type = 'up';
      } else if (profit < this.bidPrice && stoploss > this.bidPrice) {
        avaiable.enable = true;
        avaiable.type = 'down';
      }
    }

    if (avaiable.enable) {
      $('.J_Btn.' + avaiable.type, this.el).removeClass('disabled').siblings().addClass('disabled');
    } else {
      $('.J_Btn', this.el).addClass('disabled');
    }
  }

  _setStoplossPrice(val, submit, up) {

    var curEl = this.stoplossInputEl,
      parentEl = this.stoplossInputEl.parent();

    var type = this._checkFirst();
    if (type === 'stoploss') {
      if (this.bidPrice < val) {
        $('.J_Btn', this.el).addClass('disabled');
        $('.J_Btn.down').removeClass('disabled');
        this.mockUp = false;
      } else {
        $('.J_Btn', this.el).addClass('disabled');
        $('.J_Btn.up').removeClass('disabled');
        this.mockUp = true;
      }
    } else if (type === 'profit') {
      if (this.askPrice < val) {
        $('.J_Btn', this.el).addClass('disabled');
        $('.J_Btn.up').removeClass('disabled');
        this.mockUp = true;
      } else {
        $('.J_Btn', this.el).addClass('disabled');
        $('.J_Btn.down').removeClass('disabled');
        this.mockUp = false;
      }
    }

    if (!submit && $('.J_Btn.disabled').length === 1) {
      submit = true;
      var mockSubmit = true;
      up = $('.J_Btn.disabled').hasClass('down') ? true : false;
    }

    var minOpenPriceGap = this.symbolValue.policy.min_open_price_gap,
      pip = this.symbolValue.policy.pip,
      message,
      errMsg,
      price = this.guadan ? this.guadanInputEl.val() : (up ? this.askPrice : this.bidPrice);

    if (!submit) {
      this._checkBtn();
    }
    // // 如果是open订单, 那么判断标准是 当前价格, 而不是 开仓价格
    // if (this.edit && this.orderObject && this.orderObject.status === 'open') {
    //   if (up) {
    //     price = this.bidPrice;
    //   } else {
    //     price = this.askPrice;
    //   }
    // }

    // if (!val && !up && submit) {
    //     this._showError(curEl, '止损价格不能为空');

    //     return;
    // }

    if (!val) {
      this.hideError(parentEl);
      this.stopLoss = 0;
      $('.J_Num', this.stoplossInputEl.parent()).text('0.00');
      // this._checkBtn();
      return true;
    }

    if (!/^\d+(\.\d+)?$/.test(val)) {
      this.showError(parentEl, '止损价格必须为数字');
      return;
    }

    val = parseFloat(val);

    if (Math.abs(price - val) < minOpenPriceGap * pip) {
      this.showError(parentEl, '最小价差小于' + minOpenPriceGap);
      return;
    }

    if (submit) {
      if (up) {
        if (val > price) {
          errMsg = '应低于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
          this.showError(parentEl, errMsg);
          return;
        }
      }

      if (!up) {
        if (val < price) {
          errMsg = '应高于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
          this.showError(parentEl, errMsg);
          return;
        }
      }
    } else if (!this.guadan) {

      // 非挂单预测
      if (this.mockUp !== undefined) {
        if (this.mockUp) {
          if (val > price) {
            errMsg = '应低于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
            this.showError(parentEl, errMsg);
            return;
          }
        } else {
          if (val < price) {
            errMsg = '应高于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
            this.showError(parentEl, errMsg);
            return;
          }
        }
      }
    }

    // 计算浮动盈亏
    if (!submit) {

      // cmd = cmd || this.cmd;
      // // 需要先验证错误
      // if (cmd && cmd.indexOf('buy') != -1) {
      //   if (val > price) {
      //     errMsg = '应低于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
      //     this._showError(curEl, errMsg);
      //     return;
      //   }
      // }


      // if (cmd && cmd.indexOf('sell') != -1) {
      //   if (val < price) {
      //     errMsg = '应高于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
      //     this._showError(curEl, errMsg);
      //     return;
      //   }
      // }

      this.stopLoss = parseFloat(val);
      if (!this.symbolValue) {
        return;
      }
      this._getFloatMoney();

      // this._checkBtn();
    }

     if (mockSubmit) {
      this.stopLoss = parseFloat(val);
      // if (!this.symbolValue) {
      //   return;
      // }
      this._getFloatMoney();
    }

    this.hideError(parentEl);

    return true;
  }

  _validate(up) {
    if (this.guadan) {
      if (!this._setGuadanPrice()) {
        return;
      }
    }
    if (this._setVolume(true) &&
      this._setProfitPrice(this.profitInputEl.val(), true, up) &&
      this._setStoplossPrice(this.stoplossInputEl.val(), true, up)) {

      return true;
    }
  }

  /**
   * 获取下单参数
   */
  _getParams(up, cmd) {
    var type;
    var openPrice;

    // buy 使用ask_price, sell 使用bid_price, 这里存在价格为空的可能性, 需要处理
    // 非挂单
    if (!this.guadan) {
      if (up) {
        openPrice = this.askPrice;
      } else {
        openPrice = this.bidPrice;
      }
    }
    // 挂单使用用户输入的价格
    else {
      openPrice = $('#J_GuadanPrice').val();
    }

    var params = {
      openprice: openPrice, //$('#J_OpenPriceInput').val(),
      volume: $('#J_Volume').val(),
      takeprofit: $('#J_ProfitPrice').val() || 0,
      stoploss: $('#J_StoplossPrice').val() || 0
    };

    // if (cmd) {
    //   params.type = cmd;

    //   return params;
    // }

    // 非挂单
    if (!this.guadan) {
      type = up ? 'BUY' : 'SELL';
    } else {
      if (up) {
        type = params.openprice < this.price ? 'BUY LIMIT' : 'BUY STOP';
      } else {
        type = params.openprice > this.price ? 'SELL LIMIT' : 'SELL STOP';
      }
    }

    params.type = type;

    return params;
  }


  _addOrder(params, up, curEl) {
    var self = this,
      accountType = this.isDemo() ? 'demo' : 'real',
      slippage = parseFloat(this.symbolValue.policy.default_slippage) * parseFloat(this.symbolValue.policy.pip),
      data = {
        access_token: Cookie.get('token'),
        symbol: this.symbolValue.policy.symbol,
        ui: 4,
        slippage: slippage
      };

    data = _.extend(params, data);

    if (accountType === 'demo') {
      this._submitOrder(data, accountType, up, curEl);
    } else {

      /* 
       * protrading.html点击“买涨”、“买跌”及
       * order.html点击“立即平仓”后如果需要输入交易密码，
       * 那么输入交易密码后将不再继续进行下单或平仓操作，仅仅回到当前页面。
       */

      this.getRealToken().then((realToken) => {
        data.real_token = realToken;

        this._submitOrder(data, accountType, up, curEl);
      });
    }
  }

  _submitOrder(data, accountType, up, curEl) {
    var self = this;

    if (!this.guadan) {
      data.openprice = up ? this.askPrice : this.bidPrice;
    }

    var guadan = data.type === 'BUY' || data.type === 'SELL' ? false : true;

    this._showLoad(curEl);

    var params = data;

    this.ajax({
      url: '/v1/order/open/' + accountType,
      data: data,
      type: 'post'
    }).then((data) => {
      self.orderObject = data.data;
      data = data.data;

      // data.name = self.name;
      data.up = up;
      var minQuoteUnit = self.symbolValue.policy.min_quote_unit;

      try {
        data.minQuoteUnit = minQuoteUnit.split('.')[1].split('').length;
      } catch (e) {
        data.minQuoteUnit = minQuoteUnit;
      }
      data.guadan = guadan;

      app.success('下单成功', 1000);
      this.broadcast('update:account', { fresh: true });

      this._hideLoad();

      var className = up ? 'up' : 'down';
      var message = up ? '买涨成功' : '买跌成功';
      message = guadan ? '挂单成功' : message;

      var btnEl = $('.J_Btn.' + className, this.el);
      $('.title', btnEl).text(message);
      btnEl.addClass('success');
      btnEl.siblings().hide();

      this._setPlaceholderHeight();

      setTimeout(() => {
        this.fire('refresh');
      }, 1500);

    }, function(data) {
      // 统一在io里处理

      // new Toast('服务器出错了');
      self._hideLoad();
      app.error(data.message);
      // curEl.text(curEl.attr('data-name'));
    });
  }


  /**
   * 计算目标盈利与预期亏损
   */
  _getFloatMoney() {
    var self = this,
      volume, openPrice, takeProfit, stopLoss;

    volume = this.volumeEl.val();
    openPrice = this.guadanInputEl.val();
    stopLoss = this.stoplossInputEl.val();
    takeProfit = this.profitInputEl.val();


    this.calMoney(this.account, this.symbolValue, volume, openPrice, stopLoss, takeProfit).then((price) => {
      // 目标和止损金额是2位小数
      var fixed = 2;

      var profit = price.takeProfit.toFixed(fixed),
        loss = price.stopLoss.toFixed(fixed);

      if (!isNaN(profit)) {
        $('.J_Num', this.profitInputEl.parent()).text(profit);
      }
      if (!isNaN(loss)) {
        $('.J_Num', this.stoplossInputEl.parent()).text(loss);
      }

    });
  }

  // 更新价格
  _updatePrice(e) {
    var priceWrapEl = $('.J_Price', this.el);
    // 数据回填
    if (!e) {
      e = {
        askPrice: this.askPrice,
        bidPrice: this.bidPrice
      };
    }


    try {
      if (e.askPrice > this.askPrice || e.bidPrice >= this.bidPrice) {
        priceWrapEl.addClass('up');
      } else {
        priceWrapEl.removeClass('up');
      }

      this.askPrice = e.askPrice;
      this.bidPrice = e.bidPrice;
      this.price = (parseFloat(this.askPrice) + parseFloat(this.bidPrice)) / 2;



      $('.J_AskPrice', this.el).text(this.askPrice);
      $('.J_BidPrice', this.el).text(this.bidPrice);

      if (this.guadan) {
        return;
      }
      var askPrice = this._substring(e.askPrice);
      var bidPrice = this._substring(e.bidPrice);
      $('.J_AskPriceInt', this.el).text(askPrice.str);
      $('.J_AskPriceFloat', this.el).text(askPrice.substr);
      $('.J_BidPriceInt', this.el).text(bidPrice.str);
      $('.J_BidPriceFloat', this.el).text(bidPrice.substr);


    } catch (e) {}
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

  rePos() {
    this.setPos(this.referEl);
  }

  // 设置位置
  setPos(el) {
    var setwidth;
    var silderEl = $('.sidebar');
    var guadanEl = $('.guadan-wrapper');
    var referEl = el || this.referEl;
    var position = referEl.offset();
    var isMoreWidth = silderEl.hasClass('setMoreWidth');
    isMoreWidth ? guadanEl.addClass('max-width') : guadanEl.removeClass('max-width');
    setwidth = isMoreWidth ? 500 : 400;
    this.el.css({
      width: setwidth,
      left: position.left,
      top: position.top
    });

    this._setTranslateScroll(referEl);

    this.el.show();

    this.placeholdEl = $('<tr class="cushion"></tr>');
    
    if (!el) {
      this.destroy();
      return;
    }

    this.placeholdEl.height(this.el.outerHeight() - this.referEl.height());// - this.referEl.height()
    referEl.after(this.placeholdEl);
  }

  _setTranslateScroll(el) {
    var win = $(window);
    var referEl = el || this.referEl;
    var position = referEl.offset();
    var contentEl = referEl.parents('tbody');

    var winHeight = win.height();
    var curElHeight = this.el.outerHeight();
    var referElScrollTop = position.top;//+ referEl.height()

    var minusHeight = winHeight - ( curElHeight + referElScrollTop );
    minusHeight = this.oldTranslateY ? minusHeight + this.oldTranslateY : minusHeight;
    if ( minusHeight < 0 ) {
      var _translateY = minusHeight + 'px';
      contentEl.css({
        'transform': 'translateY('+ _translateY +')',
        '-ms-transform': 'translateY('+ _translateY +')',
        '-moz-transform': 'translateY('+ _translateY +')',
        '-webkit-transform': 'translateY('+ _translateY +')',
        '-o-transform': 'translateY('+ _translateY +')'
      });

      this.el.css({
        'transform': 'translateY('+ _translateY +')',
        '-ms-transform': 'translateY('+ _translateY +')',
        '-moz-transform': 'translateY('+ _translateY +')',
        '-webkit-transform': 'translateY('+ _translateY +')',
        '-o-transform': 'translateY('+ _translateY +')'
      });

      this.oldTranslateY = minusHeight;
    }
  }

  _resetTranslateScroll() {
    var contentEl = this.referEl.parents('tbody');
    contentEl.css({
      'transform': 'translateY(0)',
      '-ms-transform': 'translateY(0)',
      '-moz-transform': 'translateY(0)',
      '-webkit-transform': 'translateY(0)',
      '-o-transform': 'translateY(0)'
    });

    this.el.css({
      'transform': 'translateY(0)',
      '-ms-transform': 'translateY(0)',
      '-moz-transform': 'translateY(0)',
      '-webkit-transform': 'translateY(0)',
      '-o-transform': 'translateY(0)'
    });
  }

  _render() {

    // return this.getAccount().then((account) => {
    var account = app.proxy('account', 'getValue', true);
    return this.checkStatus(this.symbolValue, account.account).then((data) => {
      this.account = account.account;
      this.status = data;
      // console.log(data);

      $('#J_CreateOrder').remove(); // 防止产生多个

      var isHasFixedMargin = this.symbolValue.policy.margin_is_fixed == '1' ? true : false;
      var fixedMarginRatio = this.symbolValue.policy.fixed_margin_ratio;
      
      this.el = this.renderTo(tmpl, {
        symbolValue: this.symbolValue,
        status: data,
        prices: this._getPrices(),
        leverage: this._getLeverage(this.symbolValue, account.account),
        rate: this.rate,
        rateVal: this.rateVal,
        enable: this.enable,
        isHasFixedMargin: isHasFixedMargin,
        fixedMarginRatio: fixedMarginRatio
      }, $('body'));

      this.volumeEl = $('#J_Volume');
      this.guadanInputEl = $('#J_GuadanPrice');
      this.profitInputEl = $('#J_ProfitPrice');
      this.stoplossInputEl = $('#J_StoplossPrice');
    }).catch((e) => {
      console.log(e);
    });
    // });
  }

  _getPrices() {
    var prices = {};


    try {
      //  2017.5.31修改 ： createdOrder中bid_price和k线图中价格不一致, 所以用品种列表中的的价格作为createdOrder的价格
      var symbolName = this.symbolValue.quote.symbol;
      var itemEl = $('.J_OptionItem[data-symbol=' + symbolName + ']');
      var askPrice = $('.ask-price', itemEl).text().trim(),
          bidPrice = $('.bid-price', itemEl).text().trim();

      prices.askPrice = this._substring(askPrice);
      prices.bidPrice = this._substring(bidPrice);

      // prices.askPrice = this._substring(this.symbolValue.quote.ask_price[0]);
      // prices.bidPrice = this._substring(this.symbolValue.quote.bid_price[0]);
    } catch (e) {

      prices.askPrice = this._substring(this.symbolValue.quote.ask_price[0]);
      prices.bidPrice = this._substring(this.symbolValue.quote.bid_price[0]);
    }

    return prices;
  }

  // 获取交易量
  _getVolume() {
    return app.proxy('account', 'getVolume', this.symbolValue);
  }

  _updateMargin(volume) {
    return this._getCurPrice().then(() => {
      var account = app.proxy('account', 'getValue');

      return this.getMargin(this.openPrice, this.symbolValue, volume || parseFloat($('#J_volume').val() || 0), account).then((margin) => {
        var fixed = 2;
        margin = margin.toFixed(fixed);

        $('#J_VolumeMoney').text('$ ' + margin);
      });
    });

  }

  _getCurPrice() {
    return this.getCurrentPrice(this.symbolValue.policy.symbol, true).then((priceInfo) => {
      this.price = priceInfo.price;
      if (!priceInfo.ask_price || !priceInfo.bid_price) {
        this.openPrice = '--';

        return this.openPrice;
      }
      this.askPrice = priceInfo.ask_price[0];
      this.bidPrice = priceInfo.bid_price[0];

      this.openPrice = (+priceInfo.ask_price[0] + (+priceInfo.bid_price[0])) / 2;

      return this.openPrice;
    });
  }

  /**
   * 获取交易品种的交易杠杆 (实际上这段代码就是calMarginWithOpenPrice方法中的一部分)
   * symbol: 从2.2.2.4 接口获取的symbol对象
   * account: 从2.2.2.5 接口获取的account对象
   **/
  _getLeverage(symbol, account) {
    var type = this.isDemo() ? 'demo' : 'real';
    var max_leverage = this.isDemo() ? symbol.policy.demo_max_leverage : symbol.policy.real_max_leverage;
    var trading_leverage = account[type].leverage * symbol.policy.leverage_multiplier;
    max_leverage = parseFloat(max_leverage);
    trading_leverage = parseFloat(trading_leverage);

    trading_leverage = trading_leverage < max_leverage ? trading_leverage : max_leverage;

    return trading_leverage;
  }

  showError(wrapperEl, message) {
    var errorEl = $('.err', wrapperEl);

    wrapperEl.addClass('error');

    if (errorEl.length > 0) {
      errorEl.text(message);
      return;
    }

    wrapperEl.append('<div class="err">' + message + '</div>');
  }

  hideError(wrapperEl) {
    wrapperEl.removeClass('error');
  }

  _showLoad(curEl) {
    this.loadEl = curEl;

    // var txt = curEl.text();
    // curEl.attr('data-name', txt);
    // curEl.html('<span>处理中<span class="dialog-load"></span></span>');
    curEl.append('<div class="loading-wrapper"><span>处理中<span class="dialog-load"></span></span></div>')
  }

  _hideLoad() {
    // var name = this.loadEl.attr('data-name');
    // this.loadEl.text(name);
    $('.loading-wrapper', this.loadEl).remove();
  }

  destroy() {
    this.attribute && this.attribute.destroy();
    this.el && this.el.off('click');
    this.el && this.el.remove();

    this.destroyLine();

    this.volumeEl && this.volumeEl.unbind('change paste keyup blur');


    this.guadanInputEl && this.guadanInputEl.unbind('change keyup blur')

    // 设置止盈 & 止损
    this.profitInputEl && this.profitInputEl.unbind('change keyup blur be:change');
    this.stoplossInputEl && this.stoplossInputEl.unbind('change keyup blur be:change');
    this.chart && this.chart.off('remove:stoploss', this._removeStoploss, this);
    this.chart && this.chart.off('remove:takeprofit', this._removeTakeprofit, this);
    this.chart && this.chart.off('update:stoploss', this._updateStoploss, this);
    this.chart && this.chart.off('update:takeprofit', this._updateTakeprofit, this);
    this.placeholdEl && this.placeholdEl.remove();

    this.fire('destroy');

    this.unsubscribe('resize:window', this.setPos, this);
  }
}