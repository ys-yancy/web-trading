"use strict";
var _ = require('../lib/underscore');

function render(tmpl, data, el, compiled) {
  var html = doRender(tmpl, data, compiled);
  var html = $(html);

  if (el) {
    el.html(html);
    return;
  }

  return html;
}

function renderTo(tmpl, data, el, compiled) {
  var html = doRender(tmpl, data, compiled);
  html = $(html);

  el = $(el);

  el.append(html);

  return html;
}

function doRender(tmpl, data, compiled) {
  var tplFn;
  if (typeof tmpl === 'function') {
    tplFn = tmpl;
  } else {
    tplFn = _.template(tmpl);
  }
  data = data || {};
  var html = tplFn({
    data: data
  });

  return html;
}

module.exports = {
  render: render,
  renderTo: renderTo
};