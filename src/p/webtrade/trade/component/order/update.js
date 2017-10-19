'use strict';

var Core = require('../../../../../app/core');
var tmpl = require('./toast.ejs.html');
// require('object.values');



export default class UpdateOrder extends Core {
  constructor() {
    super();

    this.toastEl = $('#J_ToastWrapper');
    this._bind();
    // setTimeout(() => {
    //   this.symbolType.normal = {
    //     'SILVER_RMB_100': [{ ticket: 20102244 }]
    //   }
    //   this.broadcast('check:closed');
    // }, 10000)
  }

  _bind() {
    this.subscribe('stomp:price:update', (e) => {
      this.check(e);
    }, this);

    this.subscribe('check:closed', () => {

      this._orders(this.symbolType.guadan).forEach((order) => {
        this.shouldOpenOrder(order);
      });
      this._orders(this.symbolType.normal).forEach((order) => {
        this.shouldCloseOrder(order);
      });
    });

    this.toastEl.on('click', '.close', (e) => {
      var curEl = $(e.currentTarget);
      var parentEl = curEl.parent().parent();
      parentEl.fadeOut(.5);
      setTimeout(() => {
        parentEl.remove();
      }, 1 * 1000);
    });
  }

  _orders(symbolType) {
    var orders = [];

    for (var i in symbolType) {
      if (symbolType.hasOwnProperty(i)) {
        orders = orders.concat(symbolType[i]);
      }
    }

    return orders;
  }

  update(symbolType) {
    this.symbolType = symbolType;
  }

  check(e) {
    this._checkGuadan(e);
    this._checkNormal(e);
  }

  _checkNormal(e) {
    var normal = this.symbolType.normal;
    var orders = normal[e.symbol];

    if (!orders) {
      return;
    }

    orders.forEach((order) => {
        var stopLoss = parseFloat(order.stopLoss);
        var takeProfit = parseFloat(order.takeProfit);
        if (order.status == 'open') {
          if (order.cmd.indexOf('buy') != -1 && e.bidPrice) {
            if (stopLoss && e.bidPrice < stopLoss) {
              this.shouldCloseOrder(order);
            } else if (takeProfit && e.bidPrice > takeProfit) {
              this.shouldCloseOrder(order);
            }
          } else if (order.cmd.indexOf('sell') != -1 && e.askPrice) {
            if (stopLoss && e.askPrice > stopLoss) {
              this.shouldCloseOrder(order);
            } else if (takeProfit && e.askPrice < takeProfit) {
              this.shouldCloseOrder(order);
            }
          }
        }
    });
  }

  _checkGuadan(e) {
    var guadan = this.symbolType.guadan;
    var orders = guadan[e.symbol];

    if (!orders) {
      return;
    }

    orders.forEach((order) => {
      if (order.status == 'pending') {
        if (order.cmd == 'buy stop' && e.askPrice) {
          if (e.askPrice > order.openPrice) {
            this.shouldOpenOrder(order);
          }
        } else if (order.cmd == 'buy limit' && e.askPrice) {
          if (e.askPrice < order.openPrice) {
            this.shouldOpenOrder(order);
          }
        } else if (order.cmd == 'sell stop' && e.bidPrice) {
          if (e.bidPrice < order.openPrice) {
            this.shouldOpenOrder(order);
          }
        } else if (order.cmd == 'sell limit' && e.bidPrice) {
          if (e.bidPrice > order.openPrice) {
            this.shouldOpenOrder(order);
          }
        }
      }
    });
  }
  shouldOpenOrder(order) {
    var self = this;
    console.log(`check order ${order.ticket}`);
    // 如果正在检查，则不在检查
    if (this.queue[order.id]) {
      return;
    }
    this.queue[order.id] = true;

    this.ajax({
      url: '/v1/order/' + order.ticket + '?access_token=' + this.cookie.get('token')
    }).then((data) => {
      var curOrder = data.data;
      self.queue[order.id] = false;
      if (curOrder.status === 'open') {
        console.log(`订单：${order.ticket} 已开仓`);
        this._showTips(curOrder, 'open');
        this._updateAccount();
      } else if (curOrder.status === 'rejected') {
        console.log(`订单：${order.ticket} 挂单 rejected`);
        this._showTips(curOrder, 'rejected');
        this._updateAccount();
      }

      console.log('rate < 100 检查，详细数据：', data);
    });
  }

  shouldCloseOrder(order) {
    var self = this;
    console.log(`check order ${order.ticket}`);
    // 如果正在检查，则不在检查
    if (this.queue[order.id]) {
      return;
    }
    this.queue[order.id] = true;

    this.ajax({
      url: '/v1/order/' + order.ticket + '?access_token=' + this.cookie.get('token')
    }).then((data) => {
      var curOrder = data.data;
      self.queue[order.id] = false;
      if (curOrder.status === 'closed' || curOrder.status == 'margin_check') {
        console.log(`订单：${order.ticket} 被平仓`);

        this._showTips(curOrder, 'closed');

        this._updateAccount();
      }
      else if (curOrder.status == 'margin_check') {
        console.log(`订单：${order.ticket} 被平仓`);

        this._showTips(curOrder, 'margin_check');

        this._updateAccount();
      }
    });
  }

  _showTips(order, type) {
    var el = this.renderTo(tmpl, {
      order: order,
      type: type
    }, this.toastEl);
    // setTimeout(() => {
    //   el.fadeOut(1, () => {
    //     el.remove();
    //   });
    // }, 3 * 1000);
  }

  _updateAccount() {
    this.broadcast('update:account', {
      fresh: true
    });
  }

  defaults() {
    return {
      queue: {},
      symbolType: {
        normal: {},
        guadan: {}
      }
    };
  }
}
