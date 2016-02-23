import BaseModel from './BaseModel'
import Promise from 'bluebird'

import traverse from 'traverse'
import _ from "underscore"

function cleanPolygon(coordinates) {
  return _.uniq(coordinates, false, (i) => { return i[0]+"-"+i[1] }).concat([coordinates[0]])
  
}

function extractGeometry(obj) {
  return traverse(obj).reduce(function(acc, x) {
    if(this.key == 'geometry') {
      if (x.type == 'Polygon') {
        // Filter illegal repeats of coordinates, re-add end point
        x.coordinates[0] = cleanPolygon(x.coordinates[0])
      }
      if (x.type == 'MultiPolygon') {
        // Filter illegal repeats of coordinates, re-add end point
        x.coordinates = _.map(x.coordinates, (coords) => {
          coords[0] = cleanPolygon(coords[0])
          return coords
        })
      }
      acc.push(x)
    };
    return acc;
  }, [])
}

function extractGeometryFeatures(values, next) {
  var orig = this.geometryField
  var features = this.geometryFeatureField
  if (values[orig]) {
    let val = values[orig]
    if (_.isString(val)) {
      val = JSON.parse(val)
    }
    values[features] = extractGeometry(val);
    if (this.geometrySingle) {
      values[features] = values[features][0]
    }
  }
  next()
}

export default BaseModel.extend({

  // Lifecycle

  geometryField: 'geo',
  geometryFeatureField: 'geoFeatures',
  geometrySingle: false,
  extractGeometryFeatures: extractGeometryFeatures,

  
  beforeCreate: extractGeometryFeatures,
  
  beforeUpdate: extractGeometryFeatures,

  createGeoIndex: function() {
    this.native((err, collection) => {
      var index = {}
      index[this.geometryFeatureField] = '2dsphere'
      collection.ensureIndex(index, () => {})
    })
  },


  findWithin: function(coordinates, query={}) {
    return this._geoFind('$geoWithin', coordinates, query)
  },

  findIntersects: function(coordinates, query={}) {
    return this._geoFind('$geoIntersects', coordinates, query)
  },
  
  _geoFind: function(op, coordinates, query={}) {
    let geo_query = _.extend(query, {})
    geo_query[this.geometryFeatureField] = {}
    geo_query[this.geometryFeatureField][op] = {$geometry: coordinates}
    return new Promise((resolve, reject) => {
      this.native((err, collection) => {
        if(err) { reject(err) }
        collection.find(geo_query, {_id: 1}).toArray((err, objs) => {
          if(err) { reject(err) }
          query['id'] = _.pluck(objs, '_id')
          resolve(() => { return this.find(query)})
        })
      })
    })
  }

})
