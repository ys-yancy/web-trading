"use strict";
var _ = require('../lib/underscore');
var Config = require('./config');
var errorMessage = require('./error');
var event = require('./event');

module.exports = {
  groupPriceUrl: getGroupPriceUrl(),

  priceUrl: getPriceUrl(),
  candleUrl: getCandleUrl(),
  ajax: function(options) {
    var url = options.url;
    var self = this;

    if (!options.unjoin) {
      url = Config.getAjaxPrefix() + options.url;
    }

    if (!options.unjoin) {
      url = Config.getAjaxPrefix() + options.url;
    }

    return new Promise(function(resolve, reject) {
      var defaultOptions = {
        data: {},
        type: 'get',
        dataType: 'json',
        success: function(data) {
          if (data.status == 200) {
            resolve(data);
          } else {
            // 如果是登录下行403, 那么这里不处理
            if (data.status !== 0 && !(data.status == 403 && url.indexOf('login') != -1)) {

              if (data.status == 500 && (data.message.indexOf('Connection aborted') != -1 || data.message.indexOf('Read timed out') != -1)) {
                // 域名解析错误不提示
              }
              // 图片数字验证码错误
              else if (data.status == 400 && data.message === "image_vcode error"){
                var a = 0;
              }
              // Guide页面已注册手机不提示错误
              // else if (data.status == 400 && url.indexOf('/user') != -1) {
              //   var a = 0;
              // }
              // // 输入兑换码错误
              // else if ((data.status == 405 || data.status == 404 || data.status == 406) && url.indexOf('/promocode') != -1) {
              //   var a = 0;
              // }

              // 这里需要判断如果设置了交易密码, 就弹输入交易密码, 否则弹设置交易密码
              else if (data.status == 1413) {
                Cookie.expire('real_token');

                location.reload();
              }

              /*
              // 这里需要弹出登录框, 同时要注意只能弹一次, 因为有可能并行下来很多1403
              else if (data.status = 1403) {
                  Cookie.expire('token');
              }
              */
              else {
                var errorCode = new String(data.status);

                var str = errorCode + ": ";
                if (errorMessage[errorCode])
                  str += errorMessage[errorCode];
                else
                  str += "未知错误";

                if (!options.hideError) {
                  self.__message(str);
                }
              }

            }

            reject(data);
          }
        },
        error: function(e) {
          // 0 是成功
          if (e.status !== 0 && !options.hideError) {

            var errorCode = new String(e.status);

            var str = errorCode + ": ";
            if (errorMessage[errorCode])
              str += errorMessage[errorCode];
            else
              str += "未知错误";

            self.__message(str);
          }

          // 0 是成功
          reject(e);
        }
      };

      options = _.extend(defaultOptions, options);
      options.url = url;

      $.ajax(options);
    });
  },

  __message(message) {
    event.broadcast('app:message', { message: message });
  },

  postURL: function(url) {
    var form = document.createElement("FORM");
    form.method = "POST";
    form.target = '_blank';
    form.style.display = "none";
    document.body.appendChild(form);
    form.action = url.replace(/\?(.*)/, function(_, urlArgs) {
      urlArgs.replace(/\+/g, " ").replace(/([^&=]+)=([^&=]*)/g, function(input, key, value) {
        input = document.createElement("INPUT");
        input.type = "hidden";
        input.name = decodeURIComponent(key);
        input.value = decodeURIComponent(value);
        form.appendChild(input);
      });
      return "";
    });
    form.submit();
  }
};