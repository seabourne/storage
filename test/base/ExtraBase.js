'use strict'

import {BaseModel} from '../../src/'

export default BaseModel.extend({
  attributes: {
    name: 'string'
  },
  helperMethod: function(a) {
    return a
  }
})
