'use strict';

import Storage from '../src/Storage';

import TestApp from '@nxus/core/lib/test/support/TestApp';

describe("Storage", () => {
  var storage;
  var app = new TestApp();

  beforeEach(() => {
    app = new TestApp();
  });
  
  describe("Load", () => {
    it("should not be null", () => Storage.should.not.be.null)

    it("should be instantiated", () => {
      storage = new Storage(app);
      storage.should.not.be.null;
    });
  });
});
