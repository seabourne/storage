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

/** Storage module */
class Storage {
  constructor (app) {
    this.waterline = Promise.promisifyAll(new Waterline());
    this.waterlineConfig = null;
    this.collections = {};
    this.connections = null;
    this.app = app;

    this.config = Object.assign(_defaultConfig, app.config.storage);

    app.get('storage').use(this)
    this.gather('model')
    this.respond('getModel')

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

  // Handlers

  /**
   * Provide a model
   * @param {object} model A Waterline-compatible model class
   * @example app.get('storage').model(...)
   */
  
  model (model) {
    this.app.log('registering model', model.prototype.identity)
    this.waterline.loadCollection(model)
  }

  /**
   * Request a model based on its identity (name)
   * @param {string} id The identity of a registered model
   * @return {Promise}  The model class
   * @example app.get('storage').getModel('user')
   */
  
  getModel (id) {
    this.app.log('getting model', id)
    return this.collections[id];
  }

  // Internal
  
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
        this.provide('model', m);
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
    this.app.log('connecting to dB', this.config.connections)
    return this.waterline.initializeAsync({
      adapters: this.config.adapters,
      connections: this.config.connections,
      defaults: this.config.defaults
    }).then((obj) => {
      this.app.log('setting collections')
      this.connections = obj.connections;
      this.collections = obj.collections;
    });
  }
  
}
Storage.Waterline = Waterline;
Storage.HasModels = HasModels;

export default Storage;
