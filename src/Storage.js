'use strict';

import Waterline from 'waterline'
import Promise from 'bluebird'
import _ from 'underscore'

import HasModels from './HasModels'

import path from 'path'
import fs_ from 'fs'
const fs = Promise.promisifyAll(fs_);

const REGEX_FILE = /[^\/\~]$/;

const _defaultConfig = {
  adapters: {
    'default': {}
  },
  connections: {
    'default': {
      adapter: 'default',
    }
  },
  defaults: {
    migrate: 'alter',
  },
  modelsDir: './src/models'
};

class Storage {
  constructor (app) {
    this.waterline = Promise.promisifyAll(new Waterline());
    this.waterlineConfig = null;
    this.collections = {};
    this.connections = null;
    this.app = app;

    this.config = Object.assign(_defaultConfig, app.config.storage);

    app.get('storage').gather('model', this._registerModel.bind(this));
    app.get('storage').respond('getModel', this._getModel.bind(this));

    app.once('init', () => {
      return Promise.all([
        this._setupAdapter(),
        this._loadLocalModels()
      ]);
    });

    app.onceAfter('load', () => {
      return this._connectDb();
    });

    app.once('stop', () => {
      return this._disconnectDb();
    })

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
        this.app.get('storage').provide('model', m);
      }
    });
  }

  _setupAdapter () {
    for (var key in this.config.adapters) {
      if (_.isString(this.config.adapters[key])) {
        this.config.adapters[key] = require(this.config.adapters[key]);
      }
    }
  }

  _disconnectDb () {
    return this.waterline.teardownAsync();
  }
  
  _connectDb () {
    console.log('connecting to dB')
    return this.waterline.initializeAsync({
      adapters: this.config.adapters,
      connections: this.config.connections,
      defaults: this.config.defaults
    }).then((obj) => {
      console.log('setting collections')
      this.connections = obj.connections;
      this.collections = obj.collections;
    });
  }
  
  _registerModel (model) {
    console.log('registering model', model)
    this.waterline.loadCollection(model)
  }

  _getModel (id) {
    console.log('getting model', id)
    return this.collections[id];
  }

  
}
Storage.Waterline = Waterline;
Storage.HasModels = HasModels;

export default Storage;
