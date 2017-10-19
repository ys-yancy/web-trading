"use strict";

var Base = require('../../../app/base');
var Uri = require('../../../app/uri');
var Cookie = require('../../../lib/cookie');
var md5 = require('../../../lib/md5');
// var qrcode = require('../../../lib/qrcode');
var Config = require('../../../app/config');
var Util = require('../../../app/util');
var Toast = require('../../../common/toast');
var NewToast = require('../../../common/newToast');
// var loginTmpl = require('./tmpl/login.ejs.html');
var registerTmpl = require('./tmpl/register.ejs.html');
var resetWordTmpl = require('./tmpl/resetword.ejs.html');

class Login extends Base {
	constructor(config){
		super(config);

		// this._getToken();
		this._bind();
		this._initAttrs();
		// this._render();
	}

	_bind() {
		var doc = $(document);
		$('#J_LogoImg').prop('src', getIndexLogoUrl());
		doc.on('submit', '.J_Form', _.bind(this._actionControls, this));

		// focus
		doc.on('focusout', '.J_Focus', _.bind(this._verifyFocus, this));

		// 图片验证码
		doc.on('focusout', '.J_ImageCode', _.bind(this._verifyImageCode, this));

		// 确认密码
		doc.on('focusout', '.J_Com-passeord', _.bind(this._confirmPassword, this));

		// 获取验证码
		doc.on('click', '.J_GetCode', _.bind(this._getVcode, this));

		// 忘记密码
		doc.on('click', '.reset-password', _.bind(this._showResetPasswordTmpl, this));

		// 注册
		doc.on('click', '.login-register', _.bind(this._showRegisterTmpl, this));

		//  切换账号
		doc.on('click', '.reset-login', _.bind(this._goFirstLoginTmpl, this));

		// 回滚到上一页
		doc.on('click', '.back-icon', _.bind(this._backBeforeTmpl, this));

		// 验证码
		doc.on('click', '.J_ImgCode', _.bind(this._updateImageCode, this));

	}

	_getToken() {
		this.getToken().then(() => {
			this.contentEl.hide();
		    this.secondContentEl.show()
	    }, () => {
	    	this.secondContentEl.hide()
	      	this.contentEl.show();
	    });
	}

	_actionControls(e) {
		e.preventDefault();
		var curFormEl = $(e.currentTarget);
		var sourceForm = curFormEl.attr('data-id');

		var rigisterParams = {
			cc:86,
		    uuid: Util.guid(),
		    nickname: getRegisterDefaultNickname(),
		    refer: getRegisterReferCode() || '',
		    source: getRegisterSource(),
		    wl: getWLName()
		}
		 
		var params = this._getParams(curFormEl, sourceForm);

		var verifySuccess = this._verifyControls(params);

		if ( sourceForm == 'register' ) {
			params = _.extend(params, rigisterParams);
		}

		if (verifySuccess) {
			this._submit(params, sourceForm, curFormEl);
		}
	}


	_submit(params, sourceForm, curFormEl) {
		var url = this._getRequestUrl(sourceForm);
		if (sourceForm.indexOf('login') !== -1) {
			this.login(url, params, curFormEl);
		} else if (sourceForm.indexOf('register') !== -1) {
			this._register(url, params, curFormEl);
		} else if (sourceForm.indexOf('reset_password') !== -1) {
			this._resetPassword(url, params, curFormEl);
		}
	}

	login(url, params, curFormEl) {
		this._login(url, params, curFormEl).then((token) => {
			var password = params.password;
			this._setRealToken(password);
		})
	}

	_login(url, params, curFormEl) {
		params.password = md5(params.password);
		return this._request(url, params, curFormEl).then((data) => {

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
		})
	}

	_setRealToken(password) {
		this.ajax({
		    url: '/v1/user/real/tradepassword/verify/',
		    type: 'post',
		    data: {
		        access_token: Cookie.get('token'),
		        password: password,
		        wl: getWLName()
		    }
		}).then((data)=>{
		    Cookie.set('real_token', data.data.real_token, {
		        expires: $Global.getRealPasswordExpireTime()
		    });
		    location.href = './guide.html';
		      // window.top.location.href = getTradePageUrl(); //getTradePageUrl是r.js里的函数。
		}, (data)=>{
		    // this._showError($('.J_SubmitWrapper'), '手机号或交易密码错误');
		});
	}

	_register(url, params, curFormEl) {
		params.password = md5(params.password);
		this._request(url, params, curFormEl).then((data) => {
			Cookie.set('real_token', data.real_token, {
              expires: Config.getRealPasswordExpireTime()
            });

            Cookie.set('type', 'real');
		    Cookie.set('goType', 'real');

		    Cookie.set('phone', params.phone, {
		      expires: Infinity
		    });
		    Cookie.set('token', data.token, {
		      expires: Infinity
		    });
		    Cookie.set('inviteCode', invite_code, {
		      expires: Infinity
		    });
		    Cookie.set('uuid', data.uuid, {
		      expires: Infinity
		    });

		    if (getRegisterReferCode()) {
			    this._getLottery();
			} else {
		        setTimeout(function() {
		           window.top.location.href = './guide.html';
		        }, 1500);
			}
		})
	}

	_getLottery() {
	    this.ajax({
	      url: '/v1/hongbao/use/',
	      type: 'post',
	      data: {
	        access_token: Cookie.get('token')
	      }
	    }).then(() => {
	      	setTimeout(function() {
	        	window.top.location.href = './guide.html';
	        	// window.top.location.href = getTradePageUrl();
	      	}, 1500);
	  });
  	}

  	_resetPassword(url, params, curFormEl) {
  		this._request(url, params, curFormEl).then((data) => {
  			console.log('reser:success');
  			clearTimeout(this.createCodeCountControl);
  			curFormEl.find('.J_GetCode').val('修改成功');

  			setTimeout(() => {
  				this._backBeforeTmpl();
  				curFormEl.find('.J_GetCode').val('获取验证码');
  			}, 1500)
  		})
  	}

	_request(url, params, curFormEl) {
		var submitEl = curFormEl.find('.J_Submit');
		submitEl.prop('disabled', true);
		return this.ajax({
			url: url,
			type: 'post',
			data: params
		}).then((res) => {
			submitEl.removeProp('disabled');
			return res.data;
		}, (err) => {
			submitEl.removeProp('disabled');
			// new Toast(err.message, 1500);
			new NewToast({
      			refEl: curFormEl.find('.submit'), 
      			message: err.message
      		});
			console.log(err)
		})
	}

	_getVcode(e) {
		var curEl = $(e.target);
		var curFormEl = curEl.parents('form');
		var tel = curFormEl.find('.J_Phone').val();
		var imageCode = curFormEl.find('.J_ImageCode').val();

		this.ajax({
	        url: '/v1/captcha/' + tel,
	        type: 'post',
	        crossDomain: true,
	        data: {
	            cc: 86,
	            captcha: imageCode,
	            wl: getWLName()
	        }
      	}).then((data)=> {
      		if (data.status == 200) {
      			curEl.val('短信发送成功');
      			curFormEl.find('.J_Submit').removeProp('disabled');
      			setTimeout(() => {
      				curEl.val(60);
      				this._createCodeCount(curEl);
      			}, 1000);

      		} else {
      			this._createImageCode(tel, curFormEl)
      			new NewToast({
	      			refEl: curFormEl.find('.submit'), 
	      			message: '图片验证码错误'
      			});
      		}
      		
      	}, () => {
      		// 验证码错误
      		this._createImageCode(tel, curFormEl);
      		new NewToast({
      			refEl: curFormEl.find('.submit'), 
      			message: '图片验证码错误'
      		});
      	})

	}

	_updateImageCode(e) {
		var curEl = $(e.target);
		var formEl = curEl.parents('form');
		var phone = formEl.find('.J_Phone').val();
		if (phone) {
			this._createImageCode(phone, formEl);
		}	
	}

	_createImageCode(tel, formEl) {
		var imgCodeEl = formEl.find('#J_ImgCode');

		this.ajax({
			url: '/v1/imagevcode/' + tel,
            type: 'get'
		}).then((data) => {
			imgCodeEl.prop('src', data.data);
		})
	}

	_createCodeCount(curEl) {
		curEl.prop('disabled', true);
		this.createCodeCountControl = setTimeout(() => {
			var time = parseFloat(curEl.val());

			if ( time == 0 ) {
				clearTimeout(this.createCodeCountControl);
				curEl.removeProp('disabled');
				curEl.val('重新获取');
				return;
			}

			curEl.val(--time);
			this._createCodeCount(curEl);
		}, 1000)
	}

	_verifyControls(params) {
		var verifyResult = true;
		Object.keys(params).forEach((key) => {
			var _verifyFn  = '_verify_' + key;

			if ( !this[_verifyFn](params[key]) ) {
				verifyResult = false;
			}

		});
		return verifyResult;
	}

	_verifyFocus(e) {
		var curEl = $(e.target);
		var parentEl = curEl.parent();
		var val = curEl.val();
		var fn = '_verify_' + curEl.attr('data-focus');
		this[fn](val, parentEl);
	}

	// 图形验证
	_verifyImageCode(e) {
		var curEl = $(e.target);
		var formEl = curEl.parents('form');
		var val = curEl.val();
		if ( !val ) {
			this._showError(curEl.parent(), '不能为空');
			return false;
		}

		this._hideError(curEl.parent());
		formEl.find('.J_GetCode').removeProp('disabled');
		return true;
	}

	_confirmPassword(e) {
		var curEl = $(e.target);
		var formEl = curEl.parents('form');
		var oldPassword = formEl.find('.J_Passeord').val();
		var curPassword = curEl.val();
		if ( oldPassword != curPassword ) {
			this._showError(curEl.parent(), '两次密码不一致');
		} else {
			this._hideError(curEl.parent());
		}
	}

	/**
	 * 验证手机号
	 */

	_verify_phone(tel, parentEl) {
	    if (!tel) {
	    	parentEl && this._showError(parentEl, '不能为空');
	      	return false;
	    }

	    // 验证手机号，默认是11位
	    if (!/^1[3|4|5|7|8][0-9]\d{8}$/.test(tel)) {
	       parentEl && this._showError(parentEl, '手机号错误');
	       return false;
	    }

	    if ( parentEl ) {
	    	var formEl = parentEl.parent();
	    	this._hideError(parentEl);
	    	this._createImageCode(tel, formEl);
	    	var password = formEl.find('.J_Passeord').val();
	    	password && formEl.find('.J_ImageCode').removeAttr('disabled');
	    }

	    return true;
	}

	/**
	 * 验证密码
	 */
	_verify_password(password, parentEl) {
		if (!password) {
			parentEl && this._showError(parentEl, '不能为空');
			return false;
		}

		if ( parentEl ) {
	    	this._hideError(parentEl);
	    	var phone = parentEl.parent().find('.J_Phone').val();
	    	phone && this._verify_phone(phone) && parentEl.parent().find('.J_ImageCode').removeAttr('disabled');
	    }

		return true;
	}

	/**
	 * 验证邮箱
	 */
	
	_verify_email(email, parentEl) {
		if (!email) {
			parentEl && this._showError(parentEl, '不能为空');
			return false;
		}

		return true;
	}

	/**
	 * 验证手机短信验证码
	 */

	_verify_vcode() {
		return true;
		// if () {

		// }
	}

	_showError(parent, message) {
	    var errorEl = $('.J_Message', parent);

	    if (errorEl.length === 0) {
	      errorEl = '<p class="message J_Message">' + message + '</p>';
	      parent.append(errorEl);
	    } else {
	    	errorEl.text(message);
	    }

	    parent.addClass('error');
  	}

	_hideError(parent) {
	    parent.removeClass('error');
	}

	_setTitle(message) {
		var titleEl = $('title');
		titleEl.text(message);
	}

	_getParams(form, sourceForm) {
		var params = {
			phone: $('.J_Phone', form).val(),
			password: $('.J_Passeord', form).val(),
			vcode: $('.J_PhoneCode', form).val(),
		}

		switch(sourceForm) {
			case 'register': 
				params.email = $('.J_Email', form).val();
				break;
			default: 
				break;
		}
		return params;
	}

	_getRequestUrl(sourceForm) {
		var urlParams = {
			'login': '/v1/user/login/real/',
			'first-login': '/v1/user/login/real/',
			'register': '/v1/user/create',
			'reset_password': '/v1/user/real/tradepassword/setnew/'
		}

		return urlParams[sourceForm];
	}

	_showResetPasswordTmpl(e) {
		var contentsWrapperEl = $('.contents-wrapper')
		this.render(resetWordTmpl, {}, this.sliderContentEl);
		contentsWrapperEl.addClass('move');
		this._setTitle('重置密码');
	}

	_showRegisterTmpl() {
		var contentsWrapperEl = $('.contents-wrapper')
		this.render(registerTmpl, {}, this.sliderContentEl);
		contentsWrapperEl.addClass('move');
		this._setTitle('注册');
	}

	_goFirstLoginTmpl() {
		var self = this;
		this.secondContentEl.animate({
			opacity:'0'
		}, 500, function() {
			self.secondContentEl.hide();
			self.contentEl.show();
			self._setTitle('登录');
		})
	}

	_backBeforeTmpl() {
		var contentsWrapperEl = $('.contents-wrapper')
		contentsWrapperEl.removeClass('move');
		this._setTitle('登录');
	}

	_render() {
		this.render(registerTmpl, {}, this.secondContentEl);
		this.render(resetWordTmpl, {}, this.sliderContentEl);
	}

	_initAttrs() {
		this.contentEl = $('.first-content');
		this.secondContentEl = $(".second-content");
		this.sliderContentEl = $('.slider-content');
	}

}

new Login();

