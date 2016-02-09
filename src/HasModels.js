'use strict'

/** HasModels base class for modules to get this.models populated on startup */
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
   * Override to define the model names to access
   * @return {object} (model identifier: class attribute) pairs
   * @example model_names() { 
   * return {'user': 'User'}
   * }
   */
  model_names () {
    throw this.constructor.name+".model_names not implemented"
  }
}
