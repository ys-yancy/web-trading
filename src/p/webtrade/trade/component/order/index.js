/**
 * 当前交易订单
 */

'use strict';

require('./index.css');

var Core = require('../../../../../app/core');
var app = require('../../../../../app');
var util = require('../../../../../app/util');
var config = require('../../../../../app/config');
var Overlay = require('../../../../../common/overlay');
var Drag = require('../../../../../common/drag');
var OrderShare = require('../order-share');
var UpdateOrder = require('./update');
var Dialog = require('./dialog');
var tmpl = require('./index.ejs.html');
var gendanListTmpl = require('./gendanList.ejs.html');
var profit = {};


export default class Order extends Core {
  constructor(config) {
    super(config);

    this.profit = {};
    this.symbols = [];
    this.curOrderPrice = {};

    this._bind();
    this.updateOrder = new UpdateOrder();
    this.orderShare = new OrderShare();
    new Drag(this.el.parent());
  }

  _bind() {
    this.subscribe('clear:selfOrderLine', this._clearSelfOrderLine, this);

    // 由于在获取账户信息时已经获取订单及其盈亏，因此无需计算
    // 获取交易订单
    this.subscribe('get:orderList', this._getOrderList, this);

    // 更新价格
    this.subscribe('update:curOrderPrice', this._updateCurOrderPrice, this);

    // 获取浮动盈亏
    this.subscribe('get:floatMarginList', this._getFloatMarginList, this);

    // 详情平仓
    this.subscribe('set:orderDetailAction', this._orderDetailActionProxy, this);
    // 详情设置止盈
    this.subscribe('set:orderDetailTakeProfit', this._setOrderDetailTakeProfit, this);

    // 修改遮罩宽度
    this.subscribe('set:overlayPosition', this._setOverlayPosition, this);

    this.el.on('click', '.J_SortType', $.proxy(this._sort, this));
    this.el.on('click', 'thead td', $.proxy(this.sortControls, this));

    this.el.on('click', '.J_Action', $.proxy(this._action, this));

    this.el.on('click', '.J_Share', $.proxy(this._share, this))

    this.el.on('click', '.J_ResetSort', $.proxy(this._resetSort, this));

    // 修改止盈止损价格
    this.el.on('click', '.J_Edit', $.proxy(this._edit, this));
    this.el.on('click', '.J_ConfirmEdit', $.proxy(this._confirmEdit, this));

    // 切换蜡烛图
    this.el.on('click', '.J_OrderItem', (e) => {
      e.stopPropagation();
      var curEl = $(e.currentTarget);
      var symbol = curEl.attr('data-symbol');
      var order = curEl.attr('data-order');
      var order = this.getOrderById(order);

      if (order === this.curOrder) {
        this._isEmitOverlay(e) && this.overlay.toggleShow(curEl);
        return;
      }

      this._isEmitOverlay(e) && this.overlay.show(curEl);

      this.curOrder = order;

      // 隐藏其他列的编辑模式
      curEl.siblings().find('.edit-model.active').each((index, item) => {
        var curEl = $(item);
        curEl.removeClass('active').prev().show();
        this.hideError(curEl);
      });

      this.curEl = curEl;
      this.currentOrder = order;
      var close = $('.J_Action', curEl).hasClass('close');

      this.broadcast('change:symbol', {
        symbol: symbol,
        order: order,
        close: close || order.status === 'pending'
      });

      if (!this.chart) {
        this.chart = app.get('chart');

        this.chart.on('close:order', (e) => {
          $('.J_Action', this.curEl).trigger('click');
        }, this);

        this.chart.on('remove:stoploss', this._removeStoploss, this);
        this.chart.on('remove:takeprofit', this._removeTakeprofit, this);
        this.chart.on('update:stoploss', this._updateStoploss, this);
        this.chart.on('update:takeprofit', this._updateTakeprofit, this);
        this.chart.on('double:order', this._doubleOrder, this);
        this.chart.on('reverse:order', this._reverseOrder, this);
      }

      setTimeout(() => {
        this.orderLine = this.chart.setOrderLine(order.openPrice, close, order.profit, order.profit > 0);

        if (parseFloat(order.stopLoss)) {
          this.stoplossLine = this.chart.setStoplossLine(order.stopLoss);
        }

        if (parseFloat(order.takeProfit)) {
          this.takeprofitLine = this.chart.setTakeprofitLine(order.takeProfit);
        }
      }, 30);

      this.broadcast('update:orderDetail', { 
        symbol: symbol,
        order: order, 
        close: close || order.status === 'pending'
      });
      
    });

    $(document).on('click', (e) => {
      var targetEl = $(e.toElement || e.relatedTarget || e.target);
      if ( (targetEl.parents('#J_OrderTab').length <= 0 && !targetEl.hasClass('ticket')) || (targetEl.hasClass('tab-nav') && targetEl.parents('#J_OrderTab').length > 0 ) ) {
        this.overlay && this.overlay.hide();
        if (!targetEl.hasClass('ticket')) {
           this.curOrder = null;
        } 
      }
    })

    // 更新价格
    // this.subscribe('stomp:price:update', (e) => {
    //   if (this.symbols.indexOf(e.symbol) !== -1) {
    //     this._updatePrice(e);
    //   }
    // }, this);
      
  }

  _removeTakeprofit(e) {
    if (!e.ticket || e.close) {
      return;
    }
    var curEl = $('.J_OrderItem[data-order=' + e.ticket + ']', this.el);
    $('.J_ConfirmEdit[data-type="profit"]', curEl).trigger('click', [true, '0.00']);
  }

  _removeStoploss(e) {
    if (!e.ticket || e.close) {
      return;
    }
    var curEl = $('.J_OrderItem[data-order=' + e.ticket + ']', this.el);
    $('.J_ConfirmEdit[data-type="stoploss"]', curEl).trigger('click', [true, '0.00']);
  }

  _updateTakeprofit(e) {
    if (e.close) {
      return;
    }

    var curEl = $('.J_OrderItem[data-order=' + e.ticket + ']', this.el);
    var editTdEl = $('.take-profit', curEl);
    var editEl = $('.J_Edit', editTdEl);
    var inputEl = $('input', editTdEl);
    var order = this.getOrderById(e.ticket);

    this._looseProfitValidate(e.price, order, inputEl.parent()).then(() => {
      editEl.trigger('click', [true]);

      var minQuoteUnit = order.mini_quote_unit;

      minQuoteUnit = util.getMinQuoteUnit(minQuoteUnit);
      try {
        e.price = e.price.toFixed(minQuoteUnit);
      } catch (e) {}

      inputEl.val(e.price);
      this.takeprofitLine.setText('止盈：' + e.price);
    }, () => {
      if (parseFloat(order.takeProfit)) {
        this.takeprofitLine.setPrice(order.takeProfit);
      }
    });
  }

  _updateStoploss(e) {
    if (e.close) {
      return;
    }
    var curEl = $('.J_OrderItem[data-order=' + e.ticket + ']', this.el);
    var editTdEl = $('.stop-loss', curEl);
    var editEl = $('.J_Edit', editTdEl);
    var inputEl = $('input', editTdEl);
    var order = this.getOrderById(e.ticket);

    this._looseLossValidate(e.price, order, inputEl.parent()).then(() => {
      editEl.trigger('click', [true]);

      var minQuoteUnit = order.mini_quote_unit;

      minQuoteUnit = util.getMinQuoteUnit(minQuoteUnit);
      try {
        e.price = e.price.toFixed(minQuoteUnit);
      } catch (e) {}

      inputEl.val(e.price);
      this.stoplossLine.setText('止损：' + e.price);
    }, () => {
      this.stoplossLine.setPrice(order.stopLoss);
    });
  }

  _doubleOrder(e) {
    if (e.close) {
      return;
    }
    var order = this.getOrderById(e.ticket);

    this._getOrderParam(order).then((params) => {
      var data = {
        access_token: Cookie.get('token'),
        symbol: order.symbol,
        ui: 4,
        slippage: order.slippage,
        volume: order.volume * 2,
        takeprofit: order.takeProfit,
        stoploss: order.stopLoss,
        type: order.cmd
      };

      data = _.extend(data, params);

      return this._order(data);
    });
  }

  _order(data) {
    var accountType = this.isDemo() ? 'demo' : 'real';
    if (accountType === 'demo') {
      return this._submitOrder(data, accountType);
    } else {
      return this.getRealToken().then((realToken) => {
        data.real_token = realToken;

        return this._submitOrder(data, accountType);
      });
    }
  }

  _submitOrder(params, accountType) {

    return this.ajax({
      url: '/v1/order/open/' + accountType,
      data: params,
      type: 'post'
    }).then((data) => {
      app.success('下单成功');
      this.broadcast('update:account', { fresh: true });
    }, (data) => {
      app.error(data.message);
    });
  }

  _reverseOrder(e) {
    if (e.close) {
      return;
    }
    var order = this.getOrderById(e.ticket);
    var itemEl = $('.J_OrderItem[data-order=' + e.ticket + ']', this.el);
    var actionEl = $('.J_Action', itemEl).trigger('click', [true]);

    this.on('reverse:success', (e) => {

      this._getOrderParam(order, true).then((params) => {
        var data = {
          access_token: Cookie.get('token'),
          symbol: order.symbol,
          ui: 4,
          slippage: order.slippage,
          volume: order.volume,
          takeprofit: 0,
          stoploss: 0,
          type: order.cmd
        };

        data = _.extend(data, params);

        return this._order(data);
      });

      this.off('reverse:success');
    });
  }

  _getOrderParam(order, reverse) {
    return new Promise((resolve, reject) => {
      var guadan = order.status === 'pending';
      var up = order.cmd.indexOf('buy') !== -1 ? true : false

      if (guadan && !reverse) {
        resolve({ openprice: order.openPrice });
      } else {
        this.getCurrentPrice(order.symbol, true).then((data) => {
          if (!reverse) {
            if (up) {
              resolve({ openprice: data.askPrice });
            } else {
              resolve({ openprice: data.bidPrice });
            }
          } else {
            up = !up;

            if (guadan) {
              var price = (data.askPrice + data.bidPrice) / 2;

              if (up) {
                type = params.openprice < price ? 'BUY LIMIT' : 'BUY STOP';
              } else {
                type = params.openprice > price ? 'SELL LIMIT' : 'SELL STOP';
              }

              resolve({
                type: type,
                openprice: order.openPrice
              });
            } else {
              resolve({
                type: up ? 'BUY' : 'SELL',
                openprice: up ? data.askPrice : data.bidPrice
              });
            }
          }
        });
      }
    });
  }

  _getPrice(order) {
    return new Promise((resolve, reject) => {
      var guadan = order.status === 'pending';
      var up = order.cmd.indexOf('buy') !== -1 ? true : false;

      if (guadan) {
        resolve(order.openPrice);
      } else {
        this.getCurrentPrice(order.symbol, true).then((data) => {
          if (up) {
            resolve(data.askPrice);
          } else {
            resolve(data.bidPrice);
          }
        });
      }
    });
  }

  destroyLine() {
    try {
      this.takeprofitLine && this.takeprofitLine.remove();
      this.stoplossLine && this.stoplossLine.remove();
    } catch (e) {
      console.log(e);
    }
  }

  // 分享订单
  _share(e) {
    var curEl = $(e.currentTarget);
    var id = curEl.attr('data-id');
    var order = this.getOrderById(id);
    this.broadcast('update:orderShare', order);
  }

  /**
   * @ 详情平仓
   */
  _orderDetailActionProxy(order) {
    var ticketId = order.ticket;
    var actionEl = $('.J_Action[data-id='+ ticketId +']');
    actionEl.trigger('click');
  }

  // @todo 历史订单添加数据
  _action(e, reverse) {
    var curEl = $(e.currentTarget);
    var id = curEl.attr('data-id');
    var order = this.getOrderById(id);
    var self = this;

    // 当前休市
    if (curEl.hasClass('close')) {
      return;
    }

    // 删除挂单
    if (curEl.hasClass('del')) {

      // 一键删除
      if (app.oneKeyDel() || reverse) {
        this._delGuadan(order.ticket).then(() => {
          close();

          if (reverse) {
            this.fire('reverse:success');
          }
        });

        return;
      }

      this.dialog && this.dialog.destroy();

      // 非一键删除
      // var dialog = new Dialog({
      //   order: order,
      //   referEl: curEl//.parent()
      // });
      // dialog.on('confirm', (e) => {
      //   if (e.oneKeyDel) {
      //     app.oneKeyDel(true);
      //   }
      //   this._delGuadan(order.ticket).then(() => {
      //     close();
      //     dialog.close();
      //   });
      // });

      // this.dialog = dialog;
      
      this._delGuadan(order.ticket).then(() => {
        close();
        app.success('删除成功');
        // dialog.close();
      }); 
      
    } else {
      // 平仓
      if (app.oneKeyClose() || reverse) {
        this._closeOrder(order).then(() => {
          close();
          if (reverse) {
            this.fire('reverse:success');
          }
        });
        return;
      }

      this.getCurrentPrice(order.symbol).then((price) => {
        var cloneOrder = _.clone(order);
        cloneOrder.price = price;
        cloneOrder.profit = profit[order.ticket];

        this.dialog && this.dialog.destroy();

        // var dialog = new Dialog({
        //   order: cloneOrder,
        //   className: 'order-close',
        //   type: 'close',
        //   referEl: curEl //.parent()
        // });

        // dialog.on('confirm', (e) => {
        //   if (e.oneKeyDel) {
        //     app.oneKeyClose(true);
        //   }

        //   this._closeOrder(order).then(() => {
        //     close();
        //     dialog.close();
        //     app.success('平仓成功');
        //   });
        // });
        // this.dialog = dialog;
        this._closeOrder(order).then(() => {
          close();
          // dialog.close();
          app.success('平仓成功');
        });
      });
    }

    function close() {
      curEl.parents('tr').remove();
      self.orderLine = null;
      self.stoplossLine = null;
      self.takeprofitLine = null;
      self.broadcast('update:account', {
        fresh: true
      });
      self.broadcast('update:orderHistory', {
        fresh: true
      });

      self.broadcast('change:symbol', {
        symbol: order.symbol
      });
    }
  }

  _edit(e, triggerByChart) {
    var curEl = $(e.currentTarget);
    var parentEl = curEl.parent();
    var siblingsEl = parentEl.siblings('.edit-model');

    if(curEl.hasClass('close')) {
      return;
    }

    if (triggerByChart) {
      e.stopPropagation();
    }

    parentEl.hide();
    siblingsEl.addClass('active');
    $('input', siblingsEl).focus().val(parentEl.text().trim());
  }
  //
  _setOrderDetailTakeProfit(e) {
    this._confirmEdit(e);
  }

  _confirmEdit(e, fromChart, fromChartVal) {
    var curEl = $(e.currentTarget);
    var type = curEl.attr('data-type');
    var orderId = curEl.parents('.J_OrderItem').attr('data-order');
    var parentEl = curEl.parent().parent();
    var parentClass = parentEl.attr("class").split(" ")[0];
    parentEl = $("."+orderId+" ."+parentClass+" .edit-model");

    var order = this.getOrderById(orderId);
    var up = order.cmd.indexOf('buy') !== -1 ? true : false;

    e.preventDefault();

    var val = curEl.siblings('input').val();
    var prev = parentEl.siblings('p').text().trim();

    if (fromChart) {
      val = fromChartVal;
    }

    if (!val && !fromChart) {
      // this.showError(parentEl, '不能为空');
      this.hideError(parentEl);
      success(parentEl, val);
      return;
    }

    // 如果修改前后两个值一致，则恢复
    if (prev == val) {
      this.hideError(parentEl);
      success(parentEl, val);
      return;
    }

    var getPrice = this.getCurrentPrice(order.symbol, true);
    var getSymbol = this.getOption([order.symbol]);

    // 获取价格和品种信息
    Promise.all([getPrice, getSymbol]).then((values) => {
      var prices = values[0];
      var symbolValue = values[1][0];
      var validator;
      var isProfit = true;

      // 止盈
      if (type === 'profit') {
        validator = this._profitValidate(val, parentEl, up, order, symbolValue, prices);
      } else {
        validator = this._lossValidate(val, parentEl, up, order, symbolValue, prices);
        isProfit = false;
      }

      if (!validator) {
        return;
      }

      // 获取参数
      var params = this._getParams(order, symbolValue, isProfit, val);

      if (order.status !== 'pending') {
        params.openPrice = up ? prices.ask_price[0] : prices.bid_price[0];
      }

      // this._showLoad(curEl);



      this._getToken().then((realToken) => {
        if (realToken) {
          params.real_token = realToken
        }

        return this.ajax({
          url: '/v1/order/' + order.ticket,
          data: params,
          type: 'put'
        }).then((data) => {
          app.success('修改成功');
          var minUnit;

          try {
            minUnit = symbolValue.policy.min_quote_unit.split('.')[1].split('').length;
          } catch (e) {
            minUnit = symbolValue.policy.min_quote_unit;
          }
          success(parentEl, val, true, minUnit);
          this.updateOrderById(order.ticket, data.data);

          this._updateLine(data.data);

        }, (e) => {
          console.log(e);
        });
      });
    });


    function success(parentEl, val, isShowEdit, minUnit) {

      var siblingsEl = parentEl.siblings('p');
      siblingsEl.show();
      parentEl.removeClass('active');

      if (isShowEdit) {
        if (parseFloat(val)) {
          val = Number(val).toFixed(minUnit);
        }
        val = parseFloat(val) ? val : '点此设置';
        siblingsEl.html( '<span class="J_Edit">'+ val +'</span>');
      }
    }
  }

  _updateLine(data) {
    if (parseFloat(data.takeProfit)) {
      if (this.takeprofitLine) {
        this.takeprofitLine
          .setPrice(data.takeProfit)
          .setText('止盈：' + data.takeProfit);
      } else {
        this.takeprofitLine = this.chart.setTakeprofitLine(data.takeProfit);
      }
    } else {
      this.takeprofitLine && this.takeprofitLine.remove();
    }

    if (parseFloat(data.stopLoss)) {
      if (this.stoplossLine) {
        this.stoplossLine
          .setPrice(data.stopLoss)
          .setText('止损：' + data.stopLoss);
      } else {
        this.stoplossLine = this.chart.setStoplossLine(data.stopLoss);
      }
    } else {
      this.stoplossLine && this.stoplossLine.remove();
    }
  }

  /**
   * 获取参数
   */
  _getParams(order, symbolValue, isProfit, val) {
    var params = {
      openPrice: order.openPrice,
      takeprofit: order.takeProfit,
      stoploss: order.stopLoss,
      volume: order.volume,
      type: order.cmd
    };

    if (isProfit) {
      params.takeprofit = val;
    } else {
      params.stoploss = val;
    }

    var minUnit;

    try {
      minUnit = symbolValue.policy.min_quote_unit.split('.')[1].split('').length;
    } catch (e) {
      minUnit = symbolValue.policy.min_quote_unit;
    }

    var sl = parseFloat(params.stoploss).toFixed(minUnit),
      tp = parseFloat(params.takeprofit).toFixed(minUnit),
      data = {
        access_token: Cookie.get('token'),
        stopLoss: sl,
        takeProfit: tp,
        expiration: ""
      };

    data = _.extend(params, data);

    return data;
  }

  _isEmitOverlay(e) {
    var isEmitOverlay =
        $(e.target).hasClass('J_TakeprofitNumber') || 
        $(e.target).hasClass('J_StoplossNumber') || 
        $(e.target).hasClass('J_ConfirmEdit') ||
        $(e.target).hasClass('J_Action') || 
        $(e.target).hasClass('J_Edit');

    return !isEmitOverlay
  }

  _del() {

  }

  _getToken() {
    if (this.isDemo()) {
      return Promise.resolve();
    } else {
      return this.getRealToken();
    }
  }

  // 删除挂单
  _delGuadan(order) {
    return this._getToken().then((realToken) => {
      var data = {
        access_token: this.cookie.get('token')
      };

      if (realToken) {
        data.real_token = realToken
      }

      return this.ajax({
        url: '/v1/order/' + order,
        type: 'delete',
        data: data
      }).then(() => {
        this.removeOrderById(order.ticket);
      });
    });
  }

  _closeOrder(order) {
    var p;

    return this._getToken().then((realToken) => {

      // 获取品种当前价格
      return this.getCurrentPrice(order.symbol, true).then((prices) => {

        /**
         *  b)平仓时: 对于不同交易类型的订单, closeprice应该使用:
         *   i.买跌(SELL): closeprice = ask_price;
         *   ii.买涨(BUY): closeprice = bid_price;
         */
        if (order.cmd.toLowerCase().indexOf('buy') != -1) {
          var p = parseFloat(prices.bid_price[0]);
        } else {
          var p = parseFloat(prices.ask_price[0]);
        }

        return p;
      }).then((price) => {
        // 平仓
        var data = {
          access_token: this.cookie.get('token'),
          slippage: order.slippage,
          closeprice: price
        };

        if (realToken) {
          data.real_token = realToken;
        }

        return this.ajax({
          url: '/v1/order/close/' + order.ticket,
          type: 'post',
          data: data
        });
      }).then((data) => {

        return {
          profit: data.data.profit,
          price: data.data.closePrice
        };
      });
    });
  }


  getOrderById(id) {
    var order = null;

    this.normal.forEach((item) => {
      if (item.ticket === id) {
        order = item;
      }
    });

    if (!order) {
      this.guadan.forEach((item) => {
        if (item.ticket === id) {
          order = item;
        }
      });
    }

    if (!order) {
      this.gendan.forEach((item) => {
        if (item.ticket === id) {
          order = item;
        }
      });
    }

    return order;
  }

  updateOrderById(id, order) {
    var find = false;

    this.normal.forEach((item, index) => {
      if (item.ticket === id) {
        this.normal[index] = order;
      }
    });

    if (!order) {
      this.guadan.forEach((item, index) => {
        if (item.ticket === id) {
          this.guadan[index] = order;
        }
      });
    }
  }

  removeOrderById(id) {
    var index;
    this.normal.forEach((item, key) => {
      if (item.ticket === id) {
        index = key;
      }
    });

    if (index !== undefined) {
      this.normal.splice(index, 0);
      return;
    }

    this.guadan.forEach((item, key) => {
      if (item.ticket === id) {
        index = key;
      }
    });

    if (index !== undefined) {
      this.guadan.splice(index, 0);
    }
  }

  // 获取到订单
  _getOrderList(data) {
    var list = data.list;
    var tabEl = $('#J_OrderTab');
    var curEl = $('.tab-nav.active', tabEl);

    if (list.length === 0 && !tabEl.hasClass('hidden')) {
      if (curEl.index() == 0) {
        curEl.trigger('click');
      }
    }

    if (this.list && this.list.length == 0 && list == 1 && tabEl.hasClass('hidden')) {

      if (curEl.index() == 0) {
        curEl.trigger('click');
      }
    }

    this.list = list;



    // 区别普通订单和挂单订单
    var curFollowId;
    var gendanObj = {};
    var gendanList = [];
    var guadanList = [];
    var normalList = [];
    var symbols = [];
    var symbolType = {
      normal: {},
      guadan: {},
      gendan: {}
    };

    for (var i = 0, len = list.length; i < len; i++) {
      var item = list[i];

      // 跟单
      if (item.follow) {   
        var expert_id = item.expert_id;

        if ( gendanObj[expert_id] ) {
          gendanObj[expert_id].push(item);
        } else {
          gendanObj[expert_id] = [];
          gendanObj[expert_id].push({
            isTitle: true, 
            followName: item.follow_name, 
            followNum: item.follow_num,
            expert_id: expert_id
          });
          gendanObj[expert_id].push(item);
        }

        gendanList.push(item);

        if (item.status === 'pending') {
            if (!symbolType.guadan[item.symbol]) {
              symbolType.guadan[item.symbol] = [];
            }
            symbolType.guadan[item.symbol].push(item);
        } else {
            if (!symbolType.normal[item.symbol]) {
              symbolType.normal[item.symbol] = [];
            }

            symbolType.normal[item.symbol].push(item);
        }

      } else {

        if (item.status === 'pending') {
          guadanList.push(item);

          if (!symbolType.guadan[item.symbol]) {
            symbolType.guadan[item.symbol] = [];
          }

          symbolType.guadan[item.symbol].push(item);
        } else {
          normalList.push(item);

          if (!symbolType.normal[item.symbol]) {
            symbolType.normal[item.symbol] = [];
          }

          symbolType.normal[item.symbol].push(item);

        }
      }
      profit[item.ticket] = parseFloat(item.profit);
    }

    $('.J_OrderNum').text(list.length);
    this.normal = normalList;
    this.guadan = guadanList;
    this.gendan = gendanList;
    this.gendanObj = gendanObj;
    this.updateOrder.update(symbolType);
    // if (!this.hasLoad) {
    //   // console.log(this.normal)
    //   var normal = this.normal.sort(function(v1, v2) {
    //     return parseFloat(v1.profit) < parseFloat(v2.profit);
    //   });
    //   console.log(this.normal,normal);
    // }

    this.render(tmpl, {
      normal: normalList,
      guadan: guadanList,
      gendanLength: gendanList.length
    }, $('.tbody', this.el));

    this.renderTo(gendanListTmpl, {
      gendanObj: gendanObj
    }, $('.tbody', this.el));

    this._initOverlay();

    this._renderToUpdatePrice();
    // console.log(guadanList)
    this._checkStatus(data.symbols);

    // 保证排序不乱
    if (this.hasLoad) {

      var activeEl = $('.up-active', this.el);
      if (activeEl.length == 0) {
        return;
      }
      this._sort({
        currentTarget: activeEl
      }, true);
    } else {
      this.hasLoad = true;
    }


    this._interval();
  }

  // 渲染完更新价格 // 借助option列表刷新价格
  _renderToUpdatePrice() {
    var $els = $('.openTicket', this.el);
    $els.each((index, item) => {
      item = $(item);
      try{
        var symbol = item.attr('data-symbol');
        $('.openTicketPriceNum', item).text(this.curOrderPrice[symbol].ask_price)
        $('.openTicketPriceNum.up', item).text(this.curOrderPrice[symbol].bid_price)
      }catch(e){}
    })
  }

  _updateCurOrderPrice(options) {
    this.curOrderPrice[options.symbol] = options;
  }

  // 检查品种状态
  _checkStatus(symbols) {
    this.getSymbols(symbols).then((symbolsInfo) => {
      var account = app.proxy('account', 'getValue');
      symbolsInfo.forEach((item) => {
        this.checkStatus(item, account).then((status) => {
          if (status.type === 'close') {
            _.bind(setStatus, this)(item, 'close');
          }
        });
      });
    });

    function setStatus(item, status) {
      var itemEl,
          orderDetailActionEl,
          orderDetailWrapperEl = $('#J_OrderDetail');

      itemEl = $('.J_Action[data-symbol=' + item.policy.symbol.replace(/\./g, '--') + ']', this.el);
      orderDetailActionEl = $('.J_ActionDetailClosed', orderDetailWrapperEl);

      itemEl.addClass('close').text('休市');
      itemEl.parents('.J_OrderItem').find('.J_Edit').addClass('close');

      orderDetailActionEl && orderDetailActionEl.addClass('close').text('休市');
      orderDetailActionEl && orderDetailActionEl.parents('.hd').find('.J_Edit').addClass('close');
    }

  }

  // 获取浮动盈亏
  _getFloatMarginList(floatList) {
    var self = this;
    profit = floatList;

    $('.J_Formate', this.el).each(function(index, item) {
      item = $(item);

      var order = item.attr('data-order');
      try {
        var profit = floatList[order].toFixed(2);
        item.text(profit);

        if (profit < 0) {
          item.addClass('loss');
        } else {
          item.removeClass('loss');
        }

        self.profit[order] = parseFloat(profit);
      } catch (e) {
        // console.log(e);
      }
    });

    if (this.orderLine) {
      var profit = (floatList[this.currentOrder.ticket]).toFixed(2);
      this.orderLine.setText(profit);
      this.chart.setOrderLineColor(this.orderLine, profit > 0);
    }

    this._getFollowOrderFloatMarginList();
  }

  //获取跟单汇总浮动盈亏
  _getFollowOrderFloatMarginList() {
    var gendanTitleEls = $('.J_AllProfit', this.el);

    gendanTitleEls.each((index, item) => {
      item = $(item);
      var orderId = item.attr('data-id'),
          formateEls = $('.J_Formate[data-id='+ orderId +']', this.el),
          allProfit = 0;

      formateEls.each((index, el) => {
        el = $(el);
        var profit = el.text();
        profit = parseFloat(profit);
        allProfit += profit;
      })

      allProfit = allProfit.toFixed(2);

      item.text(allProfit);

      if (allProfit > 0) {
        item.addClass('up')
      } else {
        item.removeClass('up')
      }

    })
  }

  _clearSelfOrderLine() {
    if (this.orderLine) {
      this.orderLine = null;
    }
  }

  _resetSort(e) {
    $('.ticket-wrapper.J_SortType', this.el).trigger('click');
    $(e.currentTarget).hide();
  }

  sortControls(e) {
    var curEl = $(e.target);
    var childEl = curEl.children('div.J_SortType');
    if ( childEl.length ) {
      childEl.trigger('click');
    }
  }

  // 排序 不对跟单排序
  _sort(e, origin) {
    var curEl = $(e.currentTarget);
    var tdEl = curEl.parents('td');
    var tableEl = curEl.parents('table');
    var tbodyEl = $('tbody', tableEl);
    var theadEl = $('thead', tableEl);

    var type = tdEl.attr('data-type');
    var up = curEl.hasClass('up-active');

    if (origin) {
      this.sort(this.normal, type);
      this.sort(this.guadan, type);

      if (up) {
        this.normal = this.normal.reverse();
        this.guadan = this.guadan.reverse();
      }
      return;
    }

    $('.J_SortType', theadEl).removeClass('up-active down-active active');

    if (up) {
      curEl.addClass('down-active');
    } else {
      curEl.addClass('up-active');
    }
    curEl.addClass('active');
    this.sort(this.normal, type);
    this.sort(this.guadan, type);

    if (!up) {
      this.normal = this.normal.reverse();
      this.guadan = this.guadan.reverse();
    }

    this.render(tmpl, {
      normal: this.normal,
      guadan: this.guadan,
      gendanLength: this.gendan.length
        // showqr: getIfShowWXCodeWL()
    }, $('tbody', this.el));

    this.renderTo(gendanListTmpl, {
      gendanObj: this.gendanObj
    }, $('.tbody', this.el));

    $('.J_ResetSort', this.el).show();

    this._initOverlay();
    this._renderToUpdatePrice();
    setTimeout(() => {
      this._getFollowOrderFloatMarginList();
    }, 500)   
  }

  sort(list, key) {
    list.sort(this['_sort' + key.charAt(0).toUpperCase() + key.slice(1)]);
  }

  _sortId(val1, val2) {
    return parseInt(val1.ticket) - parseFloat(val2.ticket);
  }

  _sortSymbol(val1, val2) {
    return val1.symbol - val2.symbol;
  }

  _sortType(val1, val2) {
    return val1.cmd - val2.cmd;
  }

  _sortVolume(val1, val2) {
    return parseFloat(val1.volume) - parseFloat(val2.volume);
  }

  _sortProfit(val1, val2) {
    try {
      var v1 = profit[val1.ticket];
      var v2 = profit[val2.ticket];

      if (v1 !== undefined) {
        val1.profit = v1.toFixed(2);
      }

      if (v2 !== undefined) {
        val2.profit = v2.toFixed(2);
      }
    } catch (e) {

    }

    return parseFloat(val1.profit) - parseFloat(val2.profit);
  }

  _sortMargin(val1, val2) {
    return parseFloat(val1.margin) - parseFloat(val2.margin);
  }

  _profitValidate(val, parentEl, up, order, symbolValue, prices) {
    var minOpenPriceGap = symbolValue.policy.min_open_price_gap,
      pip = symbolValue.policy.pip,
      message,
      price;

    // 如果是open订单, 那么判断标准是 当前价格, 而不是 开仓价格
    if (order.status === 'open') {
      if (up) {
        price = prices.bidPrice || prices.bid_price[0];
      } else {
        price = prices.askPrice || prices.ask_price[0];
      }
    } else {
      price = order.openPrice;
    }

    val = parseFloat(val);

    if (Math.abs(price - val) < minOpenPriceGap * pip) {
      this.showError(parentEl, '最小价差小于' + minOpenPriceGap);
      return;
    }

    // if (submit) {
    if (up && val) {
      if (val < price) {
        message = '应高于' + (order.status === 'open' ? '当前' : '开仓') + '价格';
        this.showError(parentEl, message);
        return;
      }
    }

    if (!up && val) {
      if (val > price) {
        message = '应低于' + (order.status === 'open' ? '当前' : '开仓') + '价格';
        this.showError(parentEl, message);
        return;
      }
    }
    // }

    this.hideError(parentEl);

    return true;
  }

  _looseProfitValidate(val, order, parentEl) {
    return new Promise((resolve, reject) => {
      this.getCurrentPrice(order.symbol, true).then((prices) => {
        var up = order.cmd.indexOf('buy') !== -1 ? true : false;
        var price, message;

        // 如果是open订单, 那么判断标准是 当前价格, 而不是 开仓价格
        if (order.status === 'open') {
          if (up) {
            price = prices.bidPrice || prices.bid_price[0];
          } else {
            price = prices.askPrice || prices.ask_price[0];
          }
        } else {
          price = order.openPrice;
        }

        val = parseFloat(val);
        if (up && val) {
          if (val < price) {
            reject();
            message = '应高于' + (order.status === 'open' ? '当前' : '开仓') + '价格';
            this.showError(parentEl, message, true);
            return;
          }
        }

        if (!up && val) {
          if (val > price) {
            reject();

            message = '应低于' + (order.status === 'open' ? '当前' : '开仓') + '价格';
            this.showError(parentEl, message, true);
            return;
          }
        }

        resolve();
        this.hideError(parentEl);
        return;
      });
    });
  }

  _looseLossValidate(val, order, parentEl) {
    return new Promise((resolve, reject) => {
      this.getCurrentPrice(order.symbol, true).then((prices) => {
        var up = order.cmd.indexOf('buy') !== -1 ? true : false;
        var price, message;
        // 如果是open订单, 那么判断标准是 当前价格, 而不是 开仓价格
        if (order.status === 'open') {
          if (up) {
            price = prices.bidPrice || prices.bid_price[0];
          } else {
            price = prices.askPrice || prices.ask_price[0];
          }
        } else {
          price = order.openPrice;
        }

        val = parseFloat(val);

        if (up) {
          if (val > price) {
            reject();
            message = '应低于' + (order.status === 'open' ? '当前' : '开仓') + '价格';
            this.showError(parentEl, message, true);
            return;
          }
        } else {
          if (val < price) {
            reject();
            message = '应高于' + (order.status === 'open' ? '当前' : '开仓') + '价格';
            this.showError(parentEl, message, true);
            return;
          }
        }

        resolve();

        this.hideError(parentEl);
      });
    });
  }

  _validate() {
    // this.getSymbol
  }

  _lossValidate(val, parentEl, up, order, symbolValue, prices) {

    var price, minOpenPriceGap = symbolValue.policy.min_open_price_gap,
      pip = symbolValue.policy.pip,
      message;


    // 如果是open订单, 那么判断标准是 当前价格, 而不是 开仓价格
    if (order.status === 'open') {
      if (up) {
        price = prices.bidPrice || prices.bid_price[0];
      } else {
        price = prices.askPrice || prices.ask_price[0];
      }
    } else {
      price = order.openPrice;
    }

    val = parseFloat(val);

    if (Math.abs(price - val) < minOpenPriceGap * pip) {
      this.showError(parentEl, '最小价差小于' + minOpenPriceGap);
      return;
    }

    if (up) {
      if (val > price) {
        message = '应低于' + (order.status === 'open' ? '当前' : '开仓') + '价格';
        this.showError(parentEl, message);
        return;
      }
    } else {
      if (val < price) {
        message = '应高于' + (order.status === 'open' ? '当前' : '开仓') + '价格';
        this.showError(parentEl, message);
        return;
      }
    }

    this.hideError(parentEl);

    return true;
  }

  _setOverlayPosition(res) {
    if ( res === 'hide' ) {
      this.overlay && this.overlay.hide();
    } else {
      this.overlay.setWidth(res);
    }  
  }

  showError(wrapperEl, message, hide) {
    var errorEl = $('.err', wrapperEl);

    wrapperEl.addClass('error');

    if (hide) {
      setTimeout(() => {
        this.hideError(wrapperEl);
      }, 1000);
    }

    if (errorEl.length > 0) {
      $('.tooltip-inner', errorEl).text(message);
      return;
    }


    var html = `<div class="err">
                <div class="tooltip top" role="tooltip">
              <div class="tooltip-arrow"></div>
              <div class="tooltip-inner">${message}</div>
            </div>
            `;
    wrapperEl.append(html);
  }

  hideError(wrapperEl) {
    var errorEl = $('.err', wrapperEl);
    errorEl.remove();
  }

  _updateFloat() {
    var account = app.proxy('account', 'getValue');
    var symbols = [];

    this.list.forEach((item) => {
      if (symbols.indexOf(item.symbol) === -1) {
        symbols.push(item.symbol);
      }
    });

    this.symbols = symbols;
    var type = this.isDemo() ? 'demo' : 'real';

    // console.log(this.getFloatingProfit(account.account, this.list, symbols));

    this.getFloatingProfit(account, this.list, symbols).then((profit, floatOption, prices) => {
      var equity = parseFloat(account[type].balance) + parseFloat(profit);
      var freeMargin = equity - parseFloat(account[type].margin);
      var rate = account[type].margin === 0 ? '--' : ((equity / parseFloat(account[type].margin)) * 100).toFixed(2);
      var rate = rate === '--' ? '--' : parseFloat(rate);
      var ticket_num = this.list.length;
      var tmplData = {
        netDeposit: equity,
        freeMargin: freeMargin,
        profit: profit,
        rate: rate,
        type: type,
        balance: account[type].balance,
        ticketNum: ticket_num
      };

      // data[typeTag] = true;

      this.broadcast('get:accountData', tmplData);

      // data._toggleAccount();


      // this.bottomAccount.fire('get:realFloatMargin', floatOption);
    });
  }

  _interval() {
    this.timer = setTimeout(() => {
      this._updateFloat();
      this._interval();
    }, config.getInterval());
  }

  _initOverlay() {
    this.overlay = null;
    this.overlay = new Overlay({
      parentEl: $('.tbody', this.el),
      headerEl: $('thead', this.el)
    });
  }

  _updatePrice(e) {
    // try {
    //   var priceEls = $('.J_Price[data-symbol=' + symbol + ']');
    // } catch (e) {
    //   var priceEls = $('.J_Price[data-symbolname=' + symbol.replace(/\./g, '--') + ']');
    // }

    // $.each(priceEls, function(index, item) {
    //   item = $(item);
    //   try {
    //     var curprice = price.ask_price[0];
    //     if (item.attr('data-cmd') == 'up') {
    //       curprice = price.bid_price[0];
    //     }
    //     item.text(curprice);
    //   } catch (e) {}
    // });

  }
}