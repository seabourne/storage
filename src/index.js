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
 *       application.get('storage').on('model.create', (identity, record) => {})
 *       application.get('storage').on('model.update', (identity, record) => {})
 *       application.get('storage').on('model.destroy', (identity, record) => {})
 * 
 * Or just a specific model identity:
 * 
 *       application.get('storage').on('model.create.user', (identity, record) => {})
 *       application.get('storage').on('model.update.user', (identity, record) => {})
 *       application.get('storage').on('model.destroy.user', (identity, record) => {})
 * 
 * # Lifecycle notes
 * 
 * -   `load`
 *     -   Models should be registered during `load`, e.g.
 *             var User = BaseModel.extend({
 *               identity: 'user',
 *               ...
 *             });
 *             application.get('storage').model(User)
 * -   `startup`
 *     -   The configured database is connected during `load.after`
 *     -   You can query models from `startup` and beyond, retrieve the model by the 'identity':
 * 
 *             application.get('storage').getModel('user').then((User) => {
 *                 User.create(...);
 *             });
 *
 * # API
 * -------
 */

'use strict';

import {application, NxusModule} from 'nxus-core'

import waterline from 'waterline'
import baseModel from './BaseModel'
import Promise from 'bluebird'
import _ from 'underscore'

import path from 'path'
import fs_ from 'fs'
const fs = Promise.promisifyAll(fs_);

export var Waterline = waterline
export var BaseModel = baseModel

const REGEX_FILE = /[^\/\~]$/;
/**
 * Storage provides a common interface for defining models.  Uses the Waterline ORM.
 */
class Storage extends NxusModule {
  
  constructor () {
    super()

    BaseModel.prototype.storageModule = this
    this.waterline = Promise.promisifyAll(new Waterline());
    this.waterlineConfig = null;
    this.collections = {};
    this.connections = null;

    application.once('init', () => {
      return Promise.all([
        this._setupAdapter(),
        this._loadLocalModels()
      ]);
    });

    application.onceAfter('load', () => {
      return this._connectDb();
    });

    application.once('stop', () => {
      return this._disconnectDb();
    })

  }

  _defaultConfig () {
    return {
      adapters: {
        'default': "waterline-sqlite3"
      },
      connections: {
        'default': {
          adapter: 'default', // or 'memory' 
        }
      }
    };
  }

  // Handlers

  /**
   * Provide a model
   * @param {object} model A Waterline-compatible model class
   * @example application.get('storage').model(...)
   */
  
  model (model) {
    this.log.debug('Registering model', model.identity)
    this.waterline.loadCollection(model)
  }

  /**
   * Request a model based on its identity (name)
   * @param {string|array} id The identity of a registered model, or array of identities
   * @return {Promise}  The model class(es)
   * @example application.get('storage').getModel('user')
   */
  
  getModel (id) {
    if (_.isArray(id)) {
      return id.map((i) => { return this.collections[i]})
    }
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
    var adapters = Object.values(this.config.adapters).map(e => e['_name']);
    return Promise.all(Object.values(this.config.adapters), (adapter) => {
      return new Promise((resolve) => {
        adapter.teardown(null, resolve);
      });
    }).then(() => {
      return this.waterline.teardownAsync()
    }).then(() => {
      return new Promise((resolve) => {
        // we only want to reload nxus code
        // but we need to always reload mongoose so that models can be rebuilt
        adapters = new RegExp("^.*("+adapters.join("|")+").*.js")
        _.each(require.cache, (v, k) => {
          if (!adapters.test(k)) return
          delete require.cache[k]
        })
        resolve()
      })
    });
  }
  
  _connectDb () {
    this.log.debug('Connecting to dB', this.config.connections)
    return this.waterline.initializeAsync({
      adapters: this.config.adapters,
      connections: this.config.connections,
      defaults: this.config.defaults
    }).then((obj) => {
      this.connections = obj.connections;
      this.collections = obj.collections;
    }).catch((e) => {
      this.log.error(e)
    });
  }

  emitModelEvent (action, identity, record) {
    this.log.debug('Emitting model event', action, identity)
    this.emit('model.'+action, identity, record)
    this.emit('model.'+action+'.'+identity, identity, record)
  }
}

export default Storage
export let storage = Storage.getProxy()