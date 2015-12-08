'use strict';

var Storage = require('./lib/Storage')

module.exports = function(app) {
  new Storage(app)
}
