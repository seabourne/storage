'use strict'

import _ from 'underscore'

/** 
 * The HasModels class is a Base class for defining helper classes with Models.
 */
export default class HasModels {
  constructor(app) {
    this.models = {}
    
    app.on('startup', () => {
      let mods = this.modelNames();
      if (_.isArray(mods)) {
        mods = _.object(mods, mods)
      }
      for (let id in mods) {
        app.get('storage').getModel(id).then((model) => {
          this.models[mods[id]] = model;
        })
      }
    })
  }

  /**
   * Override to define the model names to access
   * @return {array|object} Model identities to add to this.models, or object of {identity: name}
   * @example modelNames() { 
   * return ['user']
   * }
   */
  modelNames () {
    throw this.constructor.name+".modelNames not implemented"
  }
}
