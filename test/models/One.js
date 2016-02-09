'use strict'

import {Waterline} from '../../src'

var One = Waterline.Collection.extend({
  identity: 'one',
  connection: 'default',
  attributes: {}
});

export default One;
