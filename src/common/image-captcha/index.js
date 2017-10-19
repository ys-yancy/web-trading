"use strict";
require('./index.css');
var Base = require('../../app/base');
var tmpl = require('./index.ejs.html');

export default class ImageCaptcha extends Base {
    constructor(tel) {
        super();
        this.tel = tel
        this._render();
        this._initAttrs();
        this._bind();
    }

    _bind() {

        var doc = $(document);

        doc.on('click', '.get-captcha', $.proxy(this._submit, this));
        doc.on('click', 'img.captcha', $.proxy(this._update, this));
        doc.on('click', '.close-captcha', $.proxy(this._hides, this));
        // this.el.on('touchend', $.proxy(this._end, this));
        // this.el.on('click', $.proxy(this._click, this));
    }

    _move(e) {
        var x = e.changedTouches[0].clientX;
        var y = e.changedTouches[0].clientY;

        x = x - this.width / 2;

        this.el.css({
            left: x < -this.width / 2 ? -this.width / 2 : x,
            top: y - this.height / 2
        })
        e.preventDefault();
        // e.stopPropogation();
    }

    _click() {
        location.href = './cs.html?src=' + encodeURIComponent(location.href);
    }

    _render() {
        // this.renderTo(tmpl, {}, $('body'));
        // console.log($('.code-wrapper'))
    }

    _initAttrs() {
        this.el = $('#J_ImageCaptcha');
        this.width = this.el.width();
        this.height = this.el.height();
        this.captchaVal = '';
    }

    _submit () {
       // var captInput = $(this).parents("form").find('#J_ImageCaptcha .captcha-text' );
       // if (captInput.val()) {
       //    this.captchaVal = captInput.val();
       //    $('#J_ImageCaptcha .wrapper').addClass('success');
       // }
       //console.log ('submit captcha =' + captInput.val());
    }

    _update(e) {

        var curEl = $(e.currentTarget);
        var parent=curEl.parents("form");
            var imgcap =  parent.find('#J_ImageCaptcha');

        imgcap.show();
        // var tel = '13810157999';

        var tel =parent.find('.tel').val();


        var getCodeEl = parent.find('.get-captcha');

        this.ajax({
            url: '/v1/imagevcode/' + tel,
            type: 'get',
            data: {
            }
        }).then(function(data) {
            console.log(data);
            $('.get-captcha').removeClass('disable');
            imgcap.find('.captcha')[0].src = data.data;
        });
    }

    _show( moTel,obj='' ) {

        if(obj){//根据给到的元素去查找验证码元素
            var parent = obj.parents("form");
            var imgcap =  parent.find('#J_ImageCaptcha');
        }else{//
            var parent = $(this).parents("form");
            var imgcap =  parent.find('#J_ImageCaptcha');
        }

        imgcap.show();
        if(moTel){
            var tel =moTel;
        }else{
            var tel =parent.find('.tel').val() ;
        }

        var getCodeEl = parent.find('.get-captcha');

        this.ajax({
          url: '/v1/imagevcode/' + tel,
          type: 'get',
          data: {
          }
        }).then(function(data) {
            $('.get-captcha').removeClass('disable');
            imgcap.find('.captcha')[0].src = data.data;
        });
    }

    _hide(p) {
        // p.find('#captcha-message').html('');
        // p.find('#J_ImageCaptcha .captcha-text').val('');
        // p.find('.image-captcha').hide();
        // p.find('.get-captcha').addClass('disable');
        $('#captcha-message').html('');
        $('#J_ImageCaptcha .captcha-text').val('');
        $('.image-captcha').hide();
        $('.get-captcha').addClass('disable');
    }


    _hides() {
        $('#captcha-message').html('');
        $('#J_ImageCaptcha .captcha-text').val('');
        $('.image-captcha').hide();
        $('.get-captcha').addClass('disable');
    }

    _refresh() {
        // var tel = '13810157999'; 
        var tel = $('.tel').val();
        var getCodeEl = $('.get-captcha');

        this.ajax({
          url: '/v1/imagevcode/' + tel,
          type: 'get',
          data: {
          }
        }).then(function(data) {
            $('.get-captcha').removeClass('disable');
            $('.captcha')[0].src = data.data;
        });
    }

    _getCaptcha() {
        return this.captchaVal;
    }

    _changeClass(c) {
        // 为 guides 页面定制
        if (c == 'guides') {
            $('#J_ImageCaptcha').addClass('image-captcha-guides');
            $('#J_ImageCaptcha .wrapper').removeClass('wrapper');
        }
        else if (c == 'tycoon') {
            $('#J_ImageCaptcha').removeClass('image-captcha');
            $('#J_ImageCaptcha').addClass('image-captcha-tycoon');
            $('#J_ImageCaptcha .wrapper').removeClass('wrapper');
        }
        else if (c == 'haoxin') {
            $('#J_ImageCaptcha').removeClass('image-captcha');
            $('#J_ImageCaptcha').addClass('image-captcha-haoxin');
            $('#J_ImageCaptcha .wrapper').removeClass('wrapper');
        }
        else if (c == 'xwjr') {
            $('#J_ImageCaptcha').removeClass('image-captcha');
            $('#J_ImageCaptcha').addClass('image-captcha-xwjr');
            $('#J_ImageCaptcha .wrapper').removeClass('wrapper');
        }
        else if (c == 'tts') {
            $('#J_ImageCaptcha').removeClass('image-captcha');
            $('#J_ImageCaptcha').addClass('image-captcha-tts');
            $('#J_ImageCaptcha .wrapper').removeClass('wrapper');
        }
        else if (c == 'fxbtg') {
            $('#J_ImageCaptcha').removeClass('image-captcha');
            $('#J_ImageCaptcha').addClass('image-captcha-fxbtg');
            $('#J_ImageCaptcha .wrapper').removeClass('wrapper');
        }

    }
}