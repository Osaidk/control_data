// Generated by CoffeeScript 1.4.0
(function() {
  var $, cardTypes, formatBackCardNumber, formatBackExpiry, formatCardNumber, formatExpiry, formatForwardExpiry, formatForwardSlash, hasTextSelected, luhnCheck, restrictCVC, restrictCardNumber, restrictExpiry, restrictNumeric, setCardType, trim,
    _this = this;

  $ = jQuery;

  trim = function(str) {
    return (str + '').replace(/^\s+|\s+$/g, '');
  };

  cardTypes = (function() {
    var num, types, _i, _j;
    types = {};
    for (num = _i = 40; _i <= 49; num = ++_i) {
      types[num] = 'visa';
    }
    for (num = _j = 50; _j <= 59; num = ++_j) {
      types[num] = 'mastercard';
    }
    types[34] = types[37] = 'amex';
    types[60] = types[62] = types[64] = types[65] = 'discover';
    types[35] = 'jcb';
    types[30] = types[36] = types[38] = types[39] = 'dinersclub';
    return types;
  })();

  luhnCheck = function(num) {
    var digit, digits, odd, sum, _i, _len;
    odd = true;
    sum = 0;
    digits = (num + '').split('').reverse();
    for (_i = 0, _len = digits.length; _i < _len; _i++) {
      digit = digits[_i];
      digit = parseInt(digit, 10);
      if ((odd = !odd)) {
        digit *= 2;
      }
      if (digit > 9) {
        digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0;
  };

  hasTextSelected = function($target) {
    var _ref;
    if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== $target.prop('selectionEnd')) {
      return true;
    }
    if (typeof document !== "undefined" && document !== null ? (_ref = document.selection) != null ? typeof _ref.createRange === "function" ? _ref.createRange().text : void 0 : void 0 : void 0) {
      return true;
    }
    return false;
  };

  formatCardNumber = function(e) {
    var $target, digit, length, re, type, value;
    digit = String.fromCharCode(e.which);
    if (!/^\d+$/.test(digit)) {
      return;
    }
    $target = $(e.currentTarget);
    value = $target.val();
    type = $.cardType(value + digit);
    length = (value.replace(/\D/g, '') + digit).length;
    if (type === 'amex') {
      if (length >= 15) {
        return;
      }
    } else {
      if (length >= 16) {
        return;
      }
    }
    if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== value.length) {
      return;
    }
    if (type === 'amex') {
      re = /^(\d{4}|\d{4}\s\d{6})$/;
    } else {
      re = /(?:^|\s)(\d{4})$/;
    }
    if (re.test(value)) {
      e.preventDefault();
      return $target.val(value + ' ' + digit);
    } else if (re.test(value + digit)) {
      e.preventDefault();
      return $target.val(value + digit + ' ');
    }
  };

  formatBackCardNumber = function(e) {
    var $target, value;
    $target = $(e.currentTarget);
    value = $target.val();
    if (e.meta) {
      return;
    }
    if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== value.length) {
      return;
    }
    if (e.which === 8 && /\s\d?$/.test(value)) {
      e.preventDefault();
      return $target.val(value.replace(/\s\d?$/, ''));
    }
  };

  formatExpiry = function(e) {
    var $target, digit, val;
    digit = String.fromCharCode(e.which);
    if (!/^\d+$/.test(digit)) {
      return;
    }
    $target = $(e.currentTarget);
    val = $target.val() + digit;
    if (/^\d$/.test(val) && (val !== '0' && val !== '1')) {
      e.preventDefault();
      return $target.val("0" + val + " / ");
    } else if (/^\d\d$/.test(val)) {
      e.preventDefault();
      return $target.val("" + val + " / ");
    }
  };

  formatForwardExpiry = function(e) {
    var $target, digit, val;
    digit = String.fromCharCode(e.which);
    if (!/^\d+$/.test(digit)) {
      return;
    }
    $target = $(e.currentTarget);
    val = $target.val();
    if (/^\d\d$/.test(val)) {
      return $target.val("" + val + " / ");
    }
  };

  formatForwardSlash = function(e) {
    var $target, slash, val;
    slash = String.fromCharCode(e.which);
    if (slash !== '/') {
      return;
    }
    $target = $(e.currentTarget);
    val = $target.val();
    if (/^\d$/.test(val) && val !== '0') {
      return $target.val("0" + val + " / ");
    }
  };

  formatBackExpiry = function(e) {
    var $target, value;
    if (e.meta) {
      return;
    }
    $target = $(e.currentTarget);
    value = $target.val();
    if (e.which !== 8) {
      return;
    }
    if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== value.length) {
      return;
    }
    if (/\s\/\s?$/.test(value)) {
      e.preventDefault();
      return $target.val(value.replace(/\s\/\s?$/, ''));
    }
  };

  restrictNumeric = function(e) {
    var char;
    if (e.metaKey) {
      return true;
    }
    if (e.which === 32) {
      return false;
    }
    if (e.which === 0) {
      return true;
    }
    if (e.which < 33) {
      return true;
    }
    char = String.fromCharCode(e.which);
    return !!/[\d\s]/.test(char);
  };

  restrictCardNumber = function(e) {
    var $target, digit, value;
    $target = $(e.currentTarget);
    digit = String.fromCharCode(e.which);
    if (!/^\d+$/.test(digit)) {
      return;
    }
    if (hasTextSelected($target)) {
      return;
    }
    value = $target.val() + digit;
    value = value.replace(/\D/g, '');
    if ($.cardType(value) === 'amex') {
      return value.length <= 15;
    } else {
      return value.length <= 16;
    }
  };

  restrictExpiry = function(e) {
    var $target, digit, value;
    $target = $(e.currentTarget);
    digit = String.fromCharCode(e.which);
    if (!/^\d+$/.test(digit)) {
      return;
    }
    if (hasTextSelected($target)) {
      return;
    }
    value = $target.val() + digit;
    value = value.replace(/\D/g, '');
    if (value.length > 6) {
      return false;
    }
  };

  restrictCVC = function(e) {
    var $target, val;
    $target = $(e.currentTarget);
    val = $target.val();
    return val.length <= 4;
  };

  setCardType = function(e) {
    var $target, cardType, val;
    $target = $(e.currentTarget);
    val = $target.val();
    cardType = $.cardType(val) || 'unknown';
    if (!$target.hasClass(cardType)) {
      $target.removeClass('visa amex mastercard discover dinersclub jcb unknown');
      $target.addClass(cardType);
      $target.toggleClass('identified', cardType !== 'unknown');
      return $target.trigger('payment.cardType', cardType);
    }
  };

  $.fn.formatCardCVC = function() {
    this.restrictNumeric();
    return this.on('keypress', restrictCVC);
  };

  $.fn.formatCardExpiry = function() {
    this.restrictNumeric();
    this.on('keypress', restrictExpiry);
    this.on('keypress', formatExpiry);
    this.on('keypress', formatForwardSlash);
    this.on('keypress', formatForwardExpiry);
    return this.on('keydown', formatBackExpiry);
  };

  $.fn.formatCardNumber = function() {
    this.restrictNumeric();
    this.on('keypress', restrictCardNumber);
    this.on('keypress', formatCardNumber);
    this.on('keydown', formatBackCardNumber);
    return this.on('keyup', setCardType);
  };

  $.fn.restrictNumeric = function() {
    return this.on('keypress', restrictNumeric);
  };

  $.fn.cardExpiryVal = function() {
    return $.cardExpiryVal($(this).val());
  };

  $.cardExpiryVal = function(value) {
    var month, prefix, year, _ref;
    value = value.replace(/\s/g, '');
    _ref = value.split('/', 2), month = _ref[0], year = _ref[1];
    if ((year != null ? year.length : void 0) === 2 && /^\d+$/.test(year)) {
      prefix = (new Date).getFullYear();
      prefix = prefix.toString().slice(0, 2);
      year = prefix + year;
    }
    month = parseInt(month, 10);
    year = parseInt(year, 10);
    return {
      month: month,
      year: year
    };
  };

  $.validateCardNumber = function(num) {
    num = (num + '').replace(/\s+|-/g, '');
    return num.length >= 10 && num.length <= 16 && luhnCheck(num);
  };

  $.validateCardExpiry = function(month, year) {
    var currentTime, expiry, _ref;
    if (typeof month === 'object' && 'month' in month) {
      _ref = month, month = _ref.month, year = _ref.year;
    }
    if (!(month && year)) {
      return false;
    }
    month = trim(month);
    year = trim(year);
    if (!/^\d+$/.test(month)) {
      return false;
    }
    if (!/^\d+$/.test(year)) {
      return false;
    }
    if (!(parseInt(month, 10) <= 12)) {
      return false;
    }
    expiry = new Date(year, month);
    currentTime = new Date;
    expiry.setMonth(expiry.getMonth() - 1);
    expiry.setMonth(expiry.getMonth() + 1, 1);
    return expiry > currentTime;
  };

  $.validateCardCVC = function(cvc, type) {
    cvc = trim(cvc);
    if (!/^\d+$/.test(cvc)) {
      return false;
    }
    if (type) {
      if (type === 'amex') {
        return cvc.length === 4;
      } else {
        return cvc.length === 3;
      }
    } else {
      return cvc.length >= 3 && cvc.length <= 4;
    }
  };

  $.cardType = function(num) {
    return cardTypes[num.slice(0, 2)] || null;
  };

}).call(this);
