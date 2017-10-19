"use strict";

require('./index.css');

var Base = require('../../app/base');
var Config = require('../../app/config');
var tmpl = require('./index.ejs.html');
var logoutTmpl = require('./logout.ejs.html');


export default class Header extends Base {
    constructor() {
        super();

        this.login().then(() => {
            this.el = $('#J_Header');

            this._getAccount();
            this._bind();
        });
    }

    _bind() {
        
        this.el.on('click', '.logout', _.bind(this._showDialog, this));
    }

    _lazyBind() {
        this.dialogEl.on('click', '.dialog-close', (e) => {
            this._hideDialog();
        }).on('click', '.J_Cancel', (e) => {
            this._hideDialog();
        })

        this.dialogEl.on('click', '.J_Submit', (e) => {
            this._logout(e)
        });

        $(window).on('resize', (e) => {
            this._verticleCenter();
        });
    }

    _verticleCenter() {
        var innerEl = $('.dialog-inner', this.dialogEl);
        var height = innerEl.height();
        var winHeight = $(window).height();

        if (winHeight - height > 0) {
            innerEl.css('margin-top', (winHeight - height) / 2);
        }
    }

    _showDialog() {
        if (this.dialogEl) {
            this.dialogEl.show();
        } else {
            var html = this.render(logoutTmpl);
            this.dialogEl = $(html);
            this.dialogEl.show();
            this._lazyBind();
            $(document.body).append(this.dialogEl);
        }

        this._verticleCenter();
    }

    _hideDialog() {
        this.dialogEl.hide();
    }

    _logout(e) {

        this.logout(true);

    }

    _getAccount() {

        this.ajax({
            url: '/v3/user',
            data: {
                access_token: this.cookie.get('token')
            }
        }).then((data) => {
            // console.log(data);
            data = data.data;
            if (data.avatar) {
                data.img = Config.getAvatarPrefix(data.avatar);
            } else{
                data.img = getDefaultAvatarUrl();
            }

            this.render(tmpl, data, $('#J_Header'));
            if ( getWLName() == 'thetradestar' ) {
                $('.buck_sign').hide();
            }
        }).catch((e) => {
            console.log(e);
        });
    }
}