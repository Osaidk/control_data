//  ime.js
//  (c) 2012~ Youngteac Hong
//  ime.js may be freely distributed under the MIT license.
(function(root) {

  /***************************
   * main input method module
   * (dom dependent)
   ***************************/
  var ime = function() {
    /**
     * init module
     * @param fnHandler
     * @param elHolder for eventListener (optional, default: body element)
     */
    this.init = function(fnHandler, elHolder) {
      //Input Methods
      this.aIm = [imH2, imEN];
      this.currentIdx = 0;
      this.setEventListener(elHolder || document.body, fnHandler);
    };

    //next Input Method
    this.nextIm = function() {
      this.currentIdx = (this.currentIdx + 1) % this.aIm.length;
    };

    //get current Input Method
    this.getCurrentImName = function() {
      return this.aIm[this.currentIdx].name;
    };

    //attach event
    var fnAttachEvent = function(elNode, sEvent, fHandler) {
      if(elNode.addEventListener) {
        elNode.addEventListener(sEvent, fHandler, false);
      }else{
        elNode.attachEvent('on'+sEvent, fHandler);
      }
    };

    //set event listener
    this.setEventListener = function(elHolder, fnHandler) {
      var elListener = document.createElement('input'); 
      elListener.setAttribute('type', 'password');
      elListener.style.imeMode = 'disabled';
      elHolder.appendChild(elListener);

      var that = this;
      fnAttachEvent(elListener, 'keypress', function(e) {
        var oCmd = that.parseKeypress(e);
        if(oCmd.name){
          fnHandler(oCmd);
          e.preventDefault();
        }
      });
      fnAttachEvent(elListener, 'keydown', function(e) {
        var oCmd = that.parseKeydown(e);
        if(oCmd.name){
          fnHandler(oCmd);
          e.preventDefault();
        }
      });
      elListener.focus();
    };

    //parse event
    this.parseKeypress = function(e) {
      var oKeyEvent = key.getKeyEvent(e); //native event 2 oKeyEvent
      if(!oKeyEvent.charCode){ return {}; }
      return this.aIm[this.currentIdx].handleKeyEvent(oKeyEvent);
    };

    this.parseKeydown = function(e) {
      var oKeyEvent = key.getKeyEventFromKeydown(e); //native event 2 oKeyEvent
      if(oKeyEvent.shift && key.SPACE == oKeyEvent.charCode){
        this.nextIm();
        return {name: "nextIm"};
      } 
      if(!oKeyEvent.charCode){ return {}; }
      return this.aIm[this.currentIdx].handleKeyEvent(oKeyEvent);
    };
 };

  /***************************
   * key util : predicate
   * (keydown event dependent)
   ***************************/
  var key = new (function() {
    this.BACKSPACE = 8;
    this.ENTER = 13;
    this.SHIFT = 16;
    this.CTRL = 17;
    this.ALT = 18;

    this.SPACE = 32;

    this.PAGEUP = 33;
    this.PAGEDOWN = 34;
    this.END = 35;
    this.HOME = 36;
    this.LEFT = 37;
    this.UP = 38;
    this.RIGHT = 39;
    this.DOWN = 40;

    this.ZERO = 48;
    this.NINE = 57;

    this.A = 65;
    this.Z = 90;

    this.METAKEY = 91;
    this.WIN = 92;

    this.NUM_ZERO = 96;
    this.NUM_NINE = 105;

    var CASE_PADDING = 32; // case_padding alpha upper <->  lower

    //convert native keypress event to key event
    this.getKeyEvent = function(e) {
      //set modifier
      var oKeyEvent = {
        shift : e.shiftKey,
        ctrl : e.ctrlKey,
        alt : e.altKey,
        meta : e.metaKey,
        charCode : e.charCode
      }; 

      return oKeyEvent;
    };

    //convert native keydown event to key event
    this.getKeyEventFromKeydown = function(e) {
     //set modifier
      var oKeyEvent = {
        shift : e.shiftKey,
        ctrl : e.ctrlKey,
        alt : e.altKey,
        meta : e.metaKey
      };

      if(e.keyCode == key.BACKSPACE || e.keyCode == key.SPACE) {
        oKeyEvent.charCode = e.keyCode;
      }

      return oKeyEvent;
    };

    // predicate modifier
    // http://en.wikipedia.org/wiki/Modifier_key
    // shift, ctrl, alt, altgr, meta, win, cmd, fn, super, hyper
    this.isModifier = function(keyCode){
      return [ this.SHIFT, this.CTRL, this.ALT, this.METAKEY, this.WIN ].indexOf(keyCode) != -1;
    };

    //predicate : navigation, arrow, home, end, pageup, pagedown
    this.isNavigation = function(keyCode) {
      return this.PAGEUP <= keyCode && keyCode <= this.DOWN;
    };

    //predicate : A-Z + a-z + 0-9
    this.isAlnum = function(keyCode) {
      return this.isNumeric(keyCode) || this.isAlpha(keyCode);
    };

    //predicate : 0-9
    this.isNumeric = function(keyCode) {
      return (this.ZERO <= keyCode && keyCode <= this.NINE) ||
             (this.NUM_ZERO <= keyCode && keyCode <= this.NUM_NINE);
    };

    //predicate : A-Z + a-z
    this.isAlpha = function(keyCode) {
      return this.isUpperAlpha(keyCode) || this.isLowerAlpha(keyCode);
    };

    //predicate : A-Z
    this.isUpperAlpha = function(keyCode) {
      return this.A <= keyCode && keyCode <= this.Z;
    };

    //predicate : a~z
    this.isLowerAlpha = function(keyCode) {
      return this.isUpperAlpha(keyCode - CASE_PADDING);
    };
  })();

  /***************************
   * English
   ***************************/
  var imEN = new (function() {
    this.name = 'EN';

    //handleKeyEvent for english
    this.handleKeyEvent = function(oKeyEvent) {
      if(oKeyEvent.charCode == key.ENTER) {
        return {name:'insPara'};
      }else if(oKeyEvent.charCode == key.BACKSPACE) {
        return {name:'delChar'};
      }else{
        return {name:'insChar', value:String.fromCharCode(oKeyEvent.charCode)};
      }
    };
  })();

  /***************************
   * buf, string util
   ***************************/
  var buf = function() {
    this.buf = '';
    this.push = function(ch) {
      this.buf += ch;
    };

    this.init = function() {
      this.buf = this.buf.substring(0, this.buf.length -1);
    };

    this.tail = function(nTail) {
      if(nTail > this.buf.length) {
        throw 'IllegalArgument';
      }
      this.buf = this.buf.substring(this.buf.length - nTail);
    };

    this.flush = function() {
      this.buf = '';
    };

    this.size = function() {
      return this.buf.length;
    };

    this.get = function(){
      return this.buf;
    };
  };

  /***************************
   * hangul util
   ***************************/
  var hangul = function() {
    this.init = function(aCho, aVowel, aJong, aJaso){
      this.aCho = aCho;
      this.aVowel = aVowel;
      this.aJong = aJong;
      this.aJaso = aJaso;
    };

    // 0 -> ???
    this.getCho = function( cho ) {
      var idx = this.aJaso.indexOf(this.aCho[cho]);
      return String.fromCharCode(12593 + idx);
    };

    // 0 -> ???
    this.getVowel = function( vowel ) {
      var idx = this.aJaso.indexOf(this.aVowel[vowel]);
      return String.fromCharCode(12593 + idx);
    };

    // 0,0,0 -> ???
    this.get = function( cho, vowel, jong ){
      if (cho >= 0 && vowel >= 0){
        jong = jong == -1 ? 0 : jong;
        return String.fromCharCode((cho * 21 + vowel) * 28 + jong + 44032);
      }else if (cho >= 0){
        return this.getCho(cho);
      }else if (vowel >= 0){
        return this.getVowel(vowel);
      }else{
        throw "IllegalArgument";
      }
    };
  };

  /***************************
   * hangul 2 (KS X 5002)
   ***************************/
  var imH2 = new (function() {
    this.name = 'H2';
    this.buf = new buf();
    this.hangul = new hangul();

    //handleKeyEvent for hangul 2
    this.handleKeyEvent = function(oKeyEvent) {
      if(oKeyEvent.charCode == key.ENTER) {
        this.buf.flush();
        return {name:'insPara'};
      }else if(oKeyEvent.charCode == key.BACKSPACE) {
        if(this.buf.size() > 1) {
          this.buf.init(1);
          return {name:'cmbChar', value:this.parse(this.buf.get())};
        }else{
          this.buf.flush();
          return {name:'delChar'};
        }
      }else if(key.isAlpha(oKeyEvent.charCode)) {
        var sCmd = this.buf.size() == 0 ? 'insChar' : 'cmbChar';
        var aHangul = this.parse(this.buf.get() + String.fromCharCode(oKeyEvent.charCode));
        return {name:sCmd, value:aHangul.join("")};
      }else{
        this.buf.flush();
        return {name:'insChar', value:String.fromCharCode(oKeyEvent.charCode)};
      }
    };

    this.parse = function(stream) {
      this.buf.flush();

      var cho = -1, vowel = -1, jong = -1;
      var flushed = [];
      var aCh = stream.split('');
      for (var idx = 0, len = aCh.length; idx < len; idx++) {
        var ch = aCh[idx];
        this.buf.push(ch);
        var newCho = this.aCho.indexOf(ch);
        var newVowel = this.aVowel.indexOf(ch);

        //0. initial state
        if(cho < 0 && vowel < 0 && jong < 0) {
          if(newCho >= 0) { //01. ???
            cho = newCho;
          }else if(newVowel >= 0) { //02. ???
            vowel = newVowel;
          }
          //1. ???
        }else if(cho >= 0 && vowel < 0 && jong < 0) {
          if(newCho >= 0) { //11. ???+???, check flush
            var combineCho = this.getCombineCho(cho, newCho);
            if(combineCho >= 0) {
              cho = combineCho;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.getCho(cho));
              cho = newCho;
            }
          }else if(newVowel >= 0) { //12. ???+???
            vowel = newVowel;
          }
          //2. ???
        }else if(cho >= 0 && vowel >= 0 && jong < 0) {
          if(newCho >= 0) { //21. ???+???, check flush
            var newJong = this.aJong.indexOf(ch);
            if(newJong >= 0) {
              jong = newJong;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = newCho;
              vowel = -1;
              jong = -1;
            }
          }else if(newVowel >= 0) { //22. ???+???, check flush
            var combineVowel = this.getCombineVowel(vowel, newVowel);
            if(combineVowel >= 0) {
              vowel = combineVowel;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = -1;
              vowel = newVowel;
            }
          }
          //3. ???
        }else if(cho >= 0 && vowel >= 0 && jong >= 0) {
          if(newCho >= 0) { //31. ???+???, check flush
            var combineJong = this.getCombineJong(jong, newCho);
            if(combineJong >= 0) {
              jong = combineJong;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = newCho;
              vowel = -1;
              jong = -1;
            }
          }else if(newVowel >= 0) { //32. ???+???, flush
            var aSplited = this.getSplitedJong(jong);
            this.buf.tail(2);
            flushed.push(this.hangul.get(cho, vowel, aSplited[0]));

            cho = aSplited[aSplited.length-1];
            vowel = newVowel;
            jong = -1;
          }
          //4. ???
        }else if(cho < 0 && vowel >= 0 && jong < 0) {
          if(newCho >= 0) { //41. ??? + ??? = ???, *)adjust typo
            cho = newCho;
          }else if(newVowel >= 0) { //42. ??? + ??? = ???
            var combineVowel = this.getCombineVowel(vowel, newVowel);
            if(combineVowel >= 0) {
              vowel = newVowel;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = -1;
              vowel = newVowel;
            }
          }
        }
      };

      flushed.push(this.hangul.get(cho, vowel, jong));
      return flushed;
    }

    /**
     * combine chosung (ex: ???+???=???)
     **/
    this.getCombineCho = function( cho1, cho2 ) {
      var ch = this.aCho[cho1];
      if(cho1 == cho2 && ch.toLowerCase() == ch) {
        return this.aCho.indexOf(ch.toUpperCase()); //??? -> ???
      }else{
        return -1;
      }
    };

    /**
     * combine chosung (ex: ???+???=???)
     **/
    this.getCombineVowel = function( vowel1, vowel2 ) {
      var oMapping = {
        'kl' : 'o' //???+???=???
      }
      var combined = this.aVowel[vowel1] + this.aVowel[vowel2];
      return this.aVowel.indexOf(oMapping[combined] || combined);
    };

    /**
     * combine chosung (ex: ???+???=??????)
     **/
    this.getCombineJong = function( jong, cho ) {
      return this.aJong.indexOf(this.aJong[jong] + this.aCho[cho]);
    };

    /**
     * splited jong (ex: ?????? -> [???(jong), ???(cho)], ??? -> [-1(jong), ???(cho)])
     **/
    this.getSplitedJong = function( jong ) {
      var ch = this.aJong[jong];
      if(ch.length > 1) {
        return [this.aJong.indexOf(ch[0]), this.aCho.indexOf(ch[1])];
      }else{
        return [-1, this.aCho.indexOf(ch)];
      }
    };

    this.aCho = [
      'r',//???
      'R',//???
      's',//???
      'e',//???
      'E',//???
      'f',//???
      'a',//???
      'q',//???
      'Q',//???
      't',//???
      'T',//???
      'd',//???
      'w',//???
      'W',//???
      'c',//???
      'z',//???
      'x',//???
      'v',//???
      'g' //???
    ];

    this.aVowel = [
      'k',//???
      'o',//???
      'i',//???
      'O',//???
      'j',//???
      'p',//???
      'u',//???
      'P',//???
      'h',//???
      'hk',//???
      'ho',//???
      'hl',//???
      'y',//???
      'n',//???
      'nj',//???
      'np',//???
      'nl',//???
      'b',//???
      'm',//???
      'ml',//???
      'l' //???
    ];

    this.aJong = [
      '', //padding
      'r',//???
      'R',//???
      'rt',//???
      's',//???
      'sw',//???
      'sg',//???
      'e',//???
      'f',//???
      'fr',//???
      'fa',//???
      'fq',//???
      'ft',//???
      'fx',//???
      'fv',//???
      'fg',//???
      'a',//???
      'q',//???
      'qt',//???
      't',//???
      'T',//???
      'd',//???
      'w',//???
      'c',//???
      'z',//???
      'x',//???
      'v',//???
      'g' //???
    ];

    //String.fromCharCode(12593 + idx)
    this.aJaso = [
      'r',//???
      'R',//???
      'rt',//???
      's',//???
      'sw',//???
      'sg',//???
      'e',//???
      'E',//???
      'f',//???
      'fr',//???
      'fa',//???
      'fq',//???
      'ft',//???
      'fx',//???
      'fv',//???
      'fg',//???
      'a',//???
      'q',//???
      'Q',//???
      'qt',//???
      't',//???
      'T',//???
      'd',//???
      'w',//???
      'W',//???
      'c',//???
      'z',//???
      'x',//???
      'v',//???
      'g',//???
      'k',//???
      'o',//???
      'i',//???
      'O',//???
      'j',//???
      'p',//???
      'u',//???
      'P',//???
      'h',//???
      'hk',//???
      'ho',//???
      'hl',//???
      'y',//???
      'n',//???
      'nj',//???
      'np',//???
      'nl',//???
      'b',//???
      'm',//???
      'ml',//???
      'l' //???
    ];
    this.hangul.init(this.aCho, this.aVowel, this.aJong, this.aJaso);
  })();

  /***************************
   * hangul 390 (by blueiur)
   * under construction
   ***************************/
  var imH390 = new (function() {
    this.name = 'H390';
    this.buf = new buf();
    this.hangul = new hangul();

    //handleKeyEvent for hangul 390
    this.handleKeyEvent = function(oKeyEvent) {
      if (oKeyEvent.charCode == key.ENTER){
        this.buf.flush();
        return {name:'insPara'};
      }else if (oKeyEvent.charCode == key.BACKSPACE){
        if (this.buf.size() > 1){
          this.buf.init(1);
          return {name:'cmbChar', value:this.parse(this.buf.get())};
        }else{
          this.buf.flush();
          return {name:'delChar'};
        }
      }else if (key.isAlpha(oKeyEvent.charCode)){
        var sCmd = this.buf.size() == 0 ? 'insChar' : 'cmbChar';
        var aHangul = this.parse(this.buf.get() + String.fromCharCode(oKeyEvent.charCode));
        return {name:sCmd, value:aHangul.join("")};
      }else{
        this.buf.flush();
        return {name:'insChar', value:String.fromCharCode(oKeyEvent.charCode)};
      }
    };

    this.parse = function(stream) {
      this.buf.flush();

      var cho = -1, vowel = -1, jong = -1;
      var flushed = [];
      var aCh = stream.split('');
      for (var idx = 0, len = aCh.length; idx < len; idx++) {
        var ch = aCh[idx];
        this.buf.push(ch);
        var newCho = this.getIndex("cho", ch);
        var newVowel = this.getIndex("vowel", ch);
        var newJong = this.getIndex("jong", ch);

        //0. initial state
        if (cho < 0 && vowel < 0 && jong < 0){
          if (newCho >= 0){ //01. ???
            cho = newCho;
          }else if (newVowel >= 0){ //02. ???
            vowel = newVowel;
          }else if (newJong >= 0){
            cho = this.getChoFromJong(newJong);
          }
        }else if (cho >= 0 && vowel < 0 && jong < 0){
          if (newCho >= 0){ //11. ???+???, check flush
            var combineCho = this.getCombineCho(cho, newCho);
            if (combineCho >= 0){
              cho = combineCho;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.getCho(cho));
              cho = newCho;
            }
          }else if (newVowel >= 0){ //12. ???+???
            vowel = newVowel;
          }else if(newJong >= 0){
            this.buf.tail(1);
            flushed.push(this.hangul.getCho(cho));
            cho = this.getChoFromJong(newJong);
          }
          //2. ???
        }else if (cho >= 0 && vowel >= 0 && jong < 0){					
          if ( newCho >= 0 ){
            this.buf.tail(1);
            flushed.push(this.hangul.get(cho, vowel, jong));
            cho = newCho;
            vowel = -1;
          }else if ( newVowel >= 0 ){ //22. ???+???, check flush
            var combineVowel = this.getCombineVowel(vowel, newVowel);
            if (combineVowel >= 0){
              vowel = combineVowel;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = -1;
              vowel = newVowel;
            }
          }else if ( newJong > -1 ){ //21. ???+???, check flush
            jong = newJong;
          }
          //3. ???
        }else if (cho >= 0 && vowel >= 0 && jong >= 0){
          if (newCho >= 0){ //31. ???+???, check flush
            var combineJong = this.getCombineJong(jong, newJong);
            if (combineJong >= 0){
              jong = combineJong;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = newCho;
              vowel = -1;
              jong = -1;
            }
          }else if (newVowel >= 0){ //32. ???+???, flush
            this.buf.tail(1);
            flushed.push(this.hangul.get(cho, vowel, jong));
            cho = -1;
            vowel = newVowel;
            jong = -1;
          }else if (newJong > -1){
            var combineJong = this.getCombineJong(jong, newJong);
            if (combineJong >= 0){
              jong = combineJong;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = this.getChoFromJong(newJong);
              vowel = -1;
              jong = -1;
            }
          }
          //4. ???
        }else if (cho < 0 && vowel >= 0 && jong < 0){
          if (newCho >= 0){ //41. ??? + ??? = ???, *)adjust typo
            cho = newCho;
          }else if (newVowel >= 0){ //42. ??? + ??? = ???
            var combineVowel = this.getCombineVowel(vowel, newVowel);
            if (combineVowel >= 0){
              vowel = newVowel;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = -1;
              vowel = newVowel;
            }
          }else if (newJong >= 0){
            cho = this.getChoFromJong(newJong);
          }
        }
      };

      if ( cho > -1 || vowel > -1 || jong > -1){ // jong first
        flushed.push(this.hangul.get(cho, vowel, jong));
      }

      return flushed;
    };

    /**
     * combine chosung (ex: ???+???=???)
     **/
    this.getCombineCho = function( cho1, cho2 ){
      var ch = this.aCho[cho1];
      if (cho1 == cho2){
        return this.getIndex("cho", ch + ch); //??? -> ???
      }else{
        return -1;
      }
    };

    /**
     * combine vowel (ex: ???+???=???)
     **/
    this.getCombineVowel = function( vowel1, vowel2 ){
      return this.getIndex("vowel", this.aVowel[vowel1] + this.aVowel[vowel2]);
    };

    /**
     * combine jong (ex: ???+???=??????)
     **/
    this.getCombineJong = function( jong, newJong ){
      return this.getIndex("jong", this.aJong[jong] + this.aJong[newJong]);
    };

    this.getIndex = function(name, ch){
      if (name == "cho"){
        return this.aCho.indexOf(ch);
      }else if (name == "vowel"){
        if (ch == "/"){ ch = "v";};
        if (ch == "9"){ ch = "b";};
        return this.aVowel.indexOf(ch);
      }else if (name == "jong"){
        return this.aJong.indexOf(ch);
      }

      return -1;
    };

    this.getChoFromJong = function(jong){
      var map ={
        "x" : "k", //???
        "s" : "h", //???
        "A" : "u",//???
        "w" : "y", //???
        "z" : "i",//???
        "3" : ";",//???
        "q" : "n",//???
        "a" : "j",//???
        "!" : "i",//???
        "Z" : "o",//???
        "e" : "0",//???
        "W" : "'",//???
        "Q" : "p",//???
        "1" : "m"//???
      };
      var ch = map[ this.aJong[jong] ];
      return this.aCho.indexOf( ch );
    };

    this.aCho = [
      "k",//???
      "kk",//???
      "h",//???
      "u",//???
      "uu",//???
      "y",//???
      "i",//???
      ";",//???
      ";;",//???
      "n",//???
      "nn",//???
      "j",//???
      "l",//???
      "ll",//???
      "o",//???
      "0",//???
      "'",//???
      "p",//???
      "m" //???
    ];

    this.aVowel = [
      "f",//???
      "r",//???
      "6",//???
      "R",//???
      "t",//???
      "c",//???
      "e",//???
      "7",//???
      "v",//???
      "vf",//???
      "vr",//???
      "vd",//???
      "4",//???
      "b",//???
      "bt",//???
      "bc",//???
      "bd",//???
      "5",//???
      "g",//???
      "gd",//???
      "d" //???
    ];

    this.aJong = [
      "", //padding
      "x",//???
      "F",//???
      "xq",//???
      "s",//???
      "s!",//???
      "S",//???
      "A",//???
      "w",//???
      "wx",//???
      "wz",//???
      "w3",//???
      "wq",//???
      "wW",//???
      "wQ",//???
      "V",//???
      "z",//???
      "3",//???
      "3q",//???
      "q",//???
      "2",//???
      "a",//???
      "!",//???
      "Z",//???
      "e",//???
      "W",//???
      "Q",//???
      "1" //???
    ];

    //String.fromCharCode(12593 + idx)
    this.aJaso = [
      "k",//???
      "kk",//???
      "xq",//???
      "h",//???
      "s!",//???
      "S",//???
      "u",//???
      "uu",//???
      "y",//???
      "wx",//???
      "wz",//???
      "w3",//???
      "wq",//???
      "wW",//???
      "wQ",//???
      "V",//???
      "i",//???
      ";",//???
      ";;",//???
      "3q",//???
      "n",//???
      "nn",//???
      "j",//???
      "l",//???
      "ll",//???
      "o",//???
      "0",//???
      "'",//???
      "p",//???
      "m",//???
      "f",//???
      "r",//???
      "6",//???
      "R",//???
      "t",//???
      "c",//???
      "e",//???
      "7",//???
      "v",//???
      "vf",//???
      "vr",//???
      "vd",//???
      "4",//???
      "b",//???
      "bt",//???
      "bc",//???
      "bd",//???
      "5",//???
      "g",//???
      "gdl",//???
      "d" //???
    ];

    this.hangul.init(this.aCho, this.aVowel, this.aJong, this.aJaso);
  })();

  var imejs = new ime();

  // AMD / RequireJS
  if (typeof define !== 'undefined' && define.amd) {
    define('imejs', [], function () {
      return imejs;
    });
  }
  
  // Node.js
  else if (typeof module !== 'undefined' && module.exports) {
    module.exports = imejs;
  }
  
  // included directly via <script> tag
  else {
    root.ime = imejs;
  }
  
})(this); //root object, window in the browser
