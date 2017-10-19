/**
 * 获取账户信息
 */

'use strict';

require('./index.css');

var Core = require('../../../../../app/core');
var login = require('../../../../../app/login');
var Config = require('../../../../../app/config.js');
var numeral = require('../../../../../lib/numeral');
var Drag = require('../../../../../common/drag');
var app = require('../../../../../app');
var detailTmpl = require('./detail.ejs.html');
var Truename = require('../trueName');
var Extract = require('./extract');

export default class Account extends Core {
  constructor(config) {
    super(config);

    this.cacheOrderList_ = {};

    this.getAccountData({ interval: true });
    this._bind();

    this._initDetail();

  }

  _bind() {
    this.subscribe('update:account', this.getAccountData, this);
    this.subscribe('get:accountData', this._update, this);
    this.subscribe('get:user:name:phone:img', this.updateUserNamePhoneImg, this);

    // 退出登录
    this.headerEl.on('click', '.J_Exit', _.bind(this._exit, this));

    this.on('get:done', () => {
      setTimeout(() => {
        this.getAccountData({ fresh: true, interval: true });
      }, 30 * 1000);
    });

    if ( getIsDemo() ) {
      var rechargeEl = $('a.recharge', this.headerEl);
      rechargeEl.prop('href', 'javascript:void(0)');
      this.headerEl.on('click', '.recharge', (e) => {
        e.stopPropagation();
        e.preventDefault();
        var message = '仅供演示使用！';
        var time = 5 * 1000;
        app.success(message, time);
      })
    } else {
      var href = getDepositButtonHref();
      $('a.recharge').attr('href', href);
    }
  }

  getAccountData(e) {
    var fresh = e && e.fresh;
    return this._getAccount(fresh).then((data) => {
      var type = this.isDemo() ? 'demo' : 'real';

      this.broadcast('get:orderList', data);
      return this.getFloatingProfit(this.account, data.list, data.symbols).then((profit, floatOption) => {
        var netDeposit = parseFloat(this.account[type].balance) + parseFloat(profit);
        var margin = parseFloat(this.account[type].margin);
        var freeMargin = netDeposit - parseFloat(data.margin);
        var ticket_num = data.list ? data.list.length : 0;
        var untriggeredBonus = parseFloat(this.account[type].untriggered_bonus ? this.account[type].untriggered_bonus : 0);

        var rate;
        if (data.margin == 0) {
          rate = '--';
        } else {
          rate = (( freeMargin + margin - Math.max(margin, untriggeredBonus) + margin ) / margin * 100).toFixed(2);
        }

        this._setBalance(this.account);

        var tmplData = {
          netDeposit: netDeposit,
          freeMargin: freeMargin,
          profit: profit,
          rate: rate,
          type: type,
          eidt: this.edit,
          init: this.hasInit,
          balance: this._getBalance(),
          ticketNum: ticket_num
        };

        if (rate < 100) {
          console.log('需要检查强制平仓');
          this.broadcast('check:closed');
        }

        console.log('rate', rate)

        if (data.margin !== 0) {
          var c = netDeposit / parseFloat(data.margin);
          if (c < 1) {
            console.log('应该检查是否强制平仓了');
          }
        }

        if (!this.hasInit) {

          this.hasInit = true;
        }
        this._update(tmplData);

        this.freeMargin = freeMargin;

        e && e.interval && this.fire('get:done');

      }).catch((e) => {
        console.log(e);
      });
    });
  }

  /**
   * 获取账户信息
   * @param {boolean} all 是否返回全部数据
   */
  getValue(all) {
    return all ? this.accountAll : this.account;
  }

  getVolume(symbol) {
    return this.getAccountAndMargin().then(() => {
      return this.calVolume(symbol, this.account, this.freeMargin);
    });
  }

  getAccountAndMargin() {
    if (this.account && this.freeMargin !== undefined) {
      return Promise.resolve();
    } else {
      return this.getAccountData();
    }
  }

  renderX(el, val) {
    var intEl = $('.J_Int', el);
    var floatEl = $('.J_Float', el);
    var minus = false;

    if (val === '--' || val === undefined || !Number.isFinite(val)) {
      intEl.text('--');
      floatEl.text('');
      return;
    }

    if (val < 0 && parseInt(val) == 0) {
      minus = true;
    }

    floatEl.text('.' + Math.abs(parseFloat(val) - parseInt(val)).toFixed(2).slice(2));

    var num = parseInt(val);
    num = numeral(num).format('0,0');


    num = minus ? '-' + num : num;
    intEl.text(num);
  }

  _update(data) {
    this.update(data);
  }

  update(data) {
    this.renderX(this.floatProfitEl, data.profit);
    this.renderX(this.freeMarginEl, data.freeMargin);
    this.renderX(this.rateEl, data.rate);
    this.renderX(this.netDepositEl, data.netDeposit);
    this.renderX(this.balanceEl, data.balance);
    this.renderX(this.totalProfitsEl, data.total);
    this.renderX(this.ticketEl, data.ticketNum);

    if (!this.floatProfitEl) {
      return;
    }

    data.profit > 0 ? this.floatProfitEl.addClass('up').removeClass('zero') : this.floatProfitEl.removeClass('up').addClass('zero');
    if (data.profit == 0) {
      this.floatProfitEl.removeClass('up zero');
    }
  }

  updateUserNamePhoneImg(data) {
    this.avatarEl.attr('src', data.img);
    this.nicknameEl.text(data.nickname);
    this.phoneEl.text(data.phone)
  }

  _setBalance(account) {
    this.demoBalance = parseFloat(account.demo.balance);
    this.realBalance = parseFloat(account.real.balance);
  }

  _getBalance() {
    var type = this.isDemo() ? 'demo' : 'real';

    return this[type + 'Balance'];
  }

  /**
   * @param fresh {Boolean} 是否强制刷新
   */
  _getAccount(fresh) {
    var type = this.isDemo() ? 'demo' : 'real';

    if (!fresh && this.cacheOrderList_[type]) {
      return Promise.resolve(this.cacheOrderList_[type]);
    } else {
      return this.getAccount().then((data) => {
        this.account = data.account;
        this.accountAll = data;

        return this.getCurrentOrderList();
      }).then((data) => {
        var type = this.isDemo() ? 'demo' : 'real';
        this.cacheOrderList_[type] = data;

        return data;
      });
    }
  }

  _getWithDraw() {
    var self = this;

    return this.getRealToken().then((realToken) => {

      return this.ajax({
        url: '/v1/user/real/withdraw/',
        data: {
          access_token: this.cookie.get('token'),
          real_token: realToken
        }
      }).then(function(data) {
        data = data.data;
        if(getHasTrueInfo() && !data.true_name){
          new Truename();
        }
        if(self.cookie.get('agreement') != 1){
          if(getRiskMsg()){
            var riskMsgEl = $('.riskMsg-mask');
            $('.c_center').html(getRiskMsg());
            riskMsgEl.show();
          }
        }
        return data;

      });
    });
  }

  getWithDraw() {
    this._getWithDraw().then((data) => {
      // this.renderX(this.detailExtractEl, parseFloat(data.extractable_amount));
      if( data.extractable_amount < 100 ) {
        // 这里也需要处理
        $('.J_Extract', this.el).prop('disabled', true);
      }else {
        this.extractAmount = data.extractable_amount;
      }
    })
  }

  _exit() {
    login.logout(true);
  }


  _initDetail() {
    var accountEl = $('.account', this.headerEl);
    // 我的账户
    this.floatProfitEl = $('.J_FloatProfit', this.headerEl);
    this.freeMarginEl = $('.J_FreeMargin', this.headerEl);
    this.rateEl = $('.J_Rate', this.headerEl);
    this.netDepositEl = $('.J_NetDeposit', this.headerEl);
    this.balanceEl = $('.J_Balance', this.headerEl);
    this.totalProfitsEl = $('.J_Profits', this.headerEl);
    this.ticketEl = $('.J_CurTicket', this.headerEl);
    this.avatarEl = $('.img', accountEl);
    this.nicknameEl = $('.name', accountEl);
    this.phoneEl = $('.phone', accountEl);

    new Drag($('.account-wrapper-outer', this.headerEl))

    this.getWithDraw();
  }

}
