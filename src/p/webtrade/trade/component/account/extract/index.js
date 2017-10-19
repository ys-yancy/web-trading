'use strict';

require('./index.css');

var Core = require('../../../../../../app/core');
require('../../../../../../common/dialog');
var message = require('../../message');

var tmpl = require('./index.ejs.html');

export default class Extract extends Core {
  constructor(config) {
    super(config);

   
    this._render();
  }

  _bind() {
    this.el.on('click', '.J_Close', _.bind(this.close, this));
    this.el.on('click', '.J_Confirm', _.bind(this._submit, this));

    // 校验
    this.numEl.bind('paste blur', _.bind(this._validateNum, this));
    this.nameEl.bind('paste keyup blur', _.bind(this._validateName, this));
    this.bankNumEl.bind('parse blur', _.bind(this._validateBankNum, this));

    // 银行下啦
    this.el.on('click', '.J_Bank', _.bind(this._toggleDropdown, this));
    this.el.on('click', '.J_OptionItem', _.bind(this._select, this));
  }

  _validateNum() {
    var val = this.numEl.val();
    var message = '';


    if (!val) {
      message = '请输入出金金额';
    } else if (val < 100) {
      message = '小于最小出金金额';
    } else if (val > this.available) {
      message = '超过最大出金金额';
    }

    return this._validate(this.numEl, message);
  }

  _validateName() {
    var val = this.nameEl.val();
    var message = '';

    if (!val) {
      message = '请输入您的姓名';
    }

    return this._validate(this.nameEl, message);
  }

  _validateBankNum() {
    var val = this.bankNumEl.val();
    var message = '';

    if (!val) {
      message = '请输入您的银行卡号';
    }

    return this._validate(this.bankNumEl, message);
  }

  _validate(referEl, msg) {

    var parentEl = referEl.parent();
    if (msg) {
      message.showError(parentEl, msg);
      return;
    } else {
      message.hideError(parentEl);

      return true;
    }
  }

  _toggleDropdown(e) {
    var wrapperEl = $(e.currentTarget).parents('.dropdown-wrapper');
    var dropdownEl = $('.J_OptionMenu', wrapperEl);

    dropdownEl.toggle();
  }

  _select(e) {
    var curEl = $(e.currentTarget);
    var wrapperEl = curEl.parents('.dropdown-wrapper');
    var dropdownEl = $('.J_OptionMenu', wrapperEl);
    var bankEl = $('.J_Bank', wrapperEl);

    bankEl.text(curEl.text());
    dropdownEl.hide();
  }

  _render() {
    vex.open({
      content: this.render(tmpl),
      afterOpen: ($vexContent) => {
        this.el = $vexContent;

        this._initAttrs();
        this._bind();
      },
      afterClose: function() {
        // return console.log('vexClose');
      },
      showCloseButton: false,
      contentClassName: 'vex-order ' + this.className
        // showConfirmButton: true
    });
  }

  _initAttrs() {
    this.numEl = $('.J_Num', this.el);
    this.phoneEl = $('.J_Phone', this.el);
    this.nameEl = $('.J_Name', this.el);
    // this.bankEl = $('.J_Bank', this.el);
    this.bankNumEl = $('.J_BankNum', this.el);
  }

  close() {
    vex.close(this.el.data().vex.id);
  }

  _submit() {

  }

  defaults() {
    return {
      available: 200
    }
  }
}