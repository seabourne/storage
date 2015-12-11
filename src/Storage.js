'use strict';

import Waterline from 'waterline'
import Promise from 'bluebird'

import path from 'path'
import fs_ from 'fs'
const fs = Promise.promisifyAll(fs_);

const REGEX_FILE = /[^\/\~]$/;

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
    
    this.config = Object.assign(_defaultConfig, app.config.storage);

    app.get('storage').gather('model').each(([model]) => { this._registerModel(model)});
    app.get('storage').on('getModel', this._getModel.bind(this));

    app.once('load', () => {
      return this._loadLocalModels();
    });

    app.once('startup.before', () => {
      return this._connectDb();
    });

  }

  _loadLocalModels () {
    var dir = path.resolve(this.config.modelsDir);
    try {
      fs.accessSync(dir);
    } catch (e) {
      return;
    }
    return fs.readdirAsync(dir).each((file) => {
      if (REGEX_FILE.test(file)) {
        var p = path.resolve(path.join(dir,path.basename(file, '.js')));
        var m = require(p);
        this.app.get('storage').send('model').with(m);
      }
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
