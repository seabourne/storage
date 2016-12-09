'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _BaseModel = require('./BaseModel');

var _BaseModel2 = _interopRequireDefault(_BaseModel);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _traverse = require('traverse');

var _traverse2 = _interopRequireDefault(_traverse);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function cleanPolygon(coordinates) {
  return _underscore2.default.uniq(coordinates, false, i => {
    return i[0] + "-" + i[1];
  }).concat([coordinates[0]]);
}

function extractGeometry(obj) {
  return (0, _traverse2.default)(obj).reduce(function (acc, x) {
    if (this.key == 'geometry') {
      if (x.type == 'Polygon') {
        // Filter illegal repeats of coordinates, re-add end point
        x.coordinates[0] = cleanPolygon(x.coordinates[0]);
      }
      if (x.type == 'MultiPolygon') {
        // Filter illegal repeats of coordinates, re-add end point
        x.coordinates = _underscore2.default.map(x.coordinates, coords => {
          coords[0] = cleanPolygon(coords[0]);
          return coords;
        });
      }
      acc.push(x);
    };
    return acc;
  }, []);
}

function extractGeometryFeatures(values, next) {
  var orig = this.geometryField;
  var features = this.geometryFeatureField;
  if (values[orig]) {
    let val = values[orig];
    if (_underscore2.default.isString(val)) {
      val = JSON.parse(val);
    }
    values[features] = extractGeometry(val);
    if (this.geometrySingle) {
      values[features] = values[features][0];
    }
  }
  next();
}

exports.default = _BaseModel2.default.extend({

  // Lifecycle

  geometryField: 'geo',
  geometryFeatureField: 'geoFeatures',
  geometrySingle: false,
  extractGeometryFeatures: extractGeometryFeatures,

  beforeCreate: extractGeometryFeatures,

  beforeUpdate: extractGeometryFeatures,

  createGeoIndex: function () {
    this.native((err, collection) => {
      var index = {};
      index[this.geometryFeatureField] = '2dsphere';
      collection.ensureIndex(index, () => {});
    });
  },

  findWithin: function (coordinates, query = {}) {
    return this._geoFind('$geoWithin', coordinates, query);
  },

  findIntersects: function (coordinates, query = {}) {
    return this._geoFind('$geoIntersects', coordinates, query);
  },

  _geoFind: function (op, coordinates, query = {}) {
    let geo_query = _underscore2.default.extend(query, {});
    geo_query[this.geometryFeatureField] = {};
    geo_query[this.geometryFeatureField][op] = { $geometry: coordinates };
    return new _bluebird2.default((resolve, reject) => {
      this.native((err, collection) => {
        if (err) {
          reject(err);
        }
        collection.find(geo_query, { _id: 1 }).toArray((err, objs) => {
          if (err) {
            reject(err);
          }
          query['id'] = _underscore2.default.pluck(objs, '_id');
          resolve(() => {
            return this.find(query);
          });
        });
      });
    });
  }

});