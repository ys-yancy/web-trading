// 白标的code
function getWhitelabelCodename() {
    return "maj";
}

// 白标的移动端的注册入口
function getMobileRegisterLink() {
    return "https://wt-q.invhero.com/maj/s/my-guide/maj/register.html?refer=/i/y5fph2&from=webtrade";
}

function getHasTrueInfo() {
    return true;
}

// 是否为跳转第三方支付平台支付
function getIsThirdPartyPay() {
    return false;
}

function getIsThirdPartyPayUrl() {
    return ''
}

// 是否为演示
function getIsDemo() {
    return false;
}

function getCompanyName() {
    return "DDFX";
}

function getHomeUrl() {
    return "https://wt-q.invhero.com/";
}

// 白标的LOGO地址, 最好是https
function getLogoUrl() {
    // return "../../img/xinwaihui/logo.png";
    return "https://wt-q.invhero.com/maj/img/wl/fxbtg_about.png";
}


function getDefaultAvatarUrl() {
    return "https://wt-q.invhero.com/maj/img/wl/fxbtg_about.png";
}


// 如果需要更换logo背景颜色, 则可以设置不同的class并修改less
function getLogoBackgroudStyle() {
    return "img-wrapper-outer-xinwaihui";
}

// 同getWhitelabelCodename
function getWLName() {
    return "maj";
}

// 注册source
function getRegisterSource() {
    return "web-register";
}

// 网页注册的邀请人
function getRegisterReferCode() {
    return "y5fph2";
    //return "y3na32"; // 测试环境用
}

// 网页注册的默认用户名
function getRegisterDefaultNickname() {
    var date = new Date();
    var minite = date.getMinutes();
    var second = date.getSeconds();
    var millsecond = date.getMilliseconds();
    var nickname = '访客' + minite + '' + second + '' + millsecond;
    return nickname;
}

// 交易页面的title
function getTradePageTitle() {
    return "DDFX专业交易";
}

//注册增金
function getRegisterGold() {
    return 15;
}

// PC版交易页面的地址 (需要iframe)
function getTradePageUrl() {
    return 'http://w.fxbtg.cc/wt.html';
}

// PC版注册页面的地址 (需要iframe)
function getRegisterPageUrl() {
    return 'http://w.fxbtg.cc/register.html';
}

// PC版入金页面 (需要iframe)
function getDepositButtonHref() {
    return "http://p.fxbtg.cc/deposit.html";
}

// PC 版查看支持银行bank-list (需要iframe)
function getBankListHref() {
    return "https://wt-fxbtg.invhero.com/fxbtg/s/pay/bank-list.html";
}

//ajax.js: groupPriceUrl
function getGroupPriceUrl() {
    return 'https://price.invhero.com/v1/price/current';
}

//ajax.js: priceUrl
function getPriceUrl() {
    return 'https://price.invhero.com/v2/price/current';
}

//ajax.js: candleUrl
function getCandleUrl() {
    return 'https://price.invhero.com/v3/price/candle';
}

//ajax请求前缀：正式环境
function getAjaxPrefix() {
    return 'https://api.invhero.com';
}

//邀请链接
function getInvitePrefix() {
    return 'http://t.invhero.com/i/';
}

//安卓分享前缀
function getAndroidSharePrefix() {
    return 'http://t.invhero.com';
}

//头像链接
function getAvatarUrl() {
    return 'https://static.invhero.com/';
}

//stompUrl
function getStompUrl() {
    return 'wss://price.invhero.com:61615/stomp';
}

//frame.js 147 
function getFrameIndexofUrl() {
    return 't.invhero.com';
}

//chart/index.js : UDFCompatibleDatafeed( ..url )
function getUDFCompatibleDatafeedUrl() {
    return 'https://price.invhero.com/tradingview';
}
function getQuoteHelperUrl() {
    return 'wss://price.invhero.com:61615/stomp';
}
function getChartStorageUrl() {
    return 'https://api.invhero.com/v1/advchart';
}

//zhufeng\cooperation\index.js 109
function getFeedbackUrl() {
    return 'https://api.invhero.com/v1/feedback/';
}

//\p\zhufeng\index.js: 135
function getV2priceCurrentUrl() {
    return 'https://price.invhero.com/v2/price/current';
}

function getOutlookParams() {
    return {
        "paneProperties.background": "#fff",
        "paneProperties.vertGridProperties.color": "#E6E6E6",
        "paneProperties.horzGridProperties.color": "#E6E6E6",
        "symbolWatermarkProperties.transparency": 90,
        "scalesProperties.textColor": "#AAA"
    };
}

function addDefault (w) {
    w.chart().createStudy('MACD', false, false, [12, 26, "open", 9], null);
}

//出金提示文案
function getExtraHtml() {
    return '\
        <h2>温馨提示</h2>\
        <p>1.不接受任何第三者付款。 </p>\
        <p>2.充值金额将按中国对应银行实时给出的汇率转为美元。</p>\
        <p>3.存款客户姓名必须与中国银联卡持卡人姓名相同，前述资料的任何差异都可能造成您的交易被拒绝。</p>\
        <p>4.交易完成后，请保留交易编号作为备档。</p>\
        <p>5.通常在收到客户款项后15分钟内存入客户交易账户。</p>\
        <p>6.交易结算只限使用银联卡。</p>\
        <p>7.每次最低交易金额为500美元，每次最高交易金额为30,000美元。</p>\
    ';
}


function getRiskMsg () {
    return '<p class="marginTop">尊敬的DDFX客户:</p>\
    <p class="marginTop txtIndent">DDFX交易平台(以下统一使用"我平台"代替)的业务是一种潜在收益和潜在风险较高的投资业务,对投资者的风险承受能力、理解风险程度、风险控制能力以及投资经验有较高的要求。存入资金前，您需要仔细阅读以下高风险揭示协议。</p>\
    <p class="marginTop">一、郑重提示</p>\
    <p>电子交易业务具有高风险性，在做交易决定之前，请根据自身家庭、财务等具体情况慎重考虑以下问题：</p>\
    <p>1.交易资金来源：是否全部身家投入，养老钱、看病钱投入，子女教育资金投入，抵押贷款或其他借款投入？</p>\
    <p>2.一旦投入资金发生部分或全部亏损，会有怎样的后果和影响？</p>\
    <p>3.是真正对电子交易有充分的认知后决定交易，还是仅凭市场传言而盲目投资？</p>\
    <p>4.是否准备发展自己作为我平台交易客户的公司或个人？</p>\
    <p>5.是否存在以下高风险行为：</p>\
    <p class="txtIndent"> 1）是否委托其他单位和个人“代理操盘、合作分成”等？</p>\
    <p class="txtIndent"> 2）在设置密码时是否使用如连续数字、重复数字、出生日期以及其他容易破解的"傻瓜密码"？ </p>\
    <p>6.风险警示：</p>\
    <p class="txtIndent"> 1）交易客户有义务保管好交易账号、密码，避免泄露，因保管不善导致交易账号、密码泄露而引起的风险由交易客户自行承担。</p>\
    <p class="txtIndent"> 2）交易客户应亲自进行交易活动，切勿委托任何机构或个人进行代理交易活动，因信任他人而产生的风险由交易客户自行承担。</p>\
    <p class="txtIndent"> 3）任何保证获利、零风险等宣传均属虚假承诺，因轻信此类信息产生的风险由交易客户自行承担。</p>\
    <p class="txtIndent"> 4）交易客户根据相关市场信息理性判断、自主决策，并自行承担交易后果。</p>\
    <p class="txtIndent"> 5）交易客户参与交易前，应当掌握市场基本知识、相关业务规则，充分了解交易风险，掌握必要的风险防范和化解技巧。</p>\
    <p class="txtIndent"> 6）交易客户参与交易前，应当结合自身的家庭情况、收入状况、投资目的及知识结构等因素，合理评估自身的产品认知能力与风险承受能力，理性选择合适的投资方式、投资品种、投资时机、投资金额，请勿盲目投资。</p>\
    <p>7.免责声明：行评中所有新闻、研究、分析、价格或其它数据只作一般市场评论，操作建议仅供参考。营业部将不会承担任何有可能因直接或间接使用或依靠上述数据而导致的损失或损害。</p>\
    <p class="marginTop">二、相关风险揭示</p>\
    <p>1.政策风险 </p>\
    <p>国家法律、法规、政策以及规章的变化，紧急措施的出台，相关监管部门监管措施的实施等原因，均可能会对交易客户的投资产生影响，交易客户必须承担由此导致的损失。</p>\
    <p>2.不可抗力风险</p>\
    <p>任何因我平台不能够控制的原因，包括地震、水灾、火灾、暴动、罢工、战争、政府管制、国际或国内的禁止或限制以及停电、技术故障、电子故障等其他无法预测和防范的不可抗力事件，都有可能会对交易客户的交易产生影响，交易客户承担由此导致的一切损失。</p>\
    <p>3.技术风险</p>\
    <p>因特网是全球公开网络，数据在因特网传输的途径是不完全确定的，由于互联网数据传输存在被网络黑客和计算机病毒攻击的可能，有关通讯服务及软、硬件服务稳定性方面的风险等原因，买卖指令及行情等信息可能会出现中断、停顿、延迟以及数据错误等异常情况，交易客户必须承担由此导致的一切损失。</p>\
    <p>4.价格波动风险</p>\
    <p>业务涉及现货商品的价格受多种因素的影响（包括但不限于国际经济形势、美元汇率、相关市场走势、政治局势、自然因素等），这些因素对现货价格的影响机制非常复杂，交易客户在实际操作中难以全面把握，因而存在出现投资失误的可能性，如果不能有效控制风险，则可能遭受较大的损失，交易客户必须承担由此导致的一切损失。</p>\
    <p>5.交易风险</p>\
    <p class="txtIndent"> 1）交易客户需要了解现货及现货电子交易业务具有低准备金和高杠杆比例的投资特点， 可能导致快速的盈利或亏损。若建仓的方向与行情的波动相反，会造成较大的亏损，根据亏损的程度，交易客户必须有条件满足随时追加准备金的要求，否则其持仓将会被强行平仓，交易客户必须承担由此造成的全部损失。</p>\
    <p class="txtIndent"> 2）交易客户在交易系统内，通过网络终端（电脑及手机）所提交的市价单一经成交， 即不可撤销，交易客户必须接受这种方式可能带来的风险。</p>\
    <p class="txtIndent"> 3）行情报价以国际市场价格为基础，综合国内市场价格及中国人民银行美元兑人民币基准汇率，连续报出现货的人民币买价及卖价，其价格可能会与其他途径的报价有微弱的差距，并不能保证其交易价格与其它市场保持完全的一致性。 交易报价应以实盘系统显示为准，行情分析软件显示的价格仅供参考分析使用，不得视为交易报价。</p>\
    <p class="marginTop">三、特别提示</p>\
    <p>1.交易客户在参与投资之前务必详尽的了解投资的基本知识和相关风险以及我平台有关业务规则等，以依法合规地从事现货及现货电子交易业务。</p>\
    <p>2.交易客户在开通交易之前，请配合开展投资者适当性管理工作，完整、如实地提供开户所需要的信息，不得采取弄虚作假等手段，否则，平台可以拒绝为其开通交易服务。</p>\
    <p>3.本风险提示书（以下简称“提示书”）旨在向投资者充分揭示投资风险,并且帮助投资者评估和确定自身的风险承受能力。本警示书披露了交易过程中可能发生的各种风险因素，但是鉴于市场的多变和复杂，本警示书所示风险仅为列举性质，未能穷尽一切与现货电子交易业务有关的风险因素。</p>\
    <p>4.鉴于投资风险的存在，在注册成为我平台用户及进行交易前，投资者应该仔细阅读本提示书，并确定自己已经充分理解有关交易的性质、规则；并依据自身的投资经验、目标、财务状况、承担风险能力等自行决定是否参与该交易。</p>\
    <p>5.用户在进行注册程序过程中点击“同意”按钮，即视为用户对现货电子交易业务的风险已有了充分的认知与了解。</p>\
    <p>6.我们诚挚的希望和建议交易客户，从风险承受能力等自身实际情况出发，审慎地决定是否参与此市场的现货商品投资，合理的配置自己的金融资产。</p>\
    <p>7.再次提示：投资有风险，入市须谨慎！</p>\
    <p class="marginTop txtIndent">我方保证遵守以上承诺，如违反上述承诺或有违规行为，给交易市场或相关方造成损失的，我方愿意承担法律责任及相应的经济赔偿责任。兹确认，本申请与承诺中的相关资料和信息为我方自愿填写，我方的上述资料和信息合法、合规、真实、有效。</p>';
}

function getTrueMsg() {
    return '<p class="safe">请阅读资金安全协议：</p>\
    <div>\
        <div>尊敬的DDFX客户:</div>\
        <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;尊敬的DDFX(以下简称"我司")客户我们会间接为您提供电子商务平台支付服务,您拥有平台账户资金的使用所有权，您需要在我司交易平台注册账户并上传相关个人资料，您应接受我司对您资金结算的管理监督和检查。</div>\
        <div>您将对使用该账户及密码进行的一切操作及言论负完全的责任，您同意：</div>\
        <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 1. 本公司通过您的用户名和密码识别您的指示，请您妥善保管您的用户名和密码，对于因密码泄露所致的损失，由您自行承担。您保证不向其他任何人泄露该账户及密码，亦不使用其他任何人的账号及密码。</div>\
        <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2. 如您发现有他人冒用或盗用您的账户及密码或任何其他未经合法授权之情形时，应立即以有效方式通知本公司，要求本公司暂停相关服务。同时，您理解本公司对您的请求采取行动 需 要合理期 限，在此之前，本公司对已执行的指令及(或)所导致的您的损失不承担任何责任。</div>\
        <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 3. 交易异常处理，您使用本服务时，可能由于银行本身系统问题、银行相关作业网络连线问题或其他不可抗拒因素，造成本服务无法提供。您确保您所输入的您的资料无误，如果因资料错误造成本公司于上述异常状况发生时，无法及时通知您相关交易后续处理方式的，本公司不承担任何损害赔偿责任。</div>\
        <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 4. 您同意，基于运行和交易安全的需要,本公司可以暂时停止提供或者限制本服务部分功能,或提供新的功能,在任何功能减少、增加或者变化时,只要您仍然使用本服务,表示您仍然同意本协议或者变更后的协议。</div>\
    </div>';
}

function getAccountBanlanceDesc() {
    return '交易信号的账户余额变化情况, 单位 美元.';
}

function getAccountProfitDesc() {
    return '按自然月统计, 以 点 为单位的收益表现情况.';
}

function getMaxRetreatDesc() {
    return '账户净值最大回撤数据, 以净值百分比来表示.';
}


function getAbountTitleContent() {
    return '<h2 class="desc-title">我们提供适合不同水平投资者的投资教育系统一站解决方案</h2>\
            <div class="desc-content">\
                <p>DDFX汇聚来自各大互联网, 金融公司的行业精英, 专注于通过产品, 科技改变金融行业.</p>\
                <p>在过去的三年中, 我们不断改进, 优化产品, 力求为投资者提供最好的使用体验.</p>\
            </div>\
        '
}

function getAboutContent() {
    return '8-20 2017 : PC+WEB 2.0 发布上线,\
            7-01 2017 : 管理后台 1.3.1 发布上线,\
            5-10 2017 : 管理后台 1.3.0 发布上线,\
            1-23 2017 : 管理后台 1.2.0 发布上线,\
            10-26 2016 : Mobile+APP 2.0.1 发布上线,\
            7-15 2016 : 管理后台 1.1.0 发布上线,\
            2-23 2016 : 管理后台 1.0.0 发布上线,\
            8-20 2015 : Mobile+APP 1.0.0 发布上线\
        '.split(',');
}

function getAbountImageUrl() {
    return '../../../../../../img/abount-img.jpg';
}

function getIndexLogoUrl() {
    return '../../img/index_logo.jpg';
}
// 最低出金金额
function getMinWithdrawWL() {
    return 100;
}

// 最低入金金金额
function getMinDepositWL() {
    return 500;
}