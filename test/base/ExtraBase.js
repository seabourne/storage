'use strict'

import {BaseModel} from '../../src/Storage'

export default BaseModel.extend({
  attributes: {
    name: 'string'
  },
  helperMethod: function(a) {
    return a
  }
})
