'use strict';

require('./index.css');
require('../../../../../common/date-picker/index.css');
var Base = require('../../../../../app/core');
var Util = require('../../../../../app/util');
// var Pagination = require('../../../../../common/pagination');
var DatePicker = require('../../../../../common/date-picker');
var tmpl = require('./index.ejs.html');
var listTmpl = require('./list.ejs.html');
var messageTmpl = require('./message.ejs.html');

export default class Pocket extends Base {
  constructor(config) {
    super(config);

    this._bind();
    this._initAttrs();
    // this._initPager();
    this._getData();
    this._getSummary();
    this._responsive();
  }

  _bind() {
    // 显示或隐藏类目
    this.el.on('click', '.J_FilterWrapper', _.bind(this._toggleFilter, this));
    this.el.on('mouseleave', '.J_FilterWrapper', _.bind(this._hideFilter, this));
    this.el.on('click', '.J_Item', _.bind(this._switch, this));
    // this.el.on('click', '.J_DatePicker', _.bind(this._toggleDatePicker, this));

    this.el.on('changeDate', '#dpSatat', _.bind(this._changeDate, this));
    this.el.on('changeDate', '#dpEnd', _.bind(this._changeDate, this));

    this.subscribe('resize:window', this._responsive, this);

  }

  _lazyBind() {
    var bdEl = $('.bd', this.el);
    bdEl.on('scroll', _.bind(this.getData, this));
  }

  _toggleFilter(e) {
    // 日期选择器不做处理
    if ($(e.target).hasClass('J_DatePicker')) {
      return;
    }

    this.triggerEl.toggleClass('active');

  }

  _hideFilter(e) {
    this.triggerEl.removeClass('active');
  }

  _switch(e) {
    var curEl = $(e.currentTarget),
      index = curEl.index();
    this.curIndex = index;

    var requestData = {
      params: {
        page_num : 0,
        kind: this._getUrlKid(this.curIndex)
      }
    }

    if (!curEl.hasClass('active')) {
      curEl.siblings().removeClass('active');
      curEl.addClass('active');

      $('.cureent', this.el).text(curEl.text());

      this._getData(index, requestData);
      this._getSummary(index, requestData);
    }
  }

  getData() {
    var baseHeight = 100;

    if ( this.getDataing && this.bdEl.height() + this.bdEl.scrollTop() + baseHeight >= this.contentEl.height() ) {
      this.getDataing = false;
      this.page = this.page ? this.page : 0;
      var requestData = {
        params: {
          page_num : ++this.page,
          kind: this._getUrlKid(this.curIndex)
        }
      }
      this._getData(this.curIndex, requestData);
    }
  }

  _getData(index, requestData) {
    var type = this.isDemo() ? 'demo' : 'real';
    var params = {
      access_token: this.cookie.get('token')
    };

    if (requestData) {
      params = _.extend(params, requestData.params || {});
    }

    if (type === 'real') {
      this.getRealToken().then((realToken) => {
        params.real_token = realToken;

        return this._request(type, params, index, requestData);
      });
    } else {
      this._request(type, params, index, requestData);
    }
  }

  _request(type, params, index, requestData) {
    // 滚到加载
    index = index || 0;
    requestData = requestData || {};

    // 滚到加载
    if ( this.index !== index ) {
      this._showLoading();
    }

    this.ajax({
      url: '/v1/user/' + type + '/pagedtransaction/' + (requestData.type ? requestData.type : 'all') + '/',
      data: params
    }).then((data) => {
      // console.log(data);
      data = data.data;
      // records 
      data.records.forEach((item) => {
        var desc = this.tags[item.reason]
        item.desc = desc;

        if (item.reason === 801 || item.reason === 802) {
          item.desc = desc + '[' + (item.confirmed === 0 ? '未确认' : '已确认') + ']';

          if (item.confirmed == -1) {
            item.desc = desc + '[失败]';
          }
        } else if (item.reason === 1001) {
          item.desc = desc + '[' + (item.confirmed === 0 ? '未领取' : '已领取') + ']';
        } else if (item.reason === 3001) {
          item.desc = item.amount < 0 ? '亏损' : '盈利';
        } else if (item.reason === 3002) {
          item.desc = '朋友赚我也赚';
        }
      });

      if (index && index !== 0) {
        var selectType = this.types[index];
        data.records = data.records.filter(function(item) {
          if (typeof selectType !== 'number') {
            return selectType.indexOf(item.reason) !== -1;
          } else {
            return item.reason === selectType;
          }
        });
      }

      var total = 0;
      data.records.forEach(function(item) {
        if (item.confirmed == 1) {
          total += item.amount;
        }
      });

      // $('#total').text(total.toFixed(2));
      console.log(total, requestData.desc);

      // $('.J_Int', this.valEl).text(parseInt(total));
      // $('.J_Float', this.valEl).text((Math.abs(parseInt(total) - total) || 0.0).toFixed(2).slice(1))

      data.records = data.records.sort(function(v1, v2) {
        return Util.getTime(v2.update_at) - Util.getTime(v1.update_at);
      });

      data.records.indexVal = index || 0;
      // data.records.length = 0;
      // 滚到加载
      if ( this.index == undefined || this.index !== index ) {
        this.render(listTmpl, data.records, this.listEl);
        this.bdEl.scrollTop(0);
        this.page = 0;
      } else {
        this.renderTo(listTmpl, data.records, this.listEl);
      }
      
      if (requestData.region) {
        this.rangeEl.addClass('region');
      } else {
        this.rangeEl.removeClass('region');
      }

      this.index = index;
      // 滚到加载
      data.total < 30 ? this.getDataing = false : this.getDataing = true;
    });

    this._lazyBind();
  }

  _getSummary(index, requestData) {
    index = index || 0;
    requestData = requestData || {};
    var self = this;
    var type = this.isDemo() ? 'demo' : 'real';
    var params = {
      kind: this._getUrlKid(index),
      access_token: this.cookie.get('token')
    }
    if ( type === 'real' ) {
      this.getRealToken().then((realToken) => {
        params.real_token = realToken;
        getSum();
      })
    } else {
      getSum();
    }

    function getSum() {
      self.ajax({
        url: '/v1/user/' + type + '/pagedtransaction/summary/' + (requestData.type ? requestData.type : 'all') + '/',
        data: params
      }).then((data) => {
        data = data.data;
        var amount = parseFloat(data.amount);
        amount = amount.toString();

        setTimeout(() => {
          var amounts = amount.split('.');
          $('.J_Int', self.valEl).html(amounts[0] + '.');
          $('.J_Float', self.valEl).text(amounts[1]);
        }, 500)
      })
    }
  }

  _getUrlKid(index) {
    var paramKind = 'all';
    switch ( index ) {
      case 0: 
        paramKind = 'all';
        break;
      case 1:
        paramKind = 'trade';
        break;
      case 2:
        paramKind = 'withdraw';
        break;
      case 3:
        paramKind = 'deposit';
        break;
      case 5:
        paramKind = 'friend_earn';
        break;
      case 4:
        paramKind = 'bonus';
        break;
      case 6:
        paramKind = 'markup';
        break;
      case 7:
        paramKind = 'hongbao';
        break;
      default:
        paramKind = 'all';
        break;
    };
    return paramKind;
  }

  _showLoading() {
    this._showMessage('正在加载中...');
  }

  // 显示正在加载
  _showMessage(message) {
    this.render(messageTmpl, { message: message }, this.listEl);
  }

  _toggleDatePicker(e) {
    var dpSatatEl = $('#dpSatat'),
        dpEndEl = $('#dpEnd'),
        datepickerWrapperEl = $('.J_DatePicker');
    var isShow = datepickerWrapperEl.hasClass('show');
    var isHide = datepickerWrapperEl.hasClass('hide');

    if (isShow) {
      this._datepickerHide(this.dpSatat, this.dpEnd);
      datepickerWrapperEl.removeClass('show').addClass('hide');
      return;
    } else if (isHide){
      this._datepickerShow(this.dpSatat, this.dpEnd);
      datepickerWrapperEl.addClass('show');
      return;
    }

    this.dpSatat = dpSatatEl.datepicker();
    this.dpEnd = dpEndEl.datepicker();
    datepickerWrapperEl.addClass('show').removeClass('hide');
  }

  _changeDate(e) {
    var curEl = $(e.currentTarget);
    // this._datepickerHide(curEl);
  }

  _datepickerShow(el1, el2) {
    el1 && el1.datepicker('show');
    el2 && el2.datepicker('show');
  }

  _datepickerHide(el1, el2) {
    el1 && el1.datepicker('hide');
    el2 && el2.datepicker('hide');
  }

  _getDatepickerTime(e) {
    return e.data('date');
  }

  // _initPager() {
  //   this.pager = this.pageEl.pagination({
  //     items: 15,
  //     itemsOnPage: 1,
  //     displayedPages: 5,
  //     edges: 1,
  //     cssStyle: 'compact-theme',
  //     prevText: '上一页',
  //     nextText: '下一页',
  //     onPageClick: (page) => {
  //       var requestData = {
  //         params: {
  //           page_num : page-1,
  //           kind: this._getUrlKid(this.curIndex)
  //         }
  //       }
  //       this._getData(this.curIndex, requestData);
  //     }
  //   })
  // }

  _initAttrs() {
    this.render(tmpl, {}, this.el);
    this.pageEl = $('.J_Pagination', this.el);
    this.triggerEl = $('.J_FilterWrapper', this.el);
    this.listEl = $('.J_List', this.el);
    this.rangeEl = $('.J_Range', this.el);
    this.valEl = $('.J_Val', this.el);
    this.bdEl = $('.bd', this.el);
    this.contentEl = $('table', this.bdEl);
  }

  _responsive() {
    var winHeight = $(window).height();
    var headerHeight = $('header').height();
    this.bdEl.height(winHeight - 38 - headerHeight - 10);
  }

  defaults() {
    return {
      tags: {
        0: '系统赠予',
        700: '入金赠金',
        701: '活动赠金',
        801: '入金',
        802: '出金',
        1001: '红包',
        1002: '活动奖金',
        2010: '任务奖金',
        2011: '考试奖金',
        2012: '升级奖金',
        2013: '邀请奖金',
        2014: '签到奖金',
        2015: '订单竞猜奖金',
        2016: '每日竞猜奖金',
        3001: '交易盈亏',
        3002: '朋友赚',
        3003: '外佣',
        3004: '内返', 
        5001: '用户兑换商品消费'
      },
      types: ['all', 3001, 802, 801, [0, 700, 701, 1002, 2010, 2011, 2012, 2014, 2015, 2016], 3002, [3003, 3004],
        [1001, 2013]
      ]
    }
  }
}