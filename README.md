# @nxus/storage
A storage framework for Nxus applications using [waterline](https://github.com/balderdashy/waterline).

# Configuration

  ```
  "config": {
    "storage": {
      "adapter": "sails-mongo",
      "connectionUri": "mongodb://....",
      "modelsDir": "./src/models"
    }
  }

  ```

# Lifecycle

 * `load`
   * Models should be registered during `load`, e.g.
     ```
     var User = Storage.Waterline.Collection.extend({
       identity: 'user',
       ...
     });
     app.get('storage').send('registerModel').with(User)
     ```
 * `startup`
   * The configured database is connected during `startup.before`
   * You can query models from `startup` and beyond, retrieve the model by the 'identity':
     ```
     app.get('storage').emit('getModel').with('user').then((User) => {
         User.create(...);
     });
     
     ```
 
