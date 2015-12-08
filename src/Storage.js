'use strict';

import Waterline from 'waterline'
import Promise from 'bluebird'

const _defaultConfig = {
  adapters: {
    'default': 'sails-memory'
  },
  connections: {
    'default': {
      adapter: 'default',
    }
  },
  modelsDir: './src/models'
};

class Storage {
  constructor (app) {
    this.waterline = Promise.promisifyAll(new Waterline());
    this.waterlineConfig = null;
    this.collections = null;
    this.connections = null;
    
    app.once('load', () => {

      app.get('storage').gather('registerModel').each(this._registerModel.bind(this));
//      app.get('storage').on('getModel', this._getModel.bind(this));
      
      this.config = Object.assign(_defaultConfig, app.config.storage);
      
      return this._loadLocalModels();
    });

    app.once('startup.before', () => {
      return this._connectDb();
    });

  }

  _loadLocalModels () {
    // TODO
  }

  _connectDb () {
    return this.waterline.initializeAsync({
      adapters: this.config.adapters,
      connections: this.config.connections
    }).then((obj) => {
        this.connections = obj.connections;
        this.collections = obj.collections;
      });
  }
  
  _registerModel (model) {
    this.waterline.loadCollection(model)
  }

  _getModel (id) {
    return this.collections[id];
  }

  
}
Storage.Waterline = Waterline;

export default Storage;
