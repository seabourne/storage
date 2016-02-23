/**
 * [![Build Status](https://travis-ci.org/nxus/storage.svg?branch=master)](https://travis-ci.org/nxus/storage)
 * 
 * A storage framework for Nxus applications using [waterline](https://github.com/balderdashy/waterline).
 * 
 * # Configuration
 * 
 *     "config": {
 *       "storage": {
 *         "adapter": {
 *           "default": "sails-mongo"
 *         },
 *         "connections": {
 *           "default": {
 *             "adapter": "default",
 *             "url": "mongodb://...."
 *           }
 *         },
 *         "modelsDir": "./src/models"
 *       }
 *     }
 * 
 * # Creating models
 * 
 * Inherit your models from BaseModel
 * 
 *     import {BaseModel} from '@nxus/storage'
 * 
 *     var User = BaseModel.extend({
 *       identity: 'user',
 *       attributes: {
 *         name: 'string'
 *       }
 *     })
 * 
 * # Model events
 * 
 * The storage model emits events for create, update, and destroy, you can register a handler for all events:
 * 
 *       app.get('storage').on('model.create', (identity, record) => {})
 *       app.get('storage').on('model.update', (identity, record) => {})
 *       app.get('storage').on('model.destroy', (identity, record) => {})
 * 
 * Or just a specific model identity:
 * 
 *       app.get('storage').on('model.create.user', (identity, record) => {})
 *       app.get('storage').on('model.update.user', (identity, record) => {})
 *       app.get('storage').on('model.destroy.user', (identity, record) => {})
 * 
 * # Lifecycle notes
 * 
 * -   `load`
 *     -   Models should be registered during `load`, e.g.
 *             var User = BaseModel.extend({
 *               identity: 'user',
 *               ...
 *             });
 *             app.get('storage').model(User)
 * -   `startup`
 *     -   The configured database is connected during `load.after`
 *     -   You can query models from `startup` and beyond, retrieve the model by the 'identity':
 * 
 *             app.get('storage').getModel('user').then((User) => {
 *                 User.create(...);
 *             });
 *
 * # API
 * -------
 */

'use strict';

import waterline from 'waterline'
import Promise from 'bluebird'
import _ from 'underscore'

import hasModels from './HasModels'
import baseModel from './BaseModel'
import geoModel from './GeoModel'

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
export var GeoModel = geoModel

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
   * Provide a model
   * @param {object} model A Waterline-compatible model class
   * @example app.get('storage').model(...)
   */
  
  model (model) {
    this.app.log.debug('Registering model', model.identity)
    this.waterline.loadCollection(model)
  }

  /**
   * Request a model based on its identity (name)
   * @param {string} id The identity of a registered model
   * @return {Promise}  The model class
   * @example app.get('storage').getModel('user')
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
    this.app.log.debug('Connecting to dB', this.config.connections)
    return this.waterline.initializeAsync({
      adapters: this.config.adapters,
      connections: this.config.connections,
      defaults: this.config.defaults
    }).then((obj) => {
      this.connections = obj.connections;
      this.collections = obj.collections;
    });
  }

  emitModelEvent (action, identity, record) {
    this.app.log.debug('Emitting model event', action, identity)
    this.emit('model.'+action, identity, record)
    this.emit('model.'+action+'.'+identity, identity, record)
  }
  
}
