"use strict";

var Base = require('../../../app/base');
var Uri = require('../../../app/uri');
var Cookie = require('../../../lib/cookie');
var md5 = require('../../../lib/md5');
var qrcode = require('../../../lib/qrcode');
// var jquery_qrcode = require('../../../lib/jquery.qrcode.min');
var jquery_qrcode = require('../../../lib/jquery.qrcode-0.12.0');
var ImageCaptcha = require('../../../common/image-captcha');
var Config = require('../../../app/config');
var Util = require('../../../app/util');

class Login extends Base {
  constructor() {
    super();
    this._bind();

    this.imageCap = new ImageCaptcha();


    jQuery('#qrcodeTable').qrcode({
                render  : "image",
                text    : getMobileRegisterLink(), // getMobileRegisterLink() 是r.js里的。
                size    : 173,
        });
    jQuery('#img-logo').attr("src", getDefaultAvatarUrl()); // getLogoUrl 是r.js里的。
    jQuery('#logo-wrapper').attr("class", getLogoBackgroudStyle()); // getLogoBackgroudStyle 是r.js里的。
    jQuery('.sweepCodeCommission').text( getRegisterGold() );

  }

  _bind() {
    var doc = $(document);

    doc.on('click', '.J_GetCode', _.bind(this._getVCode, this));
    doc.on('click', '.J_RegGetCode', _.bind(this._getVCode, this));
    doc.on('click', '.get-captcha', _.bind(this._getVCode, this));

    doc.on('focusout', '.J_Username',  _.bind(this._verifyUsername, this));
    doc.on('focusout', '.J_Email',  _.bind(this._verifyEmail, this));

    $('.J_RealPassword').on('focusout', _.bind(this._verfiyRealPassword, this));
    $('.J_Code').on('focusout', _.bind(this._verifyCode, this));

    doc.on('submit', '#J_Form', _.bind(this._login, this));
    doc.on('submit', '#J_RegForm', _.bind(this._register, this));
    doc.on('click', '.J_Confirm', _.bind(this._updatePassword, this));


    doc.on('focus', '.J_Username', (e)=>{
      var parent = $(e.currentTarget).parent();
      parent.siblings().removeClass('hover');
      parent.addClass('hover');
    });
    doc.on('focus', '.J_RealPassword', (e)=>{
      var parent = $(e.currentTarget).parent();
      parent.siblings().removeClass('hover');
      parent.addClass('hover');
    });

    // setInterval(()=>{
    //   this._verfiy();
    // }, 1000);

    doc.on('click', '.J_ShowQrcode', (e)=>{
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
   * 验证手机号码
   */
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

    _verifyEmail(e, hideMessage,obj){

        if(e && e.currentTarget){
            var curEl = $(e && e.currentTarget).parents("form").find(".J_Email");
            console.log(1);
        }else{
            var curEl = obj.parents("form").find('.J_Email');
            console.log(2);

        }
        var   parent = curEl.parent('.J_Wrapper'), message;

    if(curEl.val()=="")
    {
        message = '邮箱不能为空';
    }
    var email=curEl.val();
    if(!email.match(/^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/))
    {
        message = '邮箱格式不正确';
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
    console.log(curEl);
    var tel = p.find('.J_Username').val();

    console.log(tel);

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
              // this.imageCap._show("",curEl);
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

  // _verfiy() {
  //   if (!this._verifyUsername(undefined, true) || !this._verifyCode(undefined, true) || !this._verfiyRealPassword(undefined, true)) {
  //     $('.J_Submit').removeClass('active');
  //   } else {
  //     $('.J_Submit').addClass('active');
  //   }
  // }

  _login(e) {
    e.preventDefault();

var parent = $(".login form");
    if (!this._verifyUsername("","",$(".login form .J_Username ")) || !this._verifyCode("","",$(".login form .J_Username ")) || !this._verfiyRealPassword()) {
      return;
    }

    var tel = parent.find('.J_Username').val().trim(),
      vcode = parent.find('.J_Code').val().trim(),password = parent.find('.J_RealPassword').val().trim();


    this.login({
      phone: tel,
      vcode: vcode,
      password:md5(password)
    }).then(()=>{
      return this.setRealToken()

    });
  };
  _register(e){
    e.preventDefault();
    var parent = $(".regster form");
    if (!this._verifyUsername("","",$(".regster form .J_Username ")) || !this._verifyCode("","",$(".regster form .J_Username ")) || !this._verifyEmail("","",$(".regster form .J_Username "))  ) {
      return;
    }

    var tel = parent.find('.J_Username').val().trim(),
        vcode = parent.find('.J_Code').val().trim(),
        email = parent.find('.J_Email').val().trim(),
    referCode = parent.find('.inv_code').val().trim() || getRegisterReferCode();
    var d = {
      phone: tel,
      vcode: vcode,
      email:email,
      cc:86,
      uuid: Util.guid(),
      nickname: getRegisterDefaultNickname(), // getRegisterDefaultNickname()从r.js里来
      refer: referCode,//getRegisterReferCode(), // getRegisterReferCode()从r.js里来
      source: getRegisterSource(),// getRegisterSource()从r.js里来
      wl: getWLName(),// getWLName()从r.js里来
    };
    this.reg(d).then(()=>{
      // return this.setRealToken();
      return;
  });
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
        window.top.location.href = './trade.html';
        // window.top.location.href = getTradePageUrl();
      }, 1500);
  });
  }

  reg(data) {
    return this.ajax({
          url: '/v1/user/create',
          type: 'post',
          data: data
        }).then((data)=>{
          Cookie.set('real_token', data.data.real_token, {
              expires: Config.getRealPasswordExpireTime()
            });
    Cookie.set('type', 'real');
    Cookie.set('goType', 'real');

    Cookie.set('phone', $('.regster .tel').val(), {
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
        window.top.location.href = './trade.html';
      }, 1500);
    }

  },(data)=>{
      if (data.status != 200) {
        this._showError($('.J_SubmitWrapper'), data.message);
      }
    });
  }

  /**
   * 手机号验证码登录
   */
  login(data) {
    data = _.extend(data, {
      cc: 86,
      wl: getWLName(),
    });

    return this.ajax({
      url: '/v1/user/login/real/',
      type: 'post',
      data: data
    }).then((data)=>{
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

    // Cookie.set('real_token', data.real_token, {
    //   expires: $Global.getRealPasswordExpireTime()
    // });


      if (data.avatar) {
        Cookie.set('avatar', data.avatar, {
          expires: Infinity
        });
      }

    // window.top.location.href = './trade.html';
    // window.top.location.href = getTradePageUrl(); //getTradePageUrl是r.js里的函数。

      return data.token;
    }, (data)=>{
      if (data.message === '用户不存在') {
        this._showError($('.J_SubmitWrapper'), '您还未注册');
      } else if (data.message === '验证码错误') {
        this._showError($('.J_GetCode').parent(), '验证码错误');
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
        password: md5(real),
        wl: getWLName()
      }
    }).then((data)=>{
      Cookie.set('real_token', data.data.real_token, {
        expires: $Global.getRealPasswordExpireTime()
      });
      location.href = './trade.html';
      // window.top.location.href = getTradePageUrl(); //getTradePageUrl是r.js里的函数。
    }, (data)=>{
      this._showError($('.J_SubmitWrapper'), '手机号或交易密码错误');
    });
  }
}

new Login();