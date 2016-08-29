'use strict'

import {BaseModel} from '../../'

export default BaseModel.extend({
  attributes: {
    name: 'string'
  },
  helperMethod: function(a) {
    return a
  }
})
