'use strict'

/** 
 * The HasModels class is a Base class for defining helper classes with Models.
 */
export default class HasModels {
  constructor(app) {
    this.models = {}
    
    app.on('startup', () => {
      let mods = this.modelNames();
      for (let id in mods) {
        app.get('storage').getModel(id).then((model) => {
          this.models[mods[id]] = model;
        })
      }
    })
  }

  /**
   * Override to define the model names to access
   * @return {object} (model identifier: class attribute) pairs
   * @example model_names() { 
   * return {'user': 'User'}
   * }
   */
  modelNames () {
    throw this.constructor.name+".modelNames not implemented"
  }
}
