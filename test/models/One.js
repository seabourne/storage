'use strict'

import {BaseModel} from '../../src/'

var One = BaseModel.extend({
  identity: 'one',
  attributes: {
    'color': 'string',
  }
});

export default One;
