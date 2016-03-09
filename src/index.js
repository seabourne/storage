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

export var HasModels = hasModels
export var Waterline = waterline
export var BaseModel = baseModel
export var GeoModel = geoModel

/**
 * Storage provides a common interface for defining models.  Uses the Waterline ORM.
 */
export default class Storage {
  constructor (app) {
    const _defaultConfig = {
      adapters: {
        'default': "waterline-sqlite3"
      },
      connections: {
        'default': {
          adapter: 'default', // or 'memory' 
        }
      }
    };

    app.writeDefaultConfig('storage', _defaultConfig)

    BaseModel.prototype.storageModule = this
    this.waterline = Promise.promisifyAll(new Waterline());
    this.waterlineConfig = null;
    this.collections = {};
    this.connections = null;
    this.app = app;

    this.config = app.config.storage

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
    if(!this.config.modelsDir) return
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
        var adapter = require(this.config.adapters[key]);
        adapter._name = this.config.adapters[key]
        this.config.adapters[key] = adapter;
      }
    }
  }

  _disconnectDb () {
    var adapters = _.pluck(_.values(this.config.adapters), '_name');
    return Promise.all(_.values(this.config.adapters), (adapter) => {
      return new Promise((resolve) => {
        adapter.teardown(null, resolve);
      });
    }).then(() => {
      return this.waterline.teardownAsync()
    }).then(() => {
      return new Promise((resolve) => {
        // we only want to reload nxus code
        // but we need to always reload mongoose so that models can be rebuilt
        adapters = new RegExp("^.*("+adapters.join("|")+").*")
        _.each(require.cache, (v, k) => {
          if (!adapters.test(k)) return
          delete require.cache[k]
        })
        resolve()
      })
    });
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
    }).catch((e) => {
      this.app.log.warn(e)
    });
  }

  emitModelEvent (action, identity, record) {
    this.app.log.debug('Emitting model event', action, identity)
    this.emit('model.'+action, identity, record)
    this.emit('model.'+action+'.'+identity, identity, record)
  }
  
}
