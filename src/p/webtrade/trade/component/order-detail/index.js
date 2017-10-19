/**
 * 订单详情弹层
 */

'use strict';

require('./index.css');
var app = require('../../../../../app');
var Base = require('../../../../../app/base');
var tmpl = require('./index.ejs.html');
var Orderjs = require("../order");

export default class OrderDetail extends Base {
  constructor(config) {
    super(config);

    this._bind();
  }

  _bind() {
    var doc = $(document);
    //订阅之前先取消所有订阅
    this.unsubscribe('update:orderDetail');
    this.subscribe('update:orderDetail', this.update, this);
    this.subscribe('set:nowOrderDetail', this._update, this);

    // 更新浮动盈亏
    this.subscribe('get:floatMarginList', this._getFloatMarginList, this);

    doc.on('click', '.J_ActionDetailClosed', _.bind(this._action, this));
    doc.on('click', '.J_ActionDetailShared', _.bind(this._share, this));

    doc.on('click', '.J_Edit', $.proxy(this._edit, this));
    doc.on('click', '.J_ConfirmEdit', $.proxy(this._updateTakeProfit, this));

    doc.on('click', '.close-orderDetail', _.bind(this._closeOrderDetail, this))
  }

  _lazyBind() {
    var doc = $(document);
    var self = this;

    doc.on('click', hide);

    function hide(e) {
      var parentEl = $(e.target).parents('.J_OrderItem');
      if (parentEl.length > 0 && parentEl.attr('data-order') === self.ticket) {
        return;
      }

      self.destroy();
      doc.off('click', hide);
    }
  }

  /**
   * 更新需要展示的订单
   */
  update(e) {
    this.destroy();
    if (!e.order) {
      return;
    }

    this.order = e.order;
    this._lazyBind();
    this.ticket = e.order.ticket;

    this.needUpdateFloat = e.order.status === 'open';

    var order = e.order;

    if (e.order.status !== 'pending') {
      var profit = (parseFloat(order.profit) + parseFloat(order.swap) - parseFloat(order.commission)).toFixed(2);

      order = _.extend(order, this._formatFloatMargin(parseFloat(profit)));
    }

    this.ticket = e.order.ticket;
    this.broadcast('show:sidebar:ticket');
    this.el = this.renderTo(tmpl, e.order, this.containerEl);
    this._checkStatus(e.close);
  }

  _checkStatus(status) {
    if ( status ) {
      var itemEl = $('.J_ActionDetailClosed', this.containerEl);
      itemEl.addClass('close').text('休市');
      itemEl.parents('.hd').find('.J_Edit').addClass('close');
    }
  }

  _update(e) {
    if( e.order ) {
      this.update(e);
      this.broadcast('set:overlayPosition', 'hide');
    }
  }

  /**
   * 平仓
   */
  
  _action(e) {
    e.preventDefault();
    e.stopPropagation();
    this.broadcast('set:orderDetailAction', this.order)
  }

  _share(e) {
    e.preventDefault();
    e.stopPropagation();
    this.broadcast('update:orderShare', this.order)
  }

  _formatFloatMargin(profit) {
    profit = parseFloat(profit).toFixed(2).toString();
    return {
      profitInt: profit.substring(0, profit.indexOf('.')),
      profitFloat: Math.abs(parseFloat(profit) - parseInt(profit)).toFixed(2).slice(2)
    }
  }

  _getFloatMarginList(floatList) {
    if (this.needUpdateFloat && floatList[this.ticket]) {
      var floatMargin = this._formatFloatMargin(floatList[this.ticket]);

      $('.J_Int', this.el).text(floatMargin.profitInt);
      $('.J_Float', this.el).text('.' + floatMargin.profitFloat);
    }
  }


  _edit(e, triggerByChart) {
    var curEl = $(e.currentTarget);
    var parentEl = curEl.parent();
    var siblingsEl = parentEl.siblings('.edit-model');

    if( curEl.hasClass('close') ) {
      return;
    }

    if (triggerByChart) {
      e.stopPropagation();
    }

    parentEl.hide();
    siblingsEl.addClass('active');
    $('input', siblingsEl).focus().val(parentEl.text().trim());
  }

  _updateTakeProfit(e) {
    this.broadcast('set:orderDetailTakeProfit', e);
  }

  _closeOrderDetail() {
    // 关闭订单调到option列表
    var tabNavEls = $('#J_SidebarInner .tab-nav');
    var optionEl = $(tabNavEls[1]);
    optionEl.trigger('click');
    this.broadcast('close:orderDetail');
  }

  destroy() {
    this.el && this.el.remove();
  }

}