/**
 * 出金板块
 */

 'use strict';

require('./index.css');
var Base = require('../../../../../app/core');
var app = require('../../../../../app');
var Config = require('../../../../../app/config');
var message = require('../message');
var toast = require('../../../../../common/toast');
var tmpl = require('./withdraw.ejs.html');
var validateIdCard = require('../../../../../lib/validate-idcard');
var Toast = toast;

export default class Wdraw extends Base {
	constructor(config) {
    super(config);
    
    this._initAttrs()
    this._bind();
  }

  _bind () {
  	var doc = $(document);
  	$('#truephone').val(this.cookie.get('phone'));//用户手机号
  	$('.E_amount_itt,.E_amount_i').attr('placeholder',getMinWithdrawWL());//默认出金金额

  	//弹出出金页面
  	// doc.on('click','.extract',_.bind(this._saveMony, this));
    doc.on('click', '.extract', _.bind(this._saveMony, this));
  	//关闭出金页面
  	doc.on('click','.closeX',_.bind(this._closeMonyPage, this));
  	//添加银行卡
  	doc.on('change','.bankContent_o',this._add_back_card);
  	//确认提交
  	doc.on('click','.add_ackBtn,.ackBtn',_.bind(this._submit, this));
  	//上传照片
  	doc.on('change', '.upload-input', _.bind(this._preview, this));

  	//失焦验证
    doc.on('blur', '.J_BankName', _.bind(this._vaildateCardName, this));
    doc.on('blur', '.J_BankName_tt', _.bind(this._vaildateCardName, this));
    doc.on('blur', '.J_CardName', _.bind(this._vaildateCardName, this));
    doc.on('blur', '.J_CardId', _.bind(this._vaildateCardId, this));
    doc.on('blur', '.J_BankId', _.bind(this._vaildateBankId, this));
    doc.on('blur', '.E_amount_itt', _.bind(this._vaildateEmpty, this));
    doc.on('blur', '.E_amount_i', _.bind(this._vaildateEmpty, this));
    doc.on('blur', '#obligatephone', _.bind(this._vaildatePhone, this));
    doc.on('blur', '.J_BankName_tt', _.bind(this._vaildateName_tt, this));
  }

  //提取资金页面
  _saveMony () {
    $('.user_name_').html(getCompanyName())
    // $(".draw_down").show()
    $('.upload-input').val("");
    this.ajax({
      url: '/v1/user/real/withdraw/manually/',
       data: {
          access_token: this.cookie.get('token'),
          real_token: this.cookie.get('real_token')
        }

    }).then((data)=>{
      data = data.data;
      $('#J_Loading_w').hide()
      $('.J_BankName_tt').attr('true_name',data.true_name)
      $('.E_amount_i2').val(data.extractable_amount)
      if ( data.cards.length==0 ) {
        $(".add_pop_up_box").show()
        $('.I_content').hide();
      }else{
        $('.I_content').show();
        $(".add_pop_up_box").hide()
        $('.bankContent_o').empty()
        $.each(data.cards,function (index,item) {
          $('.bankContent_o').append($('<option/>').text(item.bank_name+'('+item.card_no.replace(/^(\d{4})\d+(\d{4})$/,"$1****$2")+')').attr('value',item.bank_code).attr('codeId',item.card_no))
        })
        $('.bankContent_o').append($('<option/>').text('添加银行卡').attr('value','new'))
      }
      this.el.show()
    })
  };

  //关闭提取资金页面
  _closeMonyPage () {
  	$('#J_Loading_w').show()
    $(".J_withdraw,.I_content,.add_pop_up_box").hide();
    $('.preview').html("")
    $('.error').removeClass('error');
    $('.err').remove()
    $('.J_CardName,.J_CardId,#obligatephone,.J_BankId,.J_BankName_tt').val("")
  }

  //添加新银行卡的事件
  _add_back_card () {
    if ($(this).val()==='new') {
      $('.I_content').hide();
      $(".add_pop_up_box").show()
    }
  }

  //新银行卡页面的确认提取资金事件
  _submit(e) {
      var self = this;
      var curEl = $(e.currentTarget);
      if ( $('.I_content').css('display')==='none' ) {
      	if (!this._validates()) {
        	return;
      	}
      }else{
      	if (!this._validates_tt()) {
        	return;
      	}
      }
    
      var params = this._getParams();
      if ( $('.I_content').css('display')==='none' ) {
      	  if ($('.J_CardFront').length > 0 && !params.id_front){
          	new Toast('请上传身份证正面照片');
          	return;
	      }
	      if ($('.J_CardBack').length > 0 && !params.id_back){
	        new Toast('请上传身份证背面照片');
	        return;
	      }
	      if ($('.J_CardFront').length > 0 && !params.card_front){
	        new Toast('请上传银行卡正面照片');
	        return;
	      }
	      if ($('.J_CardFront').length > 0 && !params.card_back){
	        new Toast('请上传银行卡背面照片');
	        return;
	      }
      }
    
      $('.add_ackBtn,ackBtn').attr("disabled",true);
      $(".add_ackBtn p,.ackBtn p").text("处理中...").attr("disabled",true).css("background","gray")
      if(!this.onlyOne){
        this.onlyOne = true;
        this.ajax({
            url: '/v1/user/real/withdraw/manually/',
            type: 'post',
            data: params,
            hideError: true
        }).then(function(data) { 
          self.onlyOne = false;
          $('.preview').html("");
          // $('#J_Loading_w').show();
          $('.J_CardName,.J_CardId,#obligatephone,.J_BankId,.J_BankName_tt,.E_amount_itt').val("")
          $(".add_ackBtn p,.ackBtn p").text("确认提取").attr("disabled",false).css("background","#3ab8e6")
          $('.add_ackBtn,.ackBtn p').attr("disabled",false)
          $(".J_withdraw, .draw_down,.I_content,.add_pop_up_box").hide();
          new Toast('您的出金申请已经提交成功');
          
        }, function(data){
          self.onlyOne = false;
          // $('#J_Loading_w').show();
          $(".add_ackBtn p,.ackBtn p").text("确认提取").attr("disabled",false).css("background","#3ab8e6")
          new Toast(data.message + ',请修改后再提交');
        });
      }
    }
    //添加新银行卡的验证
  _decide(curEl, type) {
      var val = curEl.val(),
        val = val && val.trim();

      if (type === 'empty') {
        if (!val) {
          this._showError(curEl, '不能为空');
          return;
        }
      }

      if (type === 'cardId') {
        if (!val) {
          this._showError(curEl, '不能为空');
          return;
        } else if (!validateIdCard(val)) {
          this._showError(curEl, '身份证号码错误');
          return;
        }
      }

      if (type === 'm_phone') {
        if (!val) {
          this._showError(curEl, '不能为空');
          return;
        }else if (!(/^1[34578]\d{9}$/.test(val))) {
          this._showError(curEl, '手机号错误');
          return;
        }
      }

      /**
       * 1|允许出金条件修改为：卡号位数等于16位、18位、19位允许出金。
       * 2、卡号位数为15位、16位时，卡号前四位是6225、4514、4392、4367、5187、5236、5218、5194、5123、3568则判断为信用卡，
       * 输入框下方文案提示“十分抱歉！暂时不支持出金到信用卡”。
       */

      if (type === 'bankId' && curEl.parent().css('display') !== 'none') {
        if (!val) {
          this._showError(curEl, '不能为空');
          return;
        } else if (!/^\d{19}$/.test(val) && !/^\d{18}$/.test(val)) {
          var msg = '银行卡号错误';

          if ((/^\d{16}$/.test(val) || /^\d{15}$/.test(val)) && /^(6225)|(4514)|(4392)|(4367)|(5187)|(5236)|(5218)|(5194)|(5123)|(3568)/.test(val)) {
            msg = '十分抱歉！暂时不支持信用卡'
          } else if (/^\d{16}$/.test(val)) {
            this._hideError(curEl);
            return true;
          }

          this._showError(curEl, msg);
          return;
        }
      }

      if (type === 'm_empty') {
        if (!val) {
          this._showError(curEl, '不能为空');
          return;
        } else if (!/^\d+(\.\d+)?$/.test(val)) {
          this._showError(curEl, '金额只能为数字');
          return;
        } else if (parseFloat($('.E_amount_i2').val() || 0) < parseFloat(val)) {
          this._showError(curEl, '出金金额应小于可提金额');
          return;
        } else if (parseFloat(val) < getMinWithdrawWL()) {
          this._showError(curEl, '出金金额应大于' + getMinWithdrawWL() + '美元');
          return;
        }
      }
  

      this._hideError(curEl);
      return true;
  }

    //上传图片的预览
  _preview(e) {
      var self = this;
      var preivewEl = $(e.currentTarget).siblings('.preview');
      // resize and serial image
      var file = e.currentTarget.files[0];
      // Ensure it's an image
      if(file.type.match(/image.*/)) {
          console.log('An image has been loaded');

          // Load the image
          var reader = new FileReader();
          reader.onload = function (readerEvent) {

              console.log('origin image length = ' + reader.result.length);
              var image = new Image();
              image.onload = function (imageEvent) {

                  // Resize the image
                  var canvas = document.createElement('canvas'),
                      max_size = 800,// TODO : pull max size from a site config
                      width = image.width,
                      height = image.height;
                  if (width > height) {
                      if (width > max_size) {
                          height *= max_size / width;
                          width = max_size;
                      }
                  } else {
                      if (height > max_size) {
                          width *= max_size / height;
                          height = max_size;
                      }
                  }
                  canvas.width = width;
                  canvas.height = height;
                  canvas.getContext('2d').drawImage(image, 0, 0, width, height);
                  var dataUrl = canvas.toDataURL('image/jpeg');
                  console.log('resized image length = ' + dataUrl.length);
                  var resizedImage = self._dataURLToBlob(dataUrl);
                  /*
                  $.event.trigger({
                      type: "imageResized",
                      blob: resizedImage,
                      url: url
                  });
                  */
                  preivewEl.html('<img class="img" src="' + dataUrl + '">');
                  self._hideError(preivewEl);
              }
              image.src = readerEvent.target.result;
              // preivewEl.html('<img class="img" src="' + readerEvent.target.result + '">');
              // self._hideError(preivewEl);
          }
          reader.readAsDataURL(file);
      }

      /*
      // if (Config.isAndroidAPK()) {
        var reader = new FileReader();
        console.log("reader: " + reader);
        reader.onloadend = function() {
          var dataUrl = reader.result;
          console.log("dataUrl.length = " + dataUrl.length);
          if (reader.error != null) {
            console.log("input_img_error reader.error.code=" + reader.error.code);
            var debug_url = 'https://p.invhero.com/debug/android/input_img_error/?error_code=' + this.error.code + "&access_token=" + Cookie.get('token');
            console.log("debug_url: " + debug_url);
            self.ajax({
              url: debug_url,
              type: 'post',
              unjoin: true,
              data: {}
            }).then(function(data) {
              console.log("input_img_error debug done.");
            });
          } else {
            console.log("input_img_ok.");
          }
          var index = 0;
          while (index + 512 < dataUrl.length) {
            var res = dataUrl.substring(index, index + 512);
            console.log(res);
            index += 512;
          }
          preivewEl.html('<img class="img" src="' + dataUrl + '">');
          self._hideError(preivewEl);
        }
        reader.readAsDataURL(e.currentTarget.files[0]);
      */
      // } else {


      //   lrz(e.currentTarget.files[0], {
      //     // 压缩开始
      //     before: function() {
      //       console.log('压缩开始');
      //     },
      //     // 压缩失败
      //     fail: function(err) {
      //       console.error(err);
      //     },
      //     // 压缩结束（不论成功失败）
      //     always: function() {
      //       console.log('压缩结束');
      //     },
      //     // 压缩成功
      //     done: function(results) {
      //       // 你需要的数据都在这里，可以以字符串的形式传送base64给服务端转存为图片。
      //       preivewEl.html('<img class="img" src="' + results.base64 + '">');

      //       self._hideError(preivewEl);
      //     }
      //   });
      // }
  }
  _validates() {
      var self = this;
      var els = ['.J_CardName', '.J_CardId', '.J_BankId','#obligatephone','.J_BankName','.E_amount_i'];
      var types = ['empty', 'cardId', 'bankId','empty','empty','m_empty'];
      var pass = true;

      for (var i = 0, len = els.length; i < len; i++) {
        var el = $(els[i]);
        $.each(el, function(index, item) {
          item = $(item);
          if (item.hasClass('new') && self.newBank && i === 2) {
            return;
          }

          if (item.hasClass('J_BankId')) {

            if (!self.newBank) {
              if (index === 1) {
                return;
              }
            }
          }
          var result = self._decide(item, types[i]);

          if (!result) {
            pass = false;
          }
        });
      }

      return pass;
  }

  _validates_tt() {
      var self = this;
      var els = ['.J_BankName_tt','.E_amount_itt'];
      var types = ['empty','m_empty'];
      var pass = true;

      for (var i = 0, len = els.length; i < len; i++) {
        var el = $(els[i]);
        $.each(el, function(index, item) {
          item = $(item);
          if (item.hasClass('new') && self.newBank && i === 2) {
            return;
          }

          if (item.hasClass('J_BankId')) {

            if (!self.newBank) {
              if (index === 1) {
                return;
              }
            }
          }
          var result = self._decide_tt(item, types[i]);
          if (!result) {
            pass = false;
          }
        });
      }
      return pass;
  }

  _decide_tt(curEl, type) {
      var val = curEl.val(),
        val = val && val.trim();
        var ct_name = curEl.attr('true_name')
      if (type === 'empty') {
        if (!val) {
          this._showError(curEl, '不能为空');
          return;
        }
      }

      if ( type === 'm_Bankname' ) {
        if (!val||val!=ct_name) {
          this._showError(curEl, '开户名错误');
          return;
        }
      }

      if (type === 'm_empty') {
        if (!val) {
          this._showError(curEl, '不能为空');
          return;
        } else if (!/^\d+(\.\d+)?$/.test(val)) {
          this._showError(curEl, '金额只能为数字');
          return;
        } else if (parseFloat($('.E_amount_i2').val() || 0) < parseFloat(val)) {
          this._showError(curEl, '出金金额应小于可提金额');
          return;
        } else if (parseFloat(val) < getMinWithdrawWL()) {
          this._showError(curEl, '出金金额应大于' + getMinWithdrawWL() + '美元');
          return;
        }
      }
  

      this._hideError(curEl);
      return true;
  }

  _dataURLToBlob(dataURL) {
      var BASE64_MARKER = ';base64,';
      if (dataURL.indexOf(BASE64_MARKER) == -1) {
          var parts = dataURL.split(',');
          var contentType = parts[0].split(':')[1];
          var raw = parts[1];

          return new Blob([raw], {type: contentType});
      }

      var parts = dataURL.split(BASE64_MARKER);
      var contentType = parts[0].split(':')[1];
      var raw = window.atob(parts[1]);
      var rawLength = raw.length;

      var uInt8Array = new Uint8Array(rawLength);

      for (var i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
      }

      return new Blob([uInt8Array], {type: contentType});
  }

  _showError(curEl, message) {
      var parent = $(curEl.parents('div')[0]);
      var messageEl = curEl.siblings('.err');

      if (messageEl.length === 0) {
        curEl.after('<p class="err">' + message + '</p>');
      } else {
        messageEl.text(message);
        messageEl.show();
      }
      parent.addClass('error');
  }

  _hideError(curEl) {
      var parent = $(curEl.parents('div')[0]);
      var messageEl = curEl.siblings('.err');

      parent.removeClass('error');
      messageEl.hide();
  }

  _vaildateCardName(e) {
      var curEl = $(e.currentTarget);
      this._decide(curEl, 'empty');
  }

  _vaildateCardId(e) {
      var curEl = $(e.currentTarget);
      this._decide(curEl, 'cardId');
  }

  _vaildateBankId(e) {
      var curEl = $(e.currentTarget);
      this._decide(curEl, 'bankId');
  }

  _vaildateEmpty(e) {
      var curEl = $(e.currentTarget);
      this._decide(curEl, 'm_empty');
  }

  _vaildatePhone(e) {
      var curEl = $(e.currentTarget);
      this._decide(curEl, 'm_phone');
  }

  _vaildateName_tt (e) {
      var curEl = $(e.currentTarget);
      this._decide(curEl, 'm_phone');
  }

  _getParams() {
        //判断获取那个页面内容的银行
        var V_erdict;
        if ($(".I_content").css('display')=='none') {
          V_erdict='.bankContent_t';
        }else{
          V_erdict='.bankContent_o';
        }
        return {
          access_token: this.cookie.get('token'),
          real_token: this.cookie.get('real_token'),
          bank_name:$(V_erdict).find('option:selected').text(),//下拉菜单内容
          bank_code:$(V_erdict).find('option:selected').val(),
          card_no: $('.J_BankId').val()||$('.bankContent_o').find('option:selected').attr("codeId"),//银行卡号
          card_front: $('img', '.J_BankFront').attr('src'),//银行卡正面
          card_back: $('img', '.J_BankBack').attr('src'),//银行卡反面
          id_front: $('img', '.J_CardFront').attr('src'),//身份证正面
          id_back: $('img', '.J_CardBack').attr('src'),//身份证反面
          id_no: $('.J_CardId').val(),//身份证号
          true_name: $('.J_CardName').val(),//身份证姓名
          amount : $('.E_amount_i').val()||$('.E_amount_itt').val()//提取金额
        }
  }

  _initAttrs() {
    this.el.html(tmpl);
  }

}