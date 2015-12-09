'use strict';

import Waterline from 'waterline'
import Promise from 'bluebird'

import path from 'path'
import fs_ from 'fs'
const fs = Promise.promisifyAll(fs_);

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
    this.app = app;
    
    app.once('load', () => {

      app.get('storage').gather('model').each(this._registerModel.bind(this));
      app.get('storage').on('getModel', this._getModel.bind(this));
      
      this.config = Object.assign(_defaultConfig, app.config.storage);
      
      return this._loadLocalModels();
    });

    app.once('startup.before', () => {
      return this._connectDb();
    });

  }

  _loadLocalModels () {
    var dir = this.config.modelsDir;
    try {
      fs.accessSync(dir);
    } catch (e) {
      return;
    }
    return fs.readdirAsync(dir).each((file) => {
      var p = path.resolve(path.join(dir,path.basename(file, '.js')));
      var m = require(p);
      this.app.get('storage').emit('model').with(m);
    });
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
