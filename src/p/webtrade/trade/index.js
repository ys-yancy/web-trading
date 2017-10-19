'use strict';

require('../../../lib/bootstrap');
var Core = require('../../../app/core');
var app = require('../../../app');
var Login = require('../../../common/login');
var Tab = require('./component/tab');
var Account = require('./component/account');
var OrderList = require('./component/order');
var OrderHistory = require('./component/order-history');
var Option = require('./component/option');
var Chart = require('./component/chart');
var Profile = require('./component/profile');
var Responsive = require('./component/responsive');
var Withdraw = require('./component/withdraw');
var Load = require('./component/loadModules');

class Trade extends Core {
  constructor() {
    super();

    this._requires();
    this._bind();
    this._config();
  }

  _bind() {
    $(document).on('mouseenter mouseleave', '.J_Hover', (e) => {
        $(e.currentTarget).toggleClass('hover');
    });
    
    $(document).on('click','.J_Exit',function () {
        Cookie.set('real_token', -1, {expires: -1000000});
    });


    $(document).on('click', '.J_Submit', () => {
      Cookie.set('agreement',1,{expires: Infinity});
      $('.riskMsg-mask').css('display','none');
    });

    this.subscribe('app:message', (e) => {
      app.error(e.message);
    });

  }
  _config() { 
    document.title = getTradePageTitle();
  }
  _requires() {
    new Responsive();
    app.mount({
      account: new Account({
        el: $('#J_Account'),
        headerEl: $('header'),
        detailEl: $('#J_AccountDetail')
      }),

      orderList: new OrderList({
        el: $('#J_List')
      }),

      orderHistory: new OrderHistory({
        el: $('#J_HistoryList')
      }),
    
      option: new Option({
        el: $('#J_Option')
      }),

      chart: new Chart({
        el: $('#J_Chart')
      })
    });

    var orderTabEl = $('#J_OrderTab');

    new Tab({
      el: orderTabEl
    }).on('click', (e) => {
      if (e.switch) {
        orderTabEl.removeClass('hidden');
      } else {
        orderTabEl.toggleClass('hidden');
      }

      $(window).trigger('resize');
    });

    new Tab({
      el: $('#J_SidebarInner'),
      responsive: true,
      listenOpen: true
    });

    new Profile({
      el: $('#J_Profile')
    });

    new Withdraw({
      el : $('.J_withdraw')
    });
    
    new Login();

    new Load();

  }
}

new Trade();