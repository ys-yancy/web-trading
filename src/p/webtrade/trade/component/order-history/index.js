/**
 * 历史交易
 */

'use strict';

var Core = require('../../../../../app/core');
var app = require('../../../../../app');
var Drag = require('../../../../../common/drag');
var Overlay = require('../../../../../common/overlay');
var tmpl = require('./index.ejs.html');
var gendanListTmpl = require('./gendanList.ejs.html');

export default class Account extends Core {
  constructor(config) {
    super(config);

    this._getData(false);
    this._bind();
  }

  _bind() {
    new Drag(this.el.parent());
    this.el.on('click', '.J_SortType', $.proxy(this._sort, this));
    this.el.on('click', 'thead td', $.proxy(this.sortControls, this));
    this.subscribe('update:orderHistory', this._getData, this);

    // 切换蜡烛图
    this.el.on('click', '.J_OrderItem', (e) => {
      var curEl = $(e.currentTarget);
      var symbol = curEl.attr('data-symbol');
      var order = curEl.attr('data-order');
      var order = this.getOrderById(order);
      e.stopPropagation();

      this.broadcast('change:symbol', {
        symbol: symbol,
        order: order
      });

      var profit = parseFloat(order.profit) + parseFloat(order.swap) - parseFloat(order.commission);
      app.get('chart').setResolution();
      app.get('chart').setProfitLine(order.closePrice, profit);
      app.get('chart').setOpenLine(order.openPrice);

      if ( this.curHistoryOrder == order ) {
        this.overlay.toggleShow(curEl);
        return;
      }

      this.curHistoryOrder = order;

      this.broadcast('clear:selfOrderLine');
      this.broadcast('update:orderDetail', { order: order });
      this.overlay.show(curEl);
      this.overlay.setWidth();
    });

    $(document).on('click', (e) => {
      var targetEl = $(e.toElement || e.relatedTarget || e.target);
      if ( !targetEl.parents('#J_OrderTab').length > 0 || targetEl.hasClass('tab-nav') ) {
        this.overlay && this.overlay.hide();
        if (!targetEl.hasClass('ticket')) {
          this.curHistoryOrder = null;
        }
      }
    })
  }

  _getData(fresh) {
    this.getHistoryOrderList().then((data) => {

      var list = data && data.list || [];
      var normalList = [], gendanList = [],
        gendanObj = {}, curFollowId;

      this.list = list;

      list.forEach((item) => {
        switch (item.closeType) {
          case 'order':
            item.closeTypeName = '手动平仓';
            break;
          case 'takeprofit':
            item.closeTypeName = '止盈平仓';
            break;
          case 'stoploss':
            item.closeTypeName = '止损平仓';
            break;
          case 'margin_check':
            item.closeTypeName = '强制平仓';
            break;
          default:
            item.closeTypeName = '--';
            break;
        }
      });

      for (var i = 0, len = list.length; i < len; i++) {
        if (list[i].follow) {
          var expert_id = list[i].expert_id;
          if ( gendanObj[expert_id] ) {
            gendanObj[expert_id].push(list[i]);
          } else {
            gendanObj[expert_id] = [];
            gendanObj[expert_id].push({
              isTitle: true, 
              followName: list[i].follow_name, 
              followNum: list[i].follow_num,
              expert_id: expert_id
            });
            gendanObj[expert_id].push(list[i]);
          }

          gendanList.push(list[i])

        } else {
          normalList.push(list[i]);
        }
      }

      this.normalList = normalList;
      this.gendanList = gendanList;
      this.gendanObj = gendanObj;
      this._sort({
        currentTarget: $('.active', this.el)
      }, true);

      this.render(tmpl, {
        list: normalList
      }, $('.tbody', this.el));

      this.renderTo(gendanListTmpl, {
        gendanObj: gendanObj
      }, $('.tbody', this.el))

      fresh && this.broadcast('set:nowOrderDetail', {order: list[0]});

      this._getFollowOrderFloatMarginList();

      this._initOverlay();

      $('.J_OrderHistoryNum').text(list.length);
    });
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


  sortControls(e) {
    var curEl = $(e.target);
    var childEl = curEl.children('div.J_SortType');
    if ( childEl.length ) {
      childEl.trigger('click');
    }
  }

  /** 
   * @param origin {Boolean} 是否需要交替升序或降序
   */
  _sort(e, origin) {
    var curEl = $(e.currentTarget);
    var tdEl = curEl.parents('td');
    var tableEl = curEl.parents('table');
    var tbodyEl = $('tbody', tableEl);
    var theadEl = $('thead', tableEl);

    var type = tdEl.attr('data-type');
    var up = curEl.hasClass('up-active');
    //2017-09-25 修改排序
    if (origin) {
      // this.sort(this.list, type);
      this.sort(this.normalList, type);
      if (up) {
        // this.list = this.list.reverse();
        this.normalList = this.normalList.reverse();
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
    // this.sort(this.list, type);
    this.sort(this.normalList, type);

    if (!up) {
      // this.list = this.list.reverse();
      this.normalList = this.normalList.reverse();
    }

    this.render(tmpl, {
      list: this.normalList
    }, $('tbody', this.el));

    this.renderTo(gendanListTmpl, {
      gendanObj: this.gendanObj
    }, $('.tbody', this.el))

    this._initOverlay();
    this._getFollowOrderFloatMarginList();
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
    return parseFloat(val1.profit) - parseFloat(val2.profit);
  }

  _sortTotal(val1, val2) {
    return parseFloat(val1.profit) + parseFloat(val1.swap) - parseFloat(val1.commission) - (parseFloat(val2.profit) + parseFloat(val2.swap) - parseFloat(val2.commission));
  }

  getOrderById(id) {
    var order;

    this.list.forEach((item) => {
      if (item.ticket === id) {
        order = item;
      }
    });

    return order;
  }

  _initOverlay() {
    this.overlay = null;
    this.overlay = new Overlay({
      parentEl: $('.tbody', this.el),
      headerEl: $('thead', this.el)
    });
  }
}