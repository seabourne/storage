# @nxus/storage

## 

[![Build Status](https://travis-ci.org/nxus/storage.svg?branch=master)](https://travis-ci.org/nxus/storage)

A storage framework for Nxus applications using [waterline](https://github.com/balderdashy/waterline).

## Configuration

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

## Creating models

Inherit your models from BaseModel

    import {BaseModel} from '@nxus/storage'

    var User = BaseModel.extend({
      identity: 'user',
      attributes: {
        name: 'string'
      }
    })

## Model events

The storage model emits events for create, update, and destroy, you can register a handler for all events:

      app.get('storage').on('model.create', (identity, record) => {})
      app.get('storage').on('model.update', (identity, record) => {})
      app.get('storage').on('model.destroy', (identity, record) => {})

Or just a specific model identity:

      app.get('storage').on('model.create.user', (identity, record) => {})
      app.get('storage').on('model.update.user', (identity, record) => {})
      app.get('storage').on('model.destroy.user', (identity, record) => {})

## Lifecycle notes

-   `load`
    -   Models should be registered during `load`, e.g.
            var User = BaseModel.extend({
              identity: 'user',
              ...
            });
            app.get('storage').model(User)
-   `startup`

    -   The configured database is connected during `load.after`
    -   You can query models from `startup` and beyond, retrieve the model by the 'identity':

            app.get('storage').getModel('user').then((User) => {
                User.create(...);
            });

## API

* * *

## Storage

Storage provides a common interface for defining models.  Uses the Waterline ORM.

### getModel

Request a model based on its identity (name)

**Parameters**

-   `id` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The identity of a registered model

**Examples**

```javascript
app.get('storage').getModel('user')
```

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** The model class

### model

Provide a model

**Parameters**

-   `model` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** A Waterline-compatible model class

**Examples**

```javascript
app.get('storage').model(...)
```

## HasModels

The HasModels class is a Base class for defining helper classes with Models.

### modelNames

Override to define the model names to access

**Examples**

```javascript
model_names() { 
return {'user': 'User'}
}
```

Returns **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** (model identifier: class attribute) pairs
