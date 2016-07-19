'use strict';

import Storage from '../src'
import {Waterline, HasModels, BaseModel, GeoModel} from '../src'

import TestApp from 'nxus-core/lib/test/support/TestApp';

import One from './models/One'
import Two from './models/Two'

describe("Storage", () => {
  var storage;
  var app = new TestApp();
 
  beforeEach(() => {
    app = new TestApp();
    app.config.storage = {
      adapters: {
        "default": "sails-memory"
      },
      modelsDir: './src/models',
      connections: {
        'default': {
          adapter: 'default'
        }
      }
    }
  });
  
  describe("Load", () => {
    it("should not be null", () => Storage.should.not.be.null)
    it("should provide waterline", () => Waterline.should.not.be.null)
    it("should provide HasModels", () => HasModels.should.not.be.null)
    it("should provide BaseModel", () => BaseModel.should.not.be.null)
    it("should provide GeoModel", () => GeoModel.should.not.be.null)

    it("should be instantiated", () => {
      storage = new Storage(app);
      storage.should.not.be.null;
      BaseModel.prototype.storageModule.should.not.be.null
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
      var Dummy = BaseModel.extend({
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

    afterEach(() => {
      return storage._disconnectDb()
    })

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
        adapters: {
          "default": "sails-memory"
        },
        modelsDir: './test/models',
        connections: {
          'default': {
            adapter: 'default'
          }
        }
      }
      storage = new Storage(app);
      return app.launch();
    });

    afterEach(() => {
      return storage._disconnectDb()
    })
    
    it("should register local models", () => {
      app.get().provide.calledTwice.should.be.true;
      app.get().provide.calledWith('model').should.be.true;
    });
  });
  
  describe("Dynamic Adapter", () => {
    beforeEach(() => {
      app.config.storage = {
        adapters: {
          "default": "sails-memory"
        },
        connections: {
          'default': {
            adapter: 'default'
          }
        }
      }
      storage = new Storage(app);
      return app.launch();
    });

    afterEach(() => {
      return storage._disconnectDb()
    })

    it("should have required the adapter", (done) => {
      storage.config.adapters["default"].should.have.property("identity", "sails-memory");
      done()
    });
  });

  describe("Model Base class", () => {
    beforeEach(() => {
      app.config.storage = {
        adapters: {
          "default": "sails-memory"
        },
        modelsDir: './test/models',
        connections: {
          'default': {
            adapter: 'default'
          }
        }
      }
      storage = new Storage(app);
      storage._setupAdapter()
      storage.model(One)
      storage.model(Two)
      return storage._connectDb()
    });

    afterEach(() => {
      return storage._disconnectDb()
    })
    it("should return models with correct methods inherited", () => {
      var one = storage.getModel('one')
      var two = storage.getModel('two')

      one.should.have.property("createOrUpdate")
      two.should.have.property("createOrUpdate")
      two.should.have.property("helperMethod")
      two.helperMethod("xx").should.equal("xx")
      two.attributes.should.have.property('name')
      two.attributes.should.have.property('other')
    })
    it("should have a displayName", () => {
      var one = storage.getModel('one')
      return one.create({color: 'red'}).then((obj) => {
        app.get('storage').emit.calledWith('model.create').should.be.true
        app.get('storage').emit.calledWith('model.create.one').should.be.true
        obj.displayName().should.equal('red')
      })
    })
    it("should emit CRUD events", () => {
      var one = storage.getModel('one')
      return one.create({color: 'red'}).then((obj) => {
        app.get('storage').emit.calledWith('model.create').should.be.true
        app.get('storage').emit.calledWith('model.create.one').should.be.true
        obj.color = 'blue'
        return obj.save()
          .then(() => obj) // save doesn't return object as of waterline 0.11.0
      }).then((obj) => {
console.log("****** obj", obj)
        app.get('storage').emit.calledWith('model.update').should.be.true
        app.get('storage').emit.calledWith('model.update.one').should.be.true
        return obj.destroy()
      }).then(() => {
        app.get('storage').emit.calledWith('model.destroy').should.be.true
        app.get('storage').emit.calledWith('model.destroy.one').should.be.true
      })

    })
  });
  describe("Model Geo class", () => {
    beforeEach(() => {
      app.config.storage = {
        adapters: {
          "default": "sails-memory"
        },
        connections: {
          'default': {
            adapter: 'default'
          }
        }
      }
      var Geo = GeoModel.extend({
        identity: 'geo',
        attributes: {
          'geo': 'json',
          'geo_features': 'array',
        }
      })
      storage = new Storage(app);
      storage._setupAdapter()
      storage.model(Geo)
      return storage._connectDb()
    });

    afterEach(() => {
      return storage._disconnectDb()
    })
    it("should return models with correct methods inherited", () => {
      var geo = storage.getModel('geo')
      geo.should.have.property('createGeoIndex')
      geo.should.have.property('findWithin')
      geo.should.have.property('findIntersects')
    })
    it("should emit CRUD events", () => {
      var geo = storage.getModel('geo')
      return geo.create({geo: {features: []}}).then((obj) => {
        app.get('storage').emit.calledWith('model.create').should.be.true
        app.get('storage').emit.calledWith('model.create.geo').should.be.true
        obj.geo = {}
        return obj.save()
          .then(() => obj) // save doesn't return object as of waterline 0.11.0
      }).then((obj) => {
        app.get('storage').emit.calledWith('model.update').should.be.true
        app.get('storage').emit.calledWith('model.update.geo').should.be.true
        return obj.destroy()
      }).then(() => {
        app.get('storage').emit.calledWith('model.destroy').should.be.true
        app.get('storage').emit.calledWith('model.destroy.geo').should.be.true
      })

    })
  });
});
