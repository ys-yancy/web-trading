"use strict";

var Base = require('../../../app/base');
var Uri = require('../../../app/uri');
var Cookie = require('../../../lib/cookie');
var md5 = require('../../../lib/md5');
var ImageCaptcha = require('../../../common/image-captcha');

class Login extends Base {
    constructor() {
        super();
        this._bind();
        this.imageCap = new ImageCaptcha();
        //this.imageCap._changeClass('pay');

    }

    _bind() {
        var doc = $(document);

        doc.on('click', '.get-code', _.bind(this._getVCode, this));
        doc.on('click', '.get-captcha', _.bind(this._getVCode, this));

        $('.username').on('focusout', _.bind(this._verifyUsername, this));
        $('.code').on('focusout', _.bind(this._verifyCode, this));
        doc.on('submit', '#J_Form', _.bind(this._submit, this));
        doc.on('click', '.J_Confirm', _.bind(this._updatePassword, this));

        $('.J_RealPassword').on('focusout', _.bind(this._verfiyRealPassword, this));
        $('.J_Code').on('focusout', _.bind(this._verifyCode, this));
        
        $('.logo-link').attr("href", getHomeUrl());
        $('.company-name').text(getCompanyName());
        $('.avatar-img').attr('src', getDefaultAvatarUrl());
        $('.logo-link').attr("href", getHomeUrl());
        $('.company-name').text(getCompanyName());
        $('.logo-img').attr('src', getLogoUrl());
        $('.view-bank').attr("href", getBankListHref());
        // $('.img-wrapper-outer').attr('class', getLogoBackgroudStyle());
         
    }
    /**
     * 验证实盘密码
     */
    _verfiyRealPassword(e, hideMessage) {
        var curEl = $((e && e.currentTarget) || '.J_RealPassword'),
            val = curEl.val(),
            parent = curEl.parent('.J_Wrapper'),
            message;

        if (!val) {
            message = '实盘密码不能为空';
        }

        if (hideMessage) {
            return !message;
        }

        if (message) {
            this._showError(parent, message);
            curEl.parent().removeClass('active');
        } else {
            this._hideError(parent);
            curEl.parent().addClass('active');
        }

        return !message;

    }
    _verifyUsername(e, hideMessage,obj) {


        if(e && e.currentTarget){
            var curEl = $(e && e.currentTarget).parents("form").find(".J_Username");
            console.log(1);
        }else{
            var curEl = obj.parents("form").find('.J_Username');
            console.log(2);

        }

        console.log(curEl);
        var val = curEl.val(),
            parent = curEl.parent('.J_Wrapper'),
            message;




        // curEl=curEl.eq(id);
        console.log(val);

        if (!val) {
            message = '手机号码不能为空';
        }

        if (!/^1[3|4|5|7|8][0-9]\d{8}$/.test(val)) {
            message = '手机号码不正确';
            console.log(message);
        }

        if (hideMessage) {
            return !message;
        }



        if (message) {
            this._showError(parent, message);
            $('.J_GetCode').removeClass('active');
            curEl.parent().removeClass('active');
        } else {
            this._hideError(parent);

            $('.J_GetCode').addClass('active');
            curEl.parent().addClass('active');
        }


        return !message;
    }

    /**
     * 验证验证码
     */
    _verifyCode(e, hideMessage,obj) {
        if(e && e.currentTarget){
            var curEl = $(e && e.currentTarget).parents("form").find(".J_Code");
            console.log(1);
        }else{
            var curEl = obj.parents("form").find('.J_Code');
            console.log(2);

        }
        var val = curEl.val(),
            parent = curEl.parent('.J_Wrapper'),
            message;

        if (!val) {
            message = '验证码不能为空';
        }

        if (hideMessage) {
            return !message;
        }

        if (message) {
            this._showError(parent, message);
            curEl.parent().removeClass('active');
        } else {
            this._hideError(parent);
            curEl.parent().addClass('active');
        }

        return !message;
    }

    /**
     * 获取验证码
     */
    _getVCode(e) {
        var curEl = $(e.currentTarget);
        var p=curEl.parents("form");
        var index = curEl.data("val");
        var tel = p.find('.J_Username').val();

        if (curEl.hasClass('get-code')) {
            if (curEl.hasClass('disable')) {
                return;
            }
            if (!this._verifyUsername('',"",curEl)) {
                return;
            }
            this.imageCap._show('',curEl);
        }



        // 这里要向服务器要图片验证码
        if (curEl.hasClass('get-captcha')) {
            var captInput = p.find('#J_ImageCaptcha .captcha-text' );
            if (captInput.val().length!==4){
                console.log(captInput.val());
                p.find('#captcha-message').html('验证码错误!');
                p.find('#J_ImageCaptcha .captcha-text').val('');
                this.imageCap._show("",curEl);
            }else{
                var _this=this;
                curEl.addClass('disable');
                //getWhitelabelCodename是r.js里的函数。
                var whitelabel = getWhitelabelCodename();
                this.ajax({
                    url: '/v1/captcha/' + tel,
                    type: 'post',
                    crossDomain: true,
                    data: {
                        cc: 86,
                        captcha: captInput.val(),
                        wl:whitelabel
                        //phone: telEl
                    }
                }).then(function(data) {
                    if(data.message==="image_vcode error"){
                        p.find('#captcha-message').html('验证码错误!');
                        p.find('#J_ImageCaptcha .captcha-text').val('');
                        _this.imageCap._show("",curEl);
                        curEl.removeClass('disable');
                    }else{
                        p.find('#captcha-message').html('短信已发送!');
                        curEl.addClass('disable');
                        p.find('.code').removeAttr('disabled');
                        setTimeout(function(){
                            p.find('#get-captcha').removeClass('disable');
                            _this.imageCap._hide(p);
                            console.log(1);
                            _this._countdown(p.find('.get-code'));
                        }, 1000);
                    }

                }, function(data){
                    p.find('#captcha-message').html('验证码错误!');
                    p.find('#J_ImageCaptcha .captcha-text').val('');
                    _this.imageCap._show("",curEl);
                    curEl.removeClass('disable');
                });
            }
        }
    }

    _countdown(el) {
        var count = 60;

        coundown();
        el.val(count);
        el.addClass('disable');

        function coundown() {
            setTimeout(function() {
                var val = el.val();

                if (val == 0) {
                    el.val('重新获取');
                    el.removeClass('disable');
                } else {
                    val -= 1;
                    el.val(val);


                    coundown();
                }
            }, 1000);
        }
    }
    _validate(tel) {
        if (!tel) {
            dialog.setContent('请输入手机号码');
            dialog.show();
            return;
        }

        // 验证手机号，默认是11位  
        if (!/^1[3|4|5|7|8][0-9]\d{8}$/.test(tel)) {
            dialog.setContent('请输入正确的手机号码');
            dialog.show();
            return;
        }

        return true;
    }

    _showError(parent, message) {
        var errorEl = $('.message', parent);

        if (errorEl.length === 0) {
            errorEl = '<p class="message">' + message + '</p>';
            parent.append(errorEl);
        }

        parent.addClass('error');
    }

    _hideError(parent) {
        parent.removeClass('error');
    }

    _submit(e) {
        e.preventDefault();
        var parent = $(".login form");
        if (!this._verifyUsername("","",$(".login form .J_Username ")) || !this._verifyCode("","",$(".login form .J_Username ")) ||!this._verfiyRealPassword()) {
            return;
        }
        var tel = $('.username').val().trim(),
            vcode = $('.code').val().trim(),password = parent.find('.J_RealPassword').val().trim();


        this.login({
            phone: tel,
            vcode: vcode,
            password:md5(password)
        });
    }

    login(data) {
        data = _.extend(data, {
            cc: 86
        });

        this.ajax({
            url: '/v1/user/login/real/',
            type: 'post',
            data: data
        }).then((data) => {
            data = data.data;

            Cookie.set('token', data.token, {
                expires: Infinity
            });
            Cookie.set('phone', data.phone, {
                expires: Infinity
            });
            Cookie.set('uuid', data.uuid, {
                expires: Infinity
            });
            Cookie.set('inviteCode', data.invite_code, {
                expires: Infinity
            });

        Cookie.set('real_token', data.real_token, {
          expires: Infinity
        });


        var redirectUrl = new Uri().getParam('redirectUrl');
        console.log(redirectUrl);
        //     if (redirectUrl) {
        //         window.location = redirectUrl;
        //     }

            window.location = './guide.html';
        }, (data) => {
            if (data.message === '用户不存在') {
                this._showError($('.submit-wrapper'), '您还未注册');
            } else if (data.message === '验证码错误') {
                this._showError($('.get-code').parent(), '验证码错误');
            }
        });
    }


    _updatePassword(e) {
        var self = this;
        var curEl = $(e.currentTarget);
        var parentEl = curEl.parents('form');
        var parent = curEl.parent('.wrapper');
        e.preventDefault();

        console.log(curEl);

        if (curEl.prop('disabled')) {
            return;
        }


        //
        // if (!params) {
        //   return;
        // }
        var params = this._validatePassword(parentEl);
        if (!params) {
            return;
        }

        var parent = $(".forget form");
        if (!this._verifyUsername("","",$(".forget form .J_Username ")) || !this._verifyCode("","",$(".forget form .J_Username "))) {
            return;
        }

        var tel = $(".forget form .J_Username ").val();



        params = _.extend({
            phone: tel,
            cc: 86,
        }, params);

        this.ajax({
            url: '/v1/user/real/tradepassword/setnew/',
            type: 'post',
            data: params
        }).then((data) => {
            curEl.prop('disabled', false);
        window.top.location.href = getTradePageUrl();
        $('.J_Password', parentEl).val('');
        $('.J_Code', parentEl).val('');
        clearTimeout(self.timer);
        $('.J_GetCode').prop('disabled', false).text('验证码');

        parentEl.hide();
    });

    }

    _validatePassword(containerEl) {
        var passwordEl = $('.J_Password', containerEl);
        var rePasswordEl = $('.J_RePassword', containerEl);
        var codeEl = $('.J_Code', containerEl);

        var passwordParentEl = passwordEl.parent();
        var rePasswordParentEl = rePasswordEl.parent();
        var codeParentEl = codeEl.parent();
        var password = passwordEl.val();
        var rePassword = rePasswordEl.val();
        var code = codeEl.val();


        if (!password) {
            this._showError(passwordParentEl, '请输入交易密码');
            // message.showError(passwordParentEl, '请输入交易密码');
            return;
        } else {
            this._hideError(passwordParentEl);
        }

        if (rePassword !== password) {
            this._showError(rePasswordParentEl, '两次输入的交易密码不一致');
            // message.showError(rePasswordParentEl, '两次输入的交易密码不一致');
            return;
        } else {
            this._hideError(rePasswordParentEl);
        }

        if (!code) {
            this._showError(codeParentEl, '请输入验证码');
            return;
        } else {
            this._hideError(codeParentEl);
        }

        return {
            password: password,
            vcode: code
        };
    }
}

new Login();