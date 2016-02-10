import Waterline from 'waterline'
import _ from 'underscore'

var BaseModel = Waterline.Collection.extend({
  connection: 'default',
  attributes: {
    
  },
  createOrUpdate: function(criteria, values) {
    return this.findOne(criteria).then((obj) => {
      if (obj) {
        return this.update(obj.id, values).then((objs) => { return objs[0]})
      } else {
        return this.create(values)
      }
    })
  }
})

BaseModel.extend = function(protoProps, staticProps) {
  // Waterline wants each model to have its own connection property, rather than inheriting
  if (protoProps.connection === undefined) {
    protoProps.connection = this.prototype.connection
  }
  // Waterline wants each model to have its own attributes property, we want to combine
  if (protoProps.attributes === undefined) {
    protoProps.attributes = {}
  }
  protoProps.attributes = _.extend(this.prototype.attributes, protoProps.attributes)
  return Waterline.Collection.extend.call(this, protoProps, staticProps)
}

export default BaseModel
