'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
  * Metadata
  */

var metadataPrefix = 'x-amz-meta-'; // Lowercase due to aws requirements

var Metadata = exports.Metadata = function () {
  function Metadata() {
    _classCallCheck(this, Metadata);
  }

  _createClass(Metadata, null, [{
    key: 'generate',
    value: function generate(options) {

      var metadata = {};

      if (options.metadata) {
        Object.keys(options.metadata).forEach(function (k) {
          metadata[metadataPrefix + k] = options.metadata[k];
        });
      }

      return metadata;
    }
  }]);

  return Metadata;
}();