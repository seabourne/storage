# nxus-storage

## 

## Storage Module

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

## Register models

Either import your model class and pass it to `model()`:

    storage.model(modelClass)

Or register all models in a directory with `modelDir()`:

    storage.modelDir(__dirname+"/models")

## Model events

The storage model emits events for create, update, and destroy, you can register a handler for all events:

      storage.on('model.create', (identity, record) => {})
      storage.on('model.update', (identity, record) => {})
      storage.on('model.destroy', (identity, record) => {})

Or just a specific model identity:

      storage.on('model.create.user', (identity, record) => {})
      storage.on('model.update.user', (identity, record) => {})
      storage.on('model.destroy.user', (identity, record) => {})

## Lifecycle notes

-   `load`
    -   Models should be registered during `load`, e.g.
            var User = BaseModel.extend({
              identity: 'user',
              ...
            });
            application.get('storage').model(User)
-   `startup`

    -   The configured database is connected during `load.after`
    -   You can query models from `startup` and beyond, retrieve the model by the 'identity':

            application.get('storage').getModel('user').then((User) => {
                User.create(...);
            });

## API

* * *

## Storage

**Extends NxusModule**

Storage provides a common interface for defining models.  Uses the Waterline ORM.

### model

Register a model

**Parameters**

-   `model` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** A Waterline-compatible model class

**Examples**

```javascript
storage.model(...)
```

### getModel

Request a model based on its identity (name)

**Parameters**

-   `id` **([string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array))** The identity of a registered model, or array of identities

**Examples**

```javascript
storage.getModel('user')
```

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** The model class(es)

### modelDir

Register all models in a directory

**Parameters**

-   `dir` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Directory containing model files

**Examples**

```javascript
application.get('storage').model(...)
```

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Array of model identities

## HasModels

**Extends NxusModule**

The HasModels class is a Base class for defining helper classes with Models.
All models contained in a `./models` directory will be registered automatically, and are the
default list of model identities made available in the `this.models` object.
You may override or extend this list of model identities, or a mapping of model identities to variable names,
by overriding `.modelNames()`

### modelNames

Deprecated: Override to define the model names to access

**Examples**

```javascript
modelNames() { 
  return ['user']
}
```

Returns **([array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) \| [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object))** Model identities to add to this.models, or object of {identity: name}
