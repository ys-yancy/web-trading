/**
 * 用户个人信息 & 修改交易密码
 */

'use strict';

require('./index.css');
var Base = require('../../../../../app/core');
var app = require('../../../../../app');
var Config = require('../../../../../app/config');
var message = require('../message');
var toast = require('../../../../../common/toast');
var login = require('../../../../../app/login');
var tmpl = require('./index.ejs.html');
var validateIdCard = require('../../../../../lib/validate-idcard');
var ImageCaptcha = require('../../../../../common/image-captcha');
var Toast = toast;

export default class Profile extends Base {
  constructor(config) {
    super(config);

    this._bind();
    this._render();
  }

  _bind() {
    var doc = $(document);
    // 显示/隐藏 修改用户名
    this.el.on('click', '.J_Edit', (e) => {
      var curEl = $(e.currentTarget);
      var parent = curEl.parent();

      parent.addClass('active');
      $('input', parent).focus();
    });

    // 保存用户名
    this.el.on('click', '.J_SaveNickname', _.bind(this._saveNickname, this));

    // 获取验证码
    this.el.on('click', '.J_GetCode', _.bind(this._getImageCode, this));

    this.el.on('click', '.get-captcha', _.bind(this._getVCode, this));

    // 退出登录
    // this.el.on('click', '.J_Exit', _.bind(this._exit, this));

    // 显示修改交易密码
    this.el.on('click', '.J_ChangePassowrd', _.bind(this._showChangePassword, this));
    this.el.on('click', '.J_ClosePassword', _.bind(this._closeChangePassword, this));

    // 修改交易密码
    this.el.on('click', '.J_Confirm', _.bind(this._updatePassword, this));

  }

  _saveNickname(e) {
    var self = this;
    var curEl = $(e.currentTarget),
      parentEl = curEl.parents('.J_Nickname'),
      inputEl = $('input', parentEl),
      nickname = inputEl.val();

    if (!nickname) {
        new Toast('昵称不能为空！');
        return;
    }

    this.ajax({
      url: '/v1/user',
      type: 'put',
      data: {
        access_token: this.cookie.get('token'),
        nickname: nickname
      }
    }).then(function(data) {
      message.hideError(parentEl);
      parentEl.removeClass('active');
      $('.val', parentEl).text(nickname);
      $('header .account .name').text(nickname);
      self.cookie.set('nickname', nickname);
      app.success('修改昵称成功！');
      return;
    });
  }

  _getVCode(e) {
    e.preventDefault();
    var self = this;
    var curEl = $(e.currentTarget);
    var passwd1 = $('.J_Password').val(),
        passwd2 = $('.J_RePassword').val();

    if (curEl.hasClass('get-code')) {
         if ( !passwd1 || !passwd2 ) {
            new Toast('密码不能为空！');
            return;
         } 
         if ( passwd1 != passwd2) {
             new Toast('两次输入密码不一致！');
             return;
         }
     }

    var whitelabel = getWhitelabelCodename();

    this.ajax({
      url: '/v1/captcha/' + self.account.phone,
      type: 'post',
      crossDomain: true,
      data: {
          cc: 86,
          captcha: $('.J_ImageCode', '.profile-wrapper').val(),
          wl:whitelabel
      }
    }).then((data) => {
      if (data.status == 200) {
        curEl.val('短信发送成功');
        setTimeout(() => {
          curEl.val(60);
          this._countdown(curEl);
        }, 1000);
      } else {
        new Toast('图片验证码错误！');
        this._getImageCode();
      }
    },() => {
      new Toast('图片验证码错误！');
      this._getImageCode();
    })
  }

  _getImageCode() {
    var imgEl = $('.J_CodeImage', '.profile-wrapper');
    var whitelabel = getWhitelabelCodename();
    this.ajax({
      url: '/v1/imagevcode/' + this.account.phone,
      type: 'get',
    }).then((data) => {
      data = data.data;
      imgEl.prop('src', data);
    })
  }

  _getCode(e) {
    var curEl = $(e.currentTarget);

    this._countdown(curEl);
    var whitelabel = getWhitelabelCodename();
    this.ajax({
      url: '/v1/captcha/' + this.account.phone,
      type: 'post',
      data: {
        cc: 86,
        wl: whitelabel
      }
    });
  }

  _countdown(el) {
    var self = this;
    var count = 60;

    el.text(count);
    el.prop('disabled', true);

    function coundown() {
      self.timer = setTimeout(function() {
        var val = el.text();
        if (val == 0) {
          el.text('重新获取');
          el.prop('disabled', false);
        } else {
          val -= 1;
          el.text(val);
          coundown();
        }
      }, 1000);
    }
  }

  // _exit(e) {
  //   login.logout();
  // }



  _showChangePassword(e) {
    $('.J_PasswordWrapper', this.el).show();
  }

  _closeChangePassword(e) {
    $('.J_PasswordWrapper', this.el).hide();
  }


  _updatePassword(e) {
    var self = this;
    var curEl = $(e.currentTarget);
    var parentEl = curEl.parents('.J_PasswordWrapper');
    var parent = curEl.parent('.wrapper');
    e.preventDefault();

    if (curEl.prop('disabled')) {
      return;
    }

    var params = this._validate(parentEl);

    if (!params) {
      return;
    }

    params = _.extend({
      phone: this.account.phone,
      cc: 86,
      access_token: this.cookie.get('token')
    }, params);

    this.ajax({
      url: '/v1/user/real/tradepassword/set/',
      type: 'post',
      data: params,
      hideError: true
    }).then((data) => {
      clearTimeout(self.timer);
      app.success('修改交易密码成功！');
      message.hideError(parent);
      curEl.prop('disabled', false);
      $('input', parentEl).val('');
      $('.get-captcha', parentEl).text('获取验证码');
    }, function(data){
        new Toast('验证码错误!');
        return;
    });

  }

  _validate(containerEl) {
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
      message.showError(passwordParentEl, '请输入交易密码');
      return;
    } else {
      message.hideError(passwordParentEl);
    }

    if (rePassword !== password) {
      message.showError(rePasswordParentEl, '两次输入的交易密码不一致');
      return;
    } else {
      message.hideError(rePasswordParentEl);
    }

    if (!code) {
      message.showError(codeParentEl, '请输入验证码');
      return;
    } else {
      message.hideError(codeParentEl);
    }

    return {
      password: password,
      vcode: code
    };
  }

  _render() {
    this.getAccount().then((account) => {
      this.account = account;
      if (account.avatar) {
        account.avatar = Config.getAvatarPrefix(account.avatar);
        
      } else {
        account.avatar = getDefaultAvatarUrl();
      }
      var data = {
        img: account.avatar,
        phone: account.phone,
        nickname: account.nickname
      };
      this.broadcast('get:user:name:phone:img', data);
      this.render(tmpl, data, this.el);
      this._getImageCode();
    });
  }

}