'use strict'

import {BaseModel} from '../../src/Storage'

var One = BaseModel.extend({
  identity: 'one',
  attributes: {
    'color': 'string',
  }
});

export default One;
