/**
 * @namespace Storage
 */

'use strict';

import waterline from 'waterline'
import Promise from 'bluebird'
import _ from 'underscore'

import hasModels from './HasModels'
import baseModel from './BaseModel'

import path from 'path'
import fs_ from 'fs'
const fs = Promise.promisifyAll(fs_);

const REGEX_FILE = /[^\/\~]$/;

const _defaultConfig = {
  adapters: {
    'default': "sails-mongo"
  },
  connections: {
    'default': {
      "adapter": "default",
      "url": "mongodb://localhost/nxus-app"
    }
  },
  defaults: {
    migrate: 'alter',
  },
  modelsDir: './src/models'
};

export var HasModels = hasModels
export var Waterline = waterline
export var BaseModel = baseModel

/**
 * Storage provides a common interface for defining models.  Uses the Waterline ORM.
 */
export default class Storage {
  constructor (app) {
    BaseModel.prototype.storageModule = this
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
   * Register a model
   * @param {object} model A Waterline-compatible model class
   */
  
  model (model) {
    this.app.log.debug('Registering model', model.identity)
    this.waterline.loadCollection(model)
  }

  /**
   * Retrieve a model based on its identity (name)
   * @param {string} id The identity of a registered model
   * @return {Promise}  The model class
   */
  
  getModel (id) {
    this.app.log.debug('Getting model', id)
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
    this.app.log.debug('Connecting to dB')
    return this.waterline.initializeAsync({
      adapters: this.config.adapters,
      connections: this.config.connections,
      defaults: this.config.defaults
    }).then((obj) => {
      this.app.log.debug('setting collections')
      this.connections = obj.connections;
      this.collections = obj.collections;
    });
  }

  emitModelEvent (action, identity, record) {
    this.emit('model.'+action, identity, record)
    this.emit('model.'+action+'.'+identity, record)
  }
  
}
