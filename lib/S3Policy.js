'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * S3Policy
 */

var CryptoJS = require('crypto-js');
var Buffer = global.Buffer || require('buffer').Buffer;

var _require = require('./DateUtils'),
    dateToString = _require.dateToString;

var FIVE_MINUTES = 5 * (60 * 1000);

var AWS_ACL = "public-read";
var AWS_SERVICE_NAME = "s3";
var AWS_REQUEST_POLICY_VERSION = "aws4_request";
var AWS_ALGORITHM = "AWS4-HMAC-SHA256";

var DEFAULT_SUCCESS_ACTION_STATUS = "201";

var assert = function assert(object, message) {
  if (null == object) throw new Error(message);
};

var S3Policy = exports.S3Policy = function () {
  function S3Policy() {
    _classCallCheck(this, S3Policy);
  }

  _createClass(S3Policy, null, [{
    key: 'generate',
    value: function generate(options) {
      options || (options = {});

      assert(options.key, "Must provide `key` option with the object key");
      assert(options.bucket, "Must provide `bucket` option with your AWS bucket name");
      assert(options.contentType, "Must provide `contentType` option with the object content type");
      assert(options.region, "Must provide `region` option with your AWS region");
      assert(options.date, "Must provide `date` option with the current date");
      assert(options.accessKey, "Must provide `accessKey` option with your AWSAccessKeyId");
      assert(options.secretKey, "Must provide `secretKey` option with your AWSSecretKey");

      var date = options.date;
      var timeDelta = options.timeDelta || 0;
      var policyExpiresIn = FIVE_MINUTES - timeDelta;
      var expirationDate = new Date(date.getTime() + policyExpiresIn);

      var policyParams = _extends({}, options, {
        acl: options.acl || AWS_ACL,
        algorithm: AWS_ALGORITHM,
        amzDate: dateToString(date, 'amz-iso8601'),
        yyyymmddDate: dateToString(date, 'yyyymmdd'),
        expirationDate: dateToString(expirationDate, 'iso8601'),
        successActionStatus: String(options.successActionStatus || DEFAULT_SUCCESS_ACTION_STATUS)
      });

      policyParams.credential = [policyParams.accessKey, policyParams.yyyymmddDate, policyParams.region, AWS_SERVICE_NAME, AWS_REQUEST_POLICY_VERSION].join('/');

      var policy = formatPolicyForEncoding(policyParams);
      var base64EncodedPolicy = getEncodedPolicy(policy);
      var signature = getSignature(base64EncodedPolicy, policyParams);

      return formatPolicyForRequestBody(base64EncodedPolicy, signature, policyParams);
    }
  }]);

  return S3Policy;
}();

var getDate = function getDate() {
  var date = new Date();
  var yymmdd = date.toISOString().slice(0, 10).replace(/-/g, "");
  var amzDate = yymmdd + "T000000Z";
  return { yymmdd: yymmdd, amzDate: amzDate };
};

/**
 * Expires in 5 minutes. Amazon will reject request
 * if it arrives after the expiration date.
 *
 * returns string in ISO8601 GMT format, i.e.
 *
 *     2016-03-24T20:43:47.314Z
 */
var getExpirationDate = function getExpirationDate() {
  return new Date(new Date().getTime() + FIVE_MINUTES).toISOString();
};

var getPolicyParams = function getPolicyParams(options) {
  var date = getDate();
  var expiration = getExpirationDate();

  return {
    acl: options.acl || AWS_ACL,
    algorithm: AWS_ALGORITHM,
    bucket: options.bucket,
    contentType: options.contentType,
    credential: options.accessKey + "/" + date.yymmdd + "/" + options.region + "/" + AWS_SERVICE_NAME + "/" + AWS_REQUEST_POLICY_VERSION,
    date: date,
    expiration: expiration,
    key: options.key,
    region: options.region,
    secretKey: options.secretKey,
    successActionStatus: '' + (options.successActionStatus || DEFAULT_SUCCESS_ACTION_STATUS),
    metadata: options.metadata
  };
};

var formatPolicyForRequestBody = function formatPolicyForRequestBody(base64EncodedPolicy, signature, options) {
  return {
    "key": options.key,
    "acl": options.acl,
    "success_action_status": options.successActionStatus,
    "Content-Type": options.contentType,
    "X-Amz-Credential": options.credential,
    "X-Amz-Algorithm": options.algorithm,
    "X-Amz-Date": options.amzDate,
    "Policy": base64EncodedPolicy,
    "X-Amz-Signature": signature
  };
};

var formatPolicyForEncoding = function formatPolicyForEncoding(policy) {
  var policyForEncoding = {
    "expiration": policy.expirationDate,
    "conditions": [{ "bucket": policy.bucket }, { "key": policy.key }, { "acl": policy.acl }, { "success_action_status": policy.successActionStatus }, { "Content-Type": policy.contentType }, { "x-amz-credential": policy.credential }, { "x-amz-algorithm": policy.algorithm }, { "x-amz-date": policy.amzDate }]
  };

  if (policy.metadata) {
    Object.keys(policy.metadata).forEach(function (k) {
      var metadata = String(policy.metadata[k]);
      policyForEncoding.conditions.push(_defineProperty({}, k, metadata));
    });
  }

  return policyForEncoding;
};

var getEncodedPolicy = function getEncodedPolicy(policy) {
  return new Buffer(JSON.stringify(policy), "utf-8").toString("base64");
};

var getSignature = function getSignature(base64EncodedPolicy, options) {
  return CryptoJS.HmacSHA256(base64EncodedPolicy, getSignatureKey(options)).toString(CryptoJS.enc.Hex);
};

var getSignatureKey = function getSignatureKey(options) {
  var kDate = CryptoJS.HmacSHA256(options.yyyymmddDate, "AWS4" + options.secretKey);
  var kRegion = CryptoJS.HmacSHA256(options.region, kDate);
  var kService = CryptoJS.HmacSHA256(AWS_SERVICE_NAME, kRegion);
  var kSigning = CryptoJS.HmacSHA256(AWS_REQUEST_POLICY_VERSION, kService);

  return kSigning;
};