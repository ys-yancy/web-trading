"use strict";

var Base = require('../../../app/base');
var Uri = require('../../../app/uri');
var Cookie = require('../../../lib/cookie');
var md5 = require('../../../lib/md5');
var qrcode = require('../../../lib/qrcode');
var Util = require('../../../app/util');
var Config = require('../../../app/config');
// var jquery_qrcode = require('../../../lib/jquery.qrcode.min');
var jquery_qrcode = require('../../../lib/jquery.qrcode-0.12.0');
var toast = require('../../../common/toast');
var ImageCaptcha = require('../../../common/image-captcha');
class Register extends Base {
  constructor() {
    super();
    this._bind();
    this._showInvCode();
    this.imageCap = new ImageCaptcha();
    
    jQuery('#qrcodeTable').qrcode({
                render  : "image",
                text    : getMobileRegisterLink(), // getMobileRegisterLink() 是r.js里的。
                size    : 173,
        });
    jQuery('#img-logo').attr("src", getLogoUrl()); // getLogoUrl 是r.js里的。
    jQuery('#logo-wrapper').attr("class", getLogoBackgroudStyle()); // getLogoBackgroudStyle 是r.js里的。
    
  }

  _bind() {
    var doc = $(document);

    doc.on('click', '.J_GetCode', _.bind(this._getVCode, this));
    doc.on('click', '.get-captcha', _.bind(this._getVCode, this));

    $('.J_Username').on('focusout', _.bind(this._verifyUsername, this));

    // $('.J_RealPassword').on('focusout', _.bind(this._verfiyRealPassword, this));
    $('.J_Code').on('focusout', _.bind(this._verifyCode, this));

    $('.inv_code').on('focusout', _.bind(this._verfiyInvCode, this));

    doc.on('submit', '#J_Form', _.bind(this._submit, this));

    doc.on('focus', '.J_Username', (e) => {
      var parent = $(e.currentTarget).parent();
      parent.siblings().removeClass('hover');
      parent.addClass('hover');
    });
    /*
    doc.on('focus', '.J_RealPassword', (e) => {
      var parent = $(e.currentTarget).parent();
      parent.siblings().removeClass('hover');
      parent.addClass('hover');
    });
*/
    setInterval(() => {
      this._verfiy();
    }, 1000);

    doc.on('click', '.J_ShowQrcode', (e) => {
      var curEl = $(e.currentTarget);
      if (this.showQrcode) {
        $('.qrcode-mask').hide();
        this.showQrcode = false;
        curEl.text('扫码注册');
      } else {
        $('.qrcode-mask').show();
        this.showQrcode = true;
        curEl.text('去登录');
      }

    });
  }

  /**
   * 显示邀请码输入框
   */
  
  _showInvCode() {
    var wl = getWLName(),
        InvCodeEl = $('.J_Wrapper.I_code');
    if ( wl == 'ifbao' ) {
      InvCodeEl.show();
    }
  }

  /**
   * 验证手机号码
   */
  _verifyUsername(e, hideMessage) {
    var curEl = $((e && e.currentTarget) || '.J_Username'),
      val = curEl.val(),
      parent = curEl.parent('.J_Wrapper'),
      message;

    if (!val) {
      message = '手机号码不能为空';
    }

    if (!/^1[3|4|5|7|8][0-9]\d{8}$/.test(val)) {
      message = '手机号码不正确';
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

  /**
   * 验证验证码
   */
  _verifyCode(e, hideMessage) {
    var curEl = $((e && e.currentTarget) || '.J_Code'),
      val = curEl.val(),
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
   * 验证邀请码
   */
  
  _verfiyInvCode(e) {
    var curEl = $((e && e.currentTarget) || '.inv_code'),
        val = curEl.val(),
        parent = curEl.parent('.J_Wrapper'),
        message;
    if ( !val ) {
      message = '请输入邀请码'
    }

    if( message ) {
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
    var tel = $('.J_Username').val();

    if (curEl.hasClass('get-code')) {
         if (curEl.hasClass('disable')) {
             return;
         }
         if (!this._verifyUsername()) {
             return;
         }
           this.imageCap._show("",curEl);
     }


    
    if (curEl.hasClass('get-captcha')) {
      var captInput = $('#J_ImageCaptcha .captcha-text' );
      if (captInput.val().length!==4){
        $('#captcha-message').html('验证码错误!');
        $('#J_ImageCaptcha .captcha-text').val('');
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
                captcha: $('#J_ImageCaptcha .captcha-text' ).val(),
                wl:whitelabel
                    //phone: telEl
            }
        }).then(function(data) { 
          if(data.message==="image_vcode error"){
            $('#captcha-message').html('验证码错误!');
            $('#J_ImageCaptcha .captcha-text').val('');
            _this.imageCap._show("",curEl);
            curEl.removeClass('disable');
          }else{
            $('#captcha-message').html('短信已发送!');
            curEl.addClass('disable');
            $('.code').removeAttr('disabled');
            setTimeout(function(){
              $('#get-captcha').removeClass('disable');
              _this.imageCap._hide(curEl);
              _this._countdown($('.get-code'));
            }, 1000);
          }
            //$('#captcha-message').html('短信已发送!');
            //curEl.addClass('disable');
            //$('.code').removeAttr('disabled');
            //setTimeout(function(){
            //  $('#get-captcha').removeClass('disable');
            //  _this.imageCap._hide();
            //  _this._countdown($('.get-code'));
            //}, 1000);
        }, function(data){
            $('#captcha-message').html('验证码错误!');
            $('#J_ImageCaptcha .captcha-text').val('');
            _this.imageCap._show("",curEl);
            curEl.removeClass('disable');
        });
      }
   } 
  }

  /**
   * 验证码倒计时
   */
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
    var errorEl = $('.J_Message', parent);

    if (errorEl.length === 0) {
      errorEl = '<p class="message J_Message">' + message + '</p>';
      parent.append(errorEl);
    }

    parent.addClass('error');
  }

  _hideError(parent) {
    parent.removeClass('error');
  }

  _verfiy() {
    if (!this._verifyUsername(undefined, true) || 
        !this._verifyCode(undefined, true) // || 
        // !this._verfiyRealPassword(undefined, true)
    ) {
      $('.J_Submit').removeClass('active');
    } else {
      $('.J_Submit').addClass('active');
    }
    
    if (!this._verifyUsername(undefined, true) || 
        !this._verifyCode(undefined, true) // || 
        // !this._verfiyRealPassword(undefined, true)
    ) {
      $('.J_Submit').removeClass('active');
    } else {
      $('.J_Submit').addClass('active');
    }
  }
  
  
  _getLottery() {
    var self = this;
    this.ajax({
      url: '/v1/hongbao/use/',
      type: 'post',
      data: {
        access_token: Cookie.get('token')
      }
    }).then(() => {
      // this._goRegister();
      setTimeout(function() {
                window.top.location.href = getTradePageUrl();
              }, 1500);
    });
  }
  
  
  
  _submit(e) {
    e.preventDefault();
    if (!this._verifyUsername() || !this._verifyCode() 
        // || !this._verfiyRealPassword()
    ) {
      return;
    }
    
    if( getWLName() == 'ifbao' && !this._verfiyInvCode() ) {
      return;
    }

    var tel = $('.J_Username').val().trim(),
        vcode = $('.J_Code').val().trim(),
        referCode = $('.inv_code').val().trim() || getRegisterReferCode();

    // this.login({
    //   phone: tel,
    //   vcode: vcode
    // }).then(() => {
    //   return this.setRealToken()
    // });
    var d = {
      phone: tel,
      vcode: vcode,
      cc:86,
      uuid: Util.guid(),
      nickname: getRegisterDefaultNickname(), // getRegisterDefaultNickname()从r.js里来
      refer: referCode,//getRegisterReferCode(), // getRegisterReferCode()从r.js里来
      source: getRegisterSource(),// getRegisterSource()从r.js里来
      wl: getWLName(),// getWLName()从r.js里来
    };
    this.register(d).then(() => {
      // return this.setRealToken();
      return;
    });
  }

  /**
   * 手机号验证码登录
   */
  login(data) {
    data = _.extend(data, {
      cc: 86
    });

    return this.ajax({
      url: '/v1/user/login',
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
      Cookie.set('nickname', data.nickname, {
        expires: Infinity
      });
      Cookie.set('type', 'real');

      if (data.avatar) {
        Cookie.set('avatar', data.avatar, {
          expires: Infinity
        });
      }

      return data.token;
    }, (data) => {
      if (data.message === '用户不存在') {
        this._showError($('.J_SubmitWrapper'), '您还未注册');
      } else if (data.message === '验证码错误') {
        this._showError($('.J_GetCode').parent(), '验证码错误');
      }
    });
  }

  /**
   * 设置实盘交易密码
   */
  setRealToken() {
    var real = $('.J_RealPassword').val();

    this.ajax({
      url: '/v1/user/real/tradepassword/verify/',
      type: 'post',
      data: {
        access_token: Cookie.get('token'),
        password: md5(real)
      }
    }).then((data) => {
      Cookie.set('real_token', data.data.real_token, {
        expires: $Global.getRealPasswordExpireTime()
      });
      // location.href = './trade.html';
      window.top.location.href = getTradePageUrl(); //getTradePageUrl是r.js里的函数。
    }, (data) => {
      this._showError($('.J_SubmitWrapper'), '手机号或交易密码错误');
    });
  }
  
  
  /**
   * 手机号验证码登录
   */
  register(data) {
    return this.ajax({
      url: '/v1/user/create',
      type: 'post',
      data: data
    }).then(
        (data) => {
          
          Cookie.set('real_token', data.data.real_token, {
            expires: Config.getRealPasswordExpireTime()
          });
          Cookie.set('type', 'real');
          Cookie.set('goType', 'real');

          Cookie.set('phone', $('.tel').val(), {
            expires: Infinity
          });
          Cookie.set('token', data.data.token, {
            expires: Infinity
          });
          Cookie.set('inviteCode', data.data.invite_code, {
             expires: Infinity
          });
          Cookie.set('uuid', data.data.uuid, {
             expires: Infinity
          });
          
          
          if (getRegisterReferCode()) {
            this._getLottery();
          } else {
            setTimeout(function() {
                window.top.location.href = getTradePageUrl();
              }, 1500);
          }
          
        }, (data) => {
              if (data.status != 200) {
                this._showError($('.J_SubmitWrapper'), data.message);
              }
            }
        );
  }
  
  
}

new Register();