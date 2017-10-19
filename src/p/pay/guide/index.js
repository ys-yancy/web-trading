"use strict";

var Base = require('../../../app/base');
var bankList = require('./bank');
var Header = require('../../../common/header');
var bonusTmpl = require('./bonus.ejs.html');
var Verify = require('./verify');
var Uri = require('../../../app/uri');
var Dialog = require('./dialog');
// var Cookie = require('../../../lib/cookie');

class Guide extends Base {
    constructor() {
        super();

        this.login().then(() => {
            this._payWay();

        this.verify = new Verify({
            parent: this
        });

            new Header();
            this._bind();
        this._getBonus();
        });
        var data;
    }

    _bind() {
        var doc = $(document);

        doc.on('click', '.clearfix .item', _.bind(this._select, this));
        doc.on('click', '.order-bg', _.bind(this._hideorder, this));
        doc.on('click', '.submit', _.bind(this._submit, this));
        doc.on('click', '.closeOrder', _.bind(this._hideorder, this));
        
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

    _payWay() {
        if ( getIsThirdPartyPay() ) {
            var href = './recharge.html';
            window.location.href = href;
        }
    }

    _getBonus() {
        this.ajax({
            // url: '/v1/config',
            url: '/v1/deposit_bonus/config',
            data: {
                access_token: this.cookie.get('token')
            }
        }).then((data) => {
            // console.log(data)
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


    _select(e) {
        var curEl = $(e.currentTarget),
            index = curEl.index();
        var bank = bankList[index];
        var paid_thru = 'chinagpay_web';
        var data =  {"bank":bank.name,"paid_thru":"chinagpay_web","bank_code":bank.code[paid_thru],'ahcode':bank.code['aihuicode'],"paid_thru":paid_thru};

        var bankcode = bank.code[paid_thru];
        var ahcode = bank.code['aihuicode'];
        this.data = data;
        $(".order-bg").show();
        $(".order").show();

        // if (bankcode != '') {
        //     var href = './recharge.html?bank=' + encodeURIComponent(bank.name) + '&bankcode=' + encodeURIComponent(bankcode)+ '&ahcode=' + encodeURIComponent(ahcode) + '&paid_thru=' + paid_thru;
        //     window.open(href);
        // }

        // e.preventDefault();
        //
        // var formEl = $('form');
        //
        // if (!this.verify.validate()) {
        //     return;
        // }
        // if ( getWLName() == 'hwbj' ) {
        //     this._superStarPay()
        // } else {
        //     this._charge(data);
        // }
    }
//
//     this.ajax({
//     url: '/v1/user/real/deposit/chinagpay_web/?',
//     type: 'post',
//     data: {
//         paid_thru: data.paid_thru,
//     bank_code: data.bank_code,
//     amount: 0,
//     access_token: this.cookie.get('token'),
//     back_url: ''
// }
//
// }).then((data) => {
//     data = data.data;
// var url = data.post_url + '?' + data.post_data;
// this.postURL(url);
// }, (data) => {}).catch((e) => {
//     console.log(e);
// })

    _submit(e) {
        e.preventDefault();
        console.log( this.data);

        var formEl = $('form');

        if (!this.verify.validate()) {
            return;
        }

        var amount = $(".item .num").val();

            this.ajax({
    url: '/v1/user/real/deposit/chinagpay_web/?',
    type: 'post',
    data: {
        paid_thru: this.data.paid_thru,
    bank_code: this.data.bank_code,
    amount: amount,
    access_token: this.cookie.get('token'),
    back_url: ''
}

}).then((data) => {
    data = data.data;
var url = data.post_url + '?' + data.post_data;
     this.postURL(url,data)
}, (data) => {}).catch((e) => {
    console.log(e);
})

        // if ( getWLName() == 'hwbj' ) {
        //     this._superStarPay()
        // } else {
        //     this._charge();
        // }

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
            url: '/v1/user/pay/deposit_superstarpay_order/',
            type: 'POST',
            data: param,
        })
            .then(function( data ) {
                // self.onlyOne = true;
                var url = data.data.post_url + '?' + data.data.post_data;
                self.postURL(url);

            },function( err ) {
                // self.onlyOne = true;
                // var dialog = self.dialog;
                // dialog.setContent(data.message);
                // dialog.show();
                // return;
            })
    }

    // _subPayWay(e) {
    //     e.preventDefault();
    //     var self = this;
    //     var params = new Uri().getParams();
    //     var param = {
    //         access_token: '8bc6fa76-274f-4bd3-b08a-7745731ddc90',
    //         appType: 'normal',//data.channel,
    //         amount: 0.1,
    //         bank: params['ahcode'],
    //     }
    //     this.ajax({
    //         url: 'https://api.51aishanghui.com/v1/user/pay/deposit_3xmtapay/',
    //         type: 'POST',
    //         data: param,
    //         unjoin: true,
    //     })
    //     .then(function( data ) {
    //         // self.onlyOne = true;
    //         var url = data.data.post_url + '?' + data.data.post_data;
    //         self.postURL(url);

    //     },function( err ) {
    //         // self.onlyOne = true;
    //         // var dialog = self.dialog;
    //         // dialog.setContent(data.message);
    //         // dialog.show();
    //         // return;
    //     })

    // }

    _charge(bankInfo) {
        var data = this.verify.getVal();
        // var params = new Uri().getParams();

        data = _.extend(data, {
            paid_thru: bankInfo.paid_thru,
            bank_code: bankInfo.bankcode,
            bankName: bankInfo.bank
        });
        console.log(data);
        // return false;



        // new Dialog({
        //     data: data
        // });

        if ( getWLName() == 'thetradestar' ) {
            $('.unit').hide();
        }
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

    postURL(url,data) {
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
            $('form input:last').val(data.signature);
            return "";
        });
        form.submit();
    }

    /**
     * 点击背景隐藏  表单
     * @private
     */

    _hideorder(){

        $(".order-bg").hide();
        $(".order").hide();

    }
}

new Guide();