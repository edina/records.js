(function (root, factory) {
    "use strict";

    if(typeof define === 'function' && define.amd){
        define(['assign', 'jsonschema'], function(assign, jsonschema){
          return (root.RecordsJS = factory(assign, jsonschema.Validator, localStorage));
        });
    }else if(typeof module === 'object' && module.exports){
        var assign = Object.assign || require('object.assign');
        var Validator = require('jsonschema').Validator;
        var storage;

        if (typeof localStorage === 'undefined' || localStorage === null) {
            var LocalStorage = require('node-localstorage').LocalStorage;
            storage = new LocalStorage('./localstorage.db');
        }else{
            storage = localStorage;
        }

        module.exports = (root.RecordsJS = factory(assign, Validator, storage));
    }else{
        root.RecordsJS = factory(Object.assign, root.Validator, localStorage);
    }
}(this, function(assign, Validator, localStorage){
"use strict";

var defaults = {
    dataPrefix: 'recordsjs@',
    nameSeparator: '#'
};

/**
 * Initialize a new storage or load an existing one
 * @param name the name of the storage
 * @param options optional parameter overriding the defaults
 */
var RecordsJS = function (name, options){
    var data;

    this.options = assign(defaults, options);
    this.name = name;
    this.dataStore = this.options.dataPrefix + this.name + this.options.nameSeparator;

    data = this.deserialize(this.dataStore);
    if(data === null){
        this.serialize(this.dataStore, {
            validation: {},
            schemas: {}
        });
    }

    this.loadSchemas();
    this.buildIndex();
};

/* Adapter methods for localstorage */

/**
 * Serialize an object into the storage
 * @param id of the object
 * @param data the object to store
 * @returns boolean if the operation succeded
 */
RecordsJS.prototype.serialize = function(id, data){
    var dataStr;

    try{
        dataStr = JSON.stringify(data);
        localStorage.setItem(id, dataStr);
        return true;
    }catch(ex){
        console.error(ex);
        return false;
    }
};

/**
 * Deserialize an object into the storage
 * @param id of the object
 * @returns the object stored or null id is not found
 */
RecordsJS.prototype.deserialize = function(id){
    var data, dataStr;

    dataStr = localStorage.getItem(id);

    if(dataStr !== null){
        try{
            data = JSON.parse(dataStr);
            return data;
        }catch(ex){
            console.error(ex);
            return null;
        }
    }else{
        return null;
    }
};

/**
 * Delete an item from the storage
 * @param id of the object
 */
RecordsJS.prototype.deleteFromStorage = function(id){
    localStorage.removeItem(id);
};

/* Index methods */


/**
 * Builds tne internal id for given id
 * @param id
 * @returns the internal id
 */
RecordsJS.prototype.buildInternalId = function(id){
    return this.dataStore + id;
};

/**
 * Maps keys with internal keys in the index
 * @param key
 * @param internalKey
 */
RecordsJS.prototype.addToIndex = function(key, internalKey){
    this.index[key] = internalKey;
};

/**
 * Maps keys with internal keys in the index
 * @param key
 */
RecordsJS.prototype.deleteFromIndex = function(key){
    delete this.index[key];
};

/**
 * Builds an index searching all the objects in the datastore namespace
 */
RecordsJS.prototype.buildIndex = function(){
    var regex, key, matches;

    regex = new RegExp('^' + this.dataStore + '(.+)$');

    this.index = {};
    for(var i=0, len=localStorage.length; i<len; i++){
        key = localStorage.key(i);

        matches = key.match(regex);
        if(matches !== null){
            this.addToIndex(matches[1], key);
        }
    }
};

/* Schema functions */

/**
 * Add schema
 * @param uri
 * @param schema
 */
RecordsJS.prototype._addSchema = function(uri, schema){
    this.schemas[uri] = new Validator();
    this.schemas[uri].addSchema(schema);
};

/**
 * Add schema dependency
 * @param uri
 * @param dependency
 */
RecordsJS.prototype._addSchemaDependency = function(uri, dependency){
    this.schemas[uri].addSchema(dependency);
};

/**
 * Load the existing schemas in the datastore into the validator
 */
RecordsJS.prototype.loadSchemas = function(){
    var dependency;
    var internals;
    var schemas;
    var schema;

    this.schemas = {};

    internals = this.deserialize(this.dataStore);
    schemas = internals.schemas;

    if(schemas !== null){
        for(var uri in schemas){
            if(schemas.hasOwnProperty(key)){
                schema = schemas[uri];
                this._addSchema(uri, schema.schema);

                for(var key in schema.dependencies){
                    dependency = schema.dependencies[key];
                    this._addSchemaDependency(uri, dependency);
                }
            }
        }
    }
};


/**
 * Creates a new schema
 * @param schema a json schema identified for schema.id
 */
RecordsJS.prototype.createSchema = function(schema){
    var internals;
    var schemaObj = {
        schema: schema,
        dependencies: []
    };

    // Save the schema
    internals = this.deserialize(this.dataStore);
    internals.schemas[schema.id] = schemaObj;
    this.serialize(this.dataStore, internals);

    // Add to the cache
    this._addSchema(schema.id, schema);
};

/**
 * Add a schema dependency to an existing schema
 * @param uri the id of the existing schema
 * @param schema a json schema identified for schema.id
 */
RecordsJS.prototype.addSchemaDependency = function(uri, schema){
    var internals;

    internals = this.deserialize(this.dataStore);
    internals.schemas[schema.id] = schema;
    this.serialize(this.dataStore, internals);

    this._addSchemaDependency(uri, schema);
};

/**
 * Delete a schema and its dependencies
 * @param uri the schema id
 */
RecordsJS.prototype.deleteSchema = function(uri){
    var internals;

    internals = this.deserialize(this.dataStore);
    delete internals.schemas[uri];
    this.serialize(this.dataStore, internals);

    delete this.schemas[uri];
};

/**
 * Get a schema
 * @param uri the id of the schema
 * @returns the schema or undefined if not found
 */
RecordsJS.prototype.getSchema = function(uri){
    var internals;
    var internalSchema;
    var schema;

    internals = this.deserialize(this.dataStore);

    internalSchema = internals.schemas[uri];
    if(internalSchema !== undefined){
        schema = internalSchema.schema;
    }

    return schema;
};

/**
 * Validate an object against and stored schema
 * @param uri the if of the schema
 * @param object an object to validate
 * @returns true/false if the object is valid
 */
RecordsJS.prototype.validateSchema = function(uri, object){
    var schema;
    var valid;

    schema = this.schemas[uri];

    valid = schema.validate(object, schema.getSchema(uri));

    return valid.errors.length === 0;
};

/* API methods */

/**
 * Put an object into the storage
 * @param id for storing the object
 * @param object to store
 * @param options.metadata true/false if the object is wrapped in its metadata
 * @returns a boolean with the result of the operation
 */
RecordsJS.prototype.put = function(id, object, options){
    var annotation, internalId, result;

    options = assign({}, options);
    internalId = this.buildInternalId(id);

    if(options.metadata !== true){
        annotation = {};
        annotation._id = id;
        annotation.record = object;
    }else{
        annotation = object;
        annotation._id = id;
    }

    result = this.serialize(internalId, annotation);

    if(result === true){
        this.addToIndex(id, internalId);
    }

    return result;
};

/**
 * Put an array of objects into the storage
 * @param objects and array of objects in the form of {key: 'objectId', value: object}
 * @param options.metadata true/false if the object is wrapped in its metadata
 * @returns an array of booleans if the operation was completed
 */
RecordsJS.prototype.putAll = function(objects, options){
    var result, results;

    results = [];
    for(var i=0, len = objects.length; i<len; i++){
        result = this.put(objects[i].key, objects[i].value, options);
        results.push(result);
    }
    return results;
};

/**
 * Get a stored object
 * @param id the id of the object
 * @param options.metadata true/false if the object should be returned in its metadata
 * @returns an object or null if doesn't exist
 */
RecordsJS.prototype.get = function(id, options){
    var annotation, internalId;

    options = assign({}, options);
    internalId = this.buildInternalId(id);

    annotation = this.deserialize(internalId);

    if(options.metadata === true || annotation === null){
        return annotation;
    }else{
        return annotation.record;
    }
};

/**
 * Get all the objects stored
 * @param options.metadata true/false if the object should be returned in its metadata
 * @returns an array of objects
 */
RecordsJS.prototype.getAll = function(options){
    var items, annotation, regex, matches, item;

    options = assign({}, options);

    items = [];
    for(var key in this.index){
        if(this.index.hasOwnProperty(key)){
            annotation = this.deserialize(this.index[key]);
            if(options.metadata === true){
                item = annotation;
            }else{
                item = annotation.record;
            }

            items.push(item);
        }
    }

    return items;
};

/**
 * Delete a stored object
 * @param id of the object
 */
RecordsJS.prototype.delete = function(id){
    var internalId;

    internalId = this.buildInternalId(id);
    this.deleteFromStorage(internalId);
    this.deleteFromIndex(id);
};

/**
 * Delete all stored object
 */
RecordsJS.prototype.deleteAll = function(){
    for(var key in this.index){
        this.delete(key);
    }
};

return RecordsJS;

}));