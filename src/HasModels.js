'use strict'

/** 
 * The HasModels class is a Base class for defining helper classes with Models.
 */
export default class HasModels {
  constructor(app) {
    this.models = {}
    
    app.on('startup', () => {
      let mods = this.model_names();
      for (let id in mods) {
        app.get('storage').getModel(id).then((model) => {
          this.models[mods[id]] = model;
        })
      }
    })
  }

  /**
   * Define the model names to access
   * @return {object} (model identifier: class attribute) pairs
   */
  model_names () {
    throw this.constructor.name+".model_names not implemented"
  }
}
