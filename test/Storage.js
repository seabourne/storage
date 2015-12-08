'use strict';

import Storage from '../src/Storage'

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
      app.once.calledWith('load').should.be.true;
      app.once.calledWith('startup.before').should.be.true;
    });

    it("should have config after load", () => {
      return app.emit('load').with().then(() => {
        storage.should.have.property('config');
        storage.config.should.have.property('modelsDir', './src/models');
        storage.config.should.have.property('connections');
      });
    });
  });
  describe("Models", () => {
    beforeEach(() => {
      storage = new Storage(app);
      var Dummy = Storage.Waterline({
        identity: 'dummy'
      });
      app.get('storage').send('registerModel').with(Dummy);
      return app.launch();
    });

    it("should gather models", () => {
      storage.collections.should.not.be.null;
      storage.connections.should.not.be.null;
      storage.collections.should.have.property('dummy');
    });

  });
});
