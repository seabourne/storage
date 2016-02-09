'use strict';

import Storage from '../src'

import TestApp from '@nxus/core/lib/test/support/TestApp';

describe("Storage", () => {
  var storage;
  var app = new TestApp();
 
  beforeEach(() => {
    app = new TestApp();
  });
  
  describe("Load", () => {
    it("should not be null", () => Storage.should.not.be.null)
    it("should provide waterline", () => Storage.Waterline.should.not.be.null)
    it("should provide HasModels", () => Storage.HasModels.should.not.be.null)

    it("should be instantiated", () => {
      storage = new Storage(app);
      storage.should.not.be.null;
    });
  });
  describe("Init", () => {
    beforeEach(() => {
      storage = new Storage(app);
    });

    it("should register for app lifecycle", () => {
      app.once.called.should.be.true;
      app.onceAfter.calledWith('load').should.be.true;
      app.once.calledWith('init').should.be.true;
      app.once.calledWith('stop').should.be.true;
    });

    it("should have config after load", () => {
      return app.emit('load').then(() => {
        storage.should.have.property('config');
        storage.config.should.have.property('modelsDir', './src/models');
        storage.config.should.have.property('connections');
      });
    });
    it("should register a gather for models", () => {
      return app.emit('load').then(() => {
        app.get.calledWith('storage').should.be.true;
        app.get().gather.calledWith('model').should.be.true;
      });
    })
    it("should register a handler for getModel", () => {
      return app.emit('load').then(() => {
        app.get().respond.calledWith('getModel').should.be.true;
      });
    })
  });
  describe("Models", () => {
    beforeEach(() => {
      
      storage = new Storage(app);
      var Dummy = Storage.Waterline.Collection.extend({
        identity: 'dummy',
        connection: 'default',
        attributes: {
          name: 'string'
        }
      });
      // Shortcut around gather stub
      storage.model(Dummy)
      return app.launch();
    });

    it("should have a collection of models", () => {
      storage.collections.should.not.be.null;
      storage.connections.should.not.be.null;
      storage.collections.should.have.property('dummy');
    });
    it("should return model by identity", () => {
      var dummy = storage.getModel('dummy');
      dummy.should.exist;
      dummy.identity.should.equal('dummy');
    });

  });
  describe("Local Models", () => {
    beforeEach(() => {
      app.config.storage = {
        modelsDir: './test/models'
      }
      storage = new Storage(app);
      return app.launch();
    });

    it("should register local models", () => {
      app.get().provide.calledOnce.should.be.true;
      app.get().provide.calledWith('model').should.be.true;
    });
  });
  describe("Dynamic Adapter", () => {
    beforeEach(() => {
      app.config.storage = {
        adapters: {
          "default": "sails-memory"
        }
      }
      storage = new Storage(app);
      return app.launch();
    });

    it("should have required the adapter", () => {
      storage.config.adapters["default"].should.have.property("identity", "sails-memory");
    });
  });
});
