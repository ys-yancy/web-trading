"use strict";

var Base = require('../../../app/base');

export default class Verify extends Base {
    constructor(config) {
        super(config);
        this._bind();

        $('.phone').val(this.cookie.get('phone'));
    }

    _bind() {
        var doc = $(document);

        //doc.on('focusout', '.username', _.bind(this._verifyUsername, this));
        doc.on('focusout', '.phone', _.bind(this._verifyPhone, this));
        doc.on('focusout', '.num', _.bind(this._verfiyNum, this));
        // doc.on('change', '.check', _.bind(this._verifyCheck, this));
    }

    // _verifyUsername(e) {
    //     var curEl = $((e && e.currentTarget) || '.username'),
    //         val = curEl.val(),
    //         parent = curEl.parent('.wrapper'),
    //         message;

    //     if (!val) {
    //         message = '请输入姓名';
    //     }

    //     if (message) {
    //         this._showError(parent, message);
    //     } else {
    //         this._hideError(parent);
    //     }

    //     return !message;
    // }

    _verifyPhone(e) {
        var curEl = $((e && e.currentTarget) || '.form_phone'),
            val = curEl.val(),
            parent = curEl.parent('.wrapper'),
            message;
        console.log(curEl)
        if (!val) {
            message = '手机号码不能为空';
        } else {
            if (!/^1[3|4|5|7|8][0-9]\d{8}$/.test(val)) {
                message = '手机号码不正确';
            }
        }

        if (message) {
            this._showError(parent, message);
        } else {
            this._hideError(parent);
        }

        return !message;
    }

    _verfiyNum(e) {
        var curEl = $((e && e.currentTarget) || '.num'),
            val = curEl.val(),
            parent = curEl.parent('.wrapper'),
            message;

        if (!val) {
            message = '充值金额不能为空';
        } else {
            if (!/\d+/.test(val)) {
                message = '充值金额必须为数字';
            }
            if (val < getMinDepositWL()) {
               message = '充值金额必须大于'+getMinDepositWL();
            }
            if (val > 30000) {
                message = '充值金额不能高于30000';
            }
        }

        var extraMoneyEl = $('.extra-money');


        if (message) {
            this._showError(parent, message);
            extraMoneyEl.val('');
        } else {
            var bonus = this.parent.countBonus(val);
            extraMoneyEl.val(bonus);

            this._hideError(parent);
        }

        return !message;
    }

    _verifyCheck(e) {
        var curEl = $((e && e.currentTarget) || '.check'),
            parent = curEl.parents('.wrapper'),
            message;

        if (!curEl.prop('checked')) {
            message = '请阅读并同意用户注册协议';
        }

        if (message) {
            this._showError(parent, message);
        } else {
            this._hideError(parent);
        }

        return !message;
    }

    _showError(parent, message) {
        var errorEl = $('.message', parent);

        if (errorEl.length === 0) {
            errorEl = '<p class="message">' + message + '</p>';
            parent.append(errorEl);
        } else {
            errorEl.text(message);
        }

        parent.addClass('error');
    }

    _hideError(parent) {
        parent.removeClass('error');
    }

    validate() {
        return this._verfiyNum() && this._verifyPhone() && this._verifyCheck();
    }

    getVal() {
        return {
            amount: parseFloat($('.num').val().trim()),
            phone: $('.phone').val().trim(),
            bonus: $('.extra-money').val()
        }

    }
}