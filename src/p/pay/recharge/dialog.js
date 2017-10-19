"use strict";

var Base = require('../../../app/base');
var Util = require('../../../app/util');
var tmpl = require('./dialog.ejs.html');


export default class Dialog extends Base {
    constructor(config) {
        super(config);
        this._showDialog();
    }

    _lazyBind() {
        this.dialogEl.on('click', '.dialog-close', (e) => {
            this._hideDialog();
            this.dialogEl.remove();
        }).on('click', '.J_Cancel', (e) => {
            this._hideDialog();
            this.dialogEl.remove();
        })

        // this.dialogEl.on('click', '.J_Submit', (e) => {
        //     this._charge(e)
        // });
        $('#J_Charge').on('submit', (e) => {
            if ($('.J_Submit', this.dialogEl).hasClass('loading')) {
                e.preventDefault();
            }
        });

        $(window).on('resize', (e) => {
            this._verticleCenter();
        });
    }

    _showDialog() {
        if (this.dialogEl) {
            this.dialogEl.show();
        } else {
            this.data.date = Util.getDate();
            this.data.company_name = getCompanyName();
            var html = this.render(tmpl, this.data);
            this.dialogEl = $(html);
            this.dialogEl.show();
            $(document.body).append(this.dialogEl);
            this._lazyBind();
        }

        this._verticleCenter();

        this._charge();
    }

    _verticleCenter() {
        var innerEl = $('.dialog-inner', this.dialogEl);
        var height = innerEl.height();
        var winHeight = $(window).height();

        if (winHeight - height > 0) {
            innerEl.css('margin-top', (winHeight - height) / 2);
        }
    }

    _hideDialog() {
        this.dialogEl.hide();
    }

    _charge(e) {

        this.login().then(() => {
            return this.ajax({
                url: '/v1/user/real/deposit/chinagpay_web/?',
                type: 'post',
                data: {
                    paid_thru: this.data.paid_thru,
                    bank_code: this.data.bank_code,
                    amount: this.data.amount,
                    access_token: this.cookie.get('token'),
                    back_url: ''
                }
            })
        }).then((data) => {
            data = data.data;
            var url = data.post_url + '?' + data.post_data;
            var form = document.getElementById('J_Charge');
            form.action = url.replace(/\?(.*)/, function(_, urlArgs) {
                urlArgs.replace(/\+/g, " ").replace(/([^&=]+)=([^&=]*)/g, function(input, key, value) {
                    input = document.createElement("INPUT");
                    input.type = "hidden";
                    input.name = decodeURIComponent(key);
                    input.value = decodeURIComponent(value);
                    form.appendChild(input);
                });
                $('.dialog-ft form input:last').val(data.signature);
                return "";
            });
            // form.onsubmit = function(e) {
            // //    $('.J_Submit', this.dialogEl).val('开始支付').removeClass('loading');
            // }

            $('.J_Submit', this.dialogEl).val('开始支付').removeClass('loading');
        }, (data) => {}).catch((e) => {
            console.log(e);
        })
    }


}
