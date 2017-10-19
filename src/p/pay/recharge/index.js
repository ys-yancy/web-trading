"use strict";

var Base = require('../../../app/base');
var Uri = require('../../../app/uri');
var Header = require('../../../common/header');
var Verify = require('./verify');
var Dialog = require('./dialog');
var bonusTmpl = require('./bonus.ejs.html');

class Recharge extends Base {
    constructor() {
        super();

        this.login().then(() => {
            new Header();
            this.verify = new Verify({
                parent: this
            });
            this._bind();
            this._getBonus();
        });
    }

    _bind() {
        var doc = $(document);

        $('#J_Form').on('submit', _.bind(this._submit, this));
        doc.on('mouseenter', '.J_BonusWrapper', _.bind(this._enter, this));
        doc.on('mouseleave', '.J_BonusWrapper', _.bind(this._leave, this));
        
        $('.logo-link').attr("href", getHomeUrl());
        $('.company-name').val(getCompanyName());
        $('.avatar-img').attr('src', getDefaultAvatarUrl());
        
        $('.extra').html(getExtraHtml())
        $('.statement-link').text("我已阅读并同意 《" + getCompanyName() + "用户注册协议》");
        $('.view-bank').attr("href", getBankListHref());

        if ( getWLName() == 'thetradestar' ) {
            $('.num').attr('placeholder','请输入充值金额');
            $('.extra-money').attr('placeholder', '— —')
            $('.desc_sign').hide();
        }
    }

    _enter(e) {
        $('#J_Bonus').addClass('show');
    }

    _leave(e) {
        $('#J_Bonus').removeClass('show');
    }

    _submit(e) {
        e.preventDefault();

        var formEl = $('form');

        if (!this.verify.validate()) {
            return;
        }

        this._superStarPay();
       
    }

    _superStarPay() {
        var self = this;
        var param = {
            access_token: this.cookie.get('token'),
            amount: $('.num').val(),
            channel: 'card',
        }
        console.log(param)
        self.ajax({
            url: getIsThirdPartyPayUrl(),
            type: 'POST',
            data: param,
        })
        .then(function( data ) {
            var url = data.data.post_url + '?' + data.data.post_data;
            self.postURL(url);

        },function( err ) {
            
        })
    }

    _getBonus() {
        this.ajax({
            // url: '/v1/config',
            url: '/v1/deposit_bonus/config',
            data: {
                access_token: this.cookie.get('token')
            }
        }).then((data) => {
            console.log(data)
        });

        this.ajax({
            // url: '/v1/config',
            url: '/v1/deposit_bonus/config',
            data: {
                access_token: this.cookie.get('token')
            }
        }).then((data) => {
            data = data.data.config.deposit_bonus.real;
            this.bonusRate = data.ratio;
            this.render(bonusTmpl, data, $('#J_Bonus'));

            if ( getWLName() == 'thetradestar' ) {
                $('.de_sign').hide();
            }
        });
    }

    countBonus(val) {

        var bonus = 0;

        this.bonusRate = this.bonusRate.sort(function(val1, val2) {
            if (val1.limit > val2.limit) {
                return -1;
            } else if (val1.limit === val2.limit) {
                return 0;
            } else {
                return 1;
            }
        });

        for (var i = 0, len = this.bonusRate.length; i < len; i++) {
            var deposit = this.bonusRate[i];

            if (val >= deposit.limit) {
                bonus = val * deposit.ratio;
                break;
            }
        }

        return bonus.toFixed(2);
    }

    postURL(url) {
        var form = document.createElement("FORM");
        form.method = "POST";
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

}

new Recharge();