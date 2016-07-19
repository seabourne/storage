import {HasModels} from '../src'

import TestApp from 'nxus-core/lib/test/support/TestApp';

describe("HasModels", () => {
  class MyModule extends HasModels {
    modelNames() {
      return ['user']
    }
  }
  class MyModuleRename extends HasModels {
    modelNames() {
      return {'user': 'User'}
    }
  }
  var module
  var app = new TestApp();
 
  beforeEach(() => {
    app = new TestApp();
  });
  
  it("should request models", () => {
    module = new MyModule(app)
    app.on.calledWith('startup').should.be.true;
    app.emit('startup').then(() => {
      app.get.calledWith('storage').should.be.true;
      app.get().provide.calledWith('getModel', 'user').should.be.true;
    })
  });
  it("should request models from object", () => {
    module = new MyModuleRename(app)
    app.on.calledWith('startup').should.be.true;
    app.emit('startup').then(() => {
      app.get.calledWith('storage').should.be.true;
      app.get().provide.calledWith('getModel', 'user').should.be.true;
    })
  });
})
