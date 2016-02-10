# @nxus/storage

[![Build Status](https://travis-ci.org/nxus/storage.svg?branch=master)](https://travis-ci.org/nxus/storage)

A storage framework for Nxus applications using [waterline](https://github.com/balderdashy/waterline).

# Configuration

  ```
  "config": {
    "storage": {
      "adapter": {
        "default": "sails-mongo"
      },
      "connections": {
        "default": {
          "adapter": "default",
          "url": "mongodb://...."
        }
      },
      "modelsDir": "./src/models"
    }
  }

  ```

# Creating models

Inherit your models from BaseModel

```
import {BaseModel} from '@nxus/storage'

var User = BaseModel.extend({
  identity: 'user',
  attributes: {
    name: 'string'
  }
})
```

# Model events

The storage model emits events for create, update, and destroy, you can register a handler for all events:

```
  app.get('storage').on('model.create', (identity, record) => {})
  app.get('storage').on('model.update', (identity, record) => {})
  app.get('storage').on('model.destroy', (identity, record) => {})
```

Or just a specific model identity:

```
  app.get('storage').on('model.create.user', (record) => {})
  app.get('storage').on('model.update.user', (record) => {})
  app.get('storage').on('model.destroy.user', (record) => {})
```


# Lifecycle notes

 * `load`
   * Models should be registered during `load`, e.g.
     ```
     var User = BaseModel.extend({
       identity: 'user',
       ...
     });
     app.get('storage').model(User)
     ```
 * `startup`
   * The configured database is connected during `load.after`
   * You can query models from `startup` and beyond, retrieve the model by the 'identity':
     ```
     app.get('storage').getModel('user').then((User) => {
         User.create(...);
     });
     
     ```
 
