"use strict";

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

/**
 @class BroadcastChannel
 A simple BroadcastChannel polyfill that works with all major browsers.
 Please refer to the official MDN documentation of the Broadcast Channel API.
 @see <a href="https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API">Broadcast Channel API on MDN</a>
 @author Alessandro Piana
 @version 0.0.5
 */

/*
  MIT License
  Copyright (c) 2021 Alessandro Piana
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/
// Internal variables
var context = window;
var _channels = null; // List of channels

var _tabId = null; // Current window browser tab identifier (see IE problem, later)

var _prefix = 'polyBC_'; // prefix to identify localStorage keys.

/**
 * Utils
 * @private
 */

var getRandomString = function getRandomString(len) {
  if (len === void 0) {
    len = 5;
  }

  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < len; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
};

var isEmpty = function isEmpty(obj) {
  return !Object.keys(obj).length;
};

var getTimestamp = function getTimestamp() {
  return new Date().getTime();
};
/**
 * Build a "similar" response as done in the real BroadcastChannel API
 */


var buildResponse = function buildResponse(data) {
  return {
    timestamp: getTimestamp(),
    isTrusted: true,
    target: null,
    // Since we are using JSON stringify, we cannot pass references.
    currentTarget: null,
    data: data,
    bubbles: false,
    cancelable: false,
    defaultPrevented: false,
    lastEventId: '',
    origin: context.location.origin
  };
};
/**
 * Handler of the 'storage' function.
 * Called when another window has sent a message.
 * @param {Object} ev - the message.
 * @private
 */


var _onmsg = function _onmsg(ev) {
  var key = ev.key;
  var newValue = ev.newValue;
  var isRemoved = !newValue;
  var obj = null; // Actually checks if the messages if from us.

  if (key.indexOf(_prefix + "message_") > -1 && !isRemoved) {
    try {
      obj = JSON.parse(newValue);
    } catch (ex) {
      throw 'Message conversion has resulted in an error.';
    } // NOTE: Check on tab is done to prevent IE error
    // (localStorage event is called even in the same tab :( )


    if (obj.tabId !== _tabId && obj.channelId && _channels && _channels[obj.channelId]) {
      var subscribers = _channels[obj.channelId];
      subscribers.forEach(function (sub) {
        if (!sub.closed) {
          var event = new CustomEvent('message', obj.message);
          sub.dispatchEvent(event);
        }
      }); // Remove the item for safety.

      context.localStorage.removeItem(key);
    }
  }
};
/**
 * Creates a new BroadcastChannel
 * @param {String} channelName - the channel name.
 * return {BroadcastChannel}
 */


var _BroadcastChannel = /*#__PURE__*/function (_EventTarget) {
  _inheritsLoose(_BroadcastChannel, _EventTarget);

  function _BroadcastChannel(channelName) {
    var _this;

    if (channelName === void 0) {
      channelName = '';
    }

    _this = _EventTarget.call(this) || this;
    _this.channelId = '';
    _this.channelName = '';
    _this.name = '';
    _this.closed = false;
    _this.channelName = channelName; // Check if localStorage is available.

    if (!context.localStorage) {
      throw 'localStorage not available';
    } // Add custom prefix to Channel Name.


    var _channelId = _prefix + channelName;

    var isFirstChannel = _channels === null;
    _this.channelId = _channelId;
    _tabId = _tabId || getRandomString(); // Creates a new tab identifier, if necessary.

    _channels = _channels || {}; // Initializes channels, if necessary.

    _channels[_channelId] = _channels[_channelId] || []; // Adds the current Broadcast Channel.

    _channels[_channelId].push(_assertThisInitialized(_this)); // Creates a sufficiently random name for the current instance of BC.


    _this.name = _channelId + '::::' + getRandomString() + getTimestamp(); // If it is the first instance of Channel created, also creates the storage listener.

    if (isFirstChannel) {
      // addEventListener.
      context.addEventListener('storage', _onmsg.bind(_assertThisInitialized(_this)), false);
    }

    return _this;
  }
  /**
   * Sends the message to different channels.
   * @param {Object} data - the data to be sent ( actually, it can be any JS type ).
   */


  var _proto = _BroadcastChannel.prototype;

  _proto.postMessage = function postMessage(data) {
    var _this2 = this;

    if (!_channels) return;

    if (this.closed) {
      throw 'This BroadcastChannel is closed.';
    } // Build the event-like response.


    var msgObj = buildResponse(data); // SAME-TAB communication.

    var subscribers = _channels[this.channelId] || [];
    subscribers.forEach(function (sub) {
      // We don't send the message to ourselves.
      if (sub.closed || sub.name === _this2.name) return;
      var event = new CustomEvent('message', msgObj);
      sub.dispatchEvent(event);
    }); // CROSS-TAB communication.
    // Adds some properties to communicate among the tabs.

    var editedObj = {
      channelId: this.channelId,
      bcId: this.name,
      tabId: _tabId,
      message: msgObj
    };

    try {
      var editedJSON = JSON.stringify(editedObj);
      var lsKey = _prefix + "message_" + getRandomString() + "_" + this.channelId; // Set localStorage item (and, after that, removes it).

      context.localStorage.setItem(lsKey, editedJSON);
      setTimeout(function () {
        return context.localStorage.removeItem(lsKey);
      }, 1000);
    } catch (ex) {
      throw 'Message conversion has resulted in an error.';
    }
  };

  /**
   * Closes a Broadcast channel.
   */
  _proto.close = function close() {
    this.closed = true;
    var subscribers = _channels[this.channelId];
    var index = subscribers.indexOf(this);

    if (index > -1) {
      subscribers.splice(index, 1);
    } // If we have no channels, remove the listener.


    if (!subscribers.length) {
      delete _channels[this.channelId];
    }

    if (isEmpty(_channels)) {
      context.removeEventListener('storage', _onmsg.bind(this));
    }
  };

  return _BroadcastChannel;
}( /*#__PURE__*/_wrapNativeSuper(EventTarget));

module.exports = context.BroadcastChannel || _BroadcastChannel;