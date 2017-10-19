'use strict';


var Base = require('../../../app/base');
var Util = require('../../../app/util');
var ZHeader = require('../../../common/zHeader');
var toast = require('../../../common/toast');
var Toast = toast;

class Cooperation extends Base {
  constructor() {
    super();

    this._bind();
  }

  _bind() {
    var doc = $(document);

    doc.on('blur change', '.J_Validate', (e) => {
      this._change(e);
    });

    $('form').on('submit', (e) => {
      this._submit(e);
    });
  }

  _change(e) {
    var curEl = $(e.currentTarget);

    this._validate(curEl);
  }

  _validate(itemEl) {

    var option = itemEl.attr('data-validate');

    var val = itemEl.val().trim();

    if (!option) {
      return true;
    }

    if (!val) {
      this._showError(itemEl, '不能为空');
      return false;
    }

    //this._hideError(itemEl);
    if (option.indexOf('tel') !== -1) {
      if (!/\d{11}/.test(val)) {
        this._showError(itemEl, '请输入正确的手机号码');
        return false;
      }
    }

    this._hideError(itemEl);
    return true;
  }

  _showError(curEl, message) {
    var messageEl = curEl.siblings('.error');

    if (messageEl.length === 0) {
      curEl.after('<p class="error">' + message + '</p>');
    } else {
      messageEl.text(message);
      messageEl.show();
    }
  }

  _hideError(curEl) {
    var messageEl = curEl.siblings('.error');
    messageEl.hide();
  }

  validate() {
    var itemEls = $('.J_Validate');
    var pass = true;

    for (var i = 0, len = itemEls.length; i < len; i++) {
      var itemEl = $(itemEls[i]);

      if (!this._validate(itemEl)) {
        pass = false;
      }
    }

    return pass;
  }

  _submit(e) {
    e.preventDefault();
    if (!this.validate()) {
      return;
    }

    var contents = this._getContents();

    var data = {
      phone: 18600362657,
      user_id: 'F467823F-E771-49D5-9CBA-28AFE22D2847',
      access_token: '56aae22e-6572-4bf1-a6ee-4c8e62ff1bb6',
      contents: contents
    }


    this.ajax({
      url: getFeedbackUrl(),
      type: 'post',
      data: data,
      unjoin: true
    }).then(() => {
      new Toast('提交成功');
    });
  }

  _getContents() {
    var data = {};

    var itemEls = $('.J_Validate');

    for (var i = 0, l = itemEls.length; i < l; i++) {
      var item = $(itemEls[i]);
      var val = item.val().trim();
      var name = item.attr('name');

      data[name] = val;
    }

    data['message'] = $('textarea').val();


    return JSON.stringify(data);
  }
}

new Cooperation();