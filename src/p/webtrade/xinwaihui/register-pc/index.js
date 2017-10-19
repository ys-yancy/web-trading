"use strict";

var Base = require('../../../../app/base');
var Uri = require('../../../../app/uri');
var Cookie = require('../../../../lib/cookie');
var md5 = require('../../../../lib/md5');
var qrcode = require('../../../../lib/qrcode');
var Util = require('../../../../app/util');
var Config = require('../../../../app/config');
// var jquery_qrcode = require('../../../lib/jquery.qrcode.min');
var jquery_qrcode = require('../../../../lib/jquery.qrcode-0.12.0');
var toast = require('../../../../common/toast');
var Toast = toast;
class Register extends Base {
  constructor() {
    super();
    this._bind();
    
    
    jQuery('#qrcodeTable').qrcode({
                render  : "image",
                text    : getMobileRegisterLink(), // getMobileRegisterLink() 是r.js里的。
                size    : 173,
        });
    // jQuery('#img-logo').attr("src", getLogoUrl()); // getLogoUrl 是r.js里的。
    jQuery('#logo-wrapper').attr("class", getLogoBackgroudStyle()); // getLogoBackgroudStyle 是r.js里的。
    
  }

  _bind() {
    var doc = $(document);
    this._slideVerify();
    doc.on('click', '.J_GetCode', _.bind(this._getVCode, this));

    $('.J_Username').on('focusout', _.bind(this._verifyUsername, this));

    // $('.J_RealPassword').on('focusout', _.bind(this._verfiyRealPassword, this));
    $('.J_Code').on('focusout', _.bind(this._verifyCode, this));

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

  _slideVerify() {
    var nc = new noCaptcha();
    var nc_appkey =  Config.getAliyunAppkey(); // 应用标识,不可更改
    var nc_scene = 'register';  //场景,不可更改
    var nc_token = [nc_appkey, (new Date()).getTime(), Math.random()].join(':');
    var nc_option = {
        renderTo: '#dom_id',//渲染到该DOM ID指定的Div位置
        appkey: nc_appkey, 
        scene: nc_scene,
        token: nc_token,
        //trans: '{"name1":"code0"}',//测试用，特殊nc_appkey时才生效，正式上线时请务必要删除；code0:通过;code100:点击验证码;code200:图形验证码;code300:恶意请求拦截处理
        callback: function (data) {// 校验成功回调
          console.log(data)
            document.getElementById('csessionid').value = data.csessionid;
            document.getElementById('sig').value = data.sig;
            document.getElementById('token').value = nc_token;
            document.getElementById('scene').value = nc_scene;
            $('.click-verify').show();
            $('.slide-verify').hide();
        },
        error: function (s) {
          // console.log()
        },
        verifycallback: function (data) {
            if (data.code == "200") {
            }
        }
    };
    nc.init(nc_option);

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
// 验证是否勾选了 同意协议的 勾。
  _verifyAgree(e, hideMessage) {
    var curEl = $((e && e.currentTarget) || '#cboxAgreed'),
      val = curEl.val(),
      parent = curEl.parent('.J_Wrapper'),
      message;
    if (!$('#cboxAgreed')[0].checked) {
      message = '需要勾选 我同意并遵守新外汇网站注册协议 才能进行注册。';
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
    var tel = $('.J_Username').val();

    if (curEl.hasClass('disable')) {
      return;
    }
    if (!this._verifyUsername()) {
      return;
    }


    this._countdown(curEl);
    
    //getWhitelabelCodename是r.js里的函数。
    var whitelabel = getWhitelabelCodename();
    this.ajax({
      url: '/v1/aliyun_captcha/' + tel + '/?',
      type: 'post',
      crossDomain: true,
      data: {
        cc: 86,
        wl: whitelabel,
        csessionid:document.getElementById('csessionid').value,
        sig:document.getElementById('sig').value,
        token:document.getElementById('token').value,
        scene:document.getElementById('scene').value
      }
    }).then((data) => {
      $('.J_Code').prop('disabled', false)
    }, function(data) {
      console.log(data);

      $('.J_Code').prop('disabled', false)
    });
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
        !this._verifyCode(undefined, true) ||
        !this._verifyAgree(undefined, true) // || 
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
  _submit(e) {
    e.preventDefault();

    if (!this._verifyUsername() || !this._verifyCode() || !this._verifyAgree()
        // || !this._verfiyRealPassword()
    ) {
      return;
    }
    var tel = $('.J_Username').val().trim(),
      vcode = $('.J_Code').val().trim();


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
      refer: getRegisterReferCode(), // getRegisterReferCode()从r.js里来
      source: getRegisterSource(),// getRegisterSource()从r.js里来
      wl: getWLName(),// getWLName()从r.js里来
    };
    this.register(d).then(() => {
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
                // window.top.location.href = 'https://wt-xinwaihui.invhero.com/xinwaihui/s/webtrade/trade.html';
                window.top.location.href = 'http://wt.xinwaihui.com/wt.html';
                
              }, 1500);
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
      // window.top.location.href = 'https://wt-xinwaihui.invhero.com/xinwaihui/s/webtrade/trade.html';
      window.top.location.href = 'http://wt.xinwaihui.com/wt.html';
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
          new Toast('注册成功');
          
          
          if (getRegisterReferCode()) {
            this._getLottery();
          } else {
            setTimeout(function() {
                // window.top.location.href = 'https://wt-xinwaihui.invhero.com/xinwaihui/s/webtrade/trade.html';
                window.top.location.href = 'http://wt.xinwaihui.com/wt.html';
              }, 1500);
          }
      
          //return data.token;
        }, (data) => {
              if (data.status != 200) {
                this._showError($('.J_SubmitWrapper'), data.message);
              }
            }
        );
  }
  
  
}

new Register();