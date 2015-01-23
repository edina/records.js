(function (root, factory) {
    "use strict";

    if(typeof define === 'function' && define.amd){
        define(['assign', 'jsonschema'], function(assign, jsonschema){
          return (root.RecordsJS = factory(assign, jsonschema.Validator));
        });
    }else if(typeof module === 'object' && module.exports){
        var assign = Object.assign || require('object.assign');
        var Validator = require('jsonschema').Validator;

        module.exports = (root.RecordsJS = factory(assign, Validator));
    }else{
        root.RecordsJS = factory(Object.assign, root.Validator);
    }
}(this, function(assign, Validator){
"use strict";

if (typeof localStorage === 'undefined' || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    var localStorage = new LocalStorage('./localstorage.db');
}

var defaults = {
    dataPrefix: 'recordsjs@',
    nameSeparator: '#'
};

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

RecordsJS.prototype.deleteFromStorage = function(id){
    localStorage.removeItem(id);
};

/* Index methods */

RecordsJS.prototype.buildInternalId = function(id){
    return this.dataStore + id;
};

RecordsJS.prototype.addToIndex = function(key, internalKey){
    this.index[key] = internalKey;
};

RecordsJS.prototype.deleteFromIndex = function(key){
    delete this.index[key];
};

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

RecordsJS.prototype._addSchema = function(uri, schema){
    this.schemas[uri] = new Validator();
    this.schemas[uri].addSchema(schema);
};

RecordsJS.prototype._addSchemaDependency = function(uri, dependency){
    this.schemas[uri].addSchema(dependency);
};

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

/* Schema functions */

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

RecordsJS.prototype.addSchemaDependency = function(uri, schema){
    var internals;

    internals = this.deserialize(this.dataStore);
    internals.schemas[schema.id] = schema;
    this.serialize(this.dataStore, internals);

    this._addSchemaDependency(uri, schema);
};

RecordsJS.prototype.deleteSchema = function(uri){
    var internals;

    internals = this.deserialize(this.dataStore);
    delete internals.schemas[uri];
    this.serialize(this.dataStore, internals);

    delete this.schemas[uri];
};

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

RecordsJS.prototype.validateSchema = function(uri, object){
    var schema;
    var valid;

    schema = this.schemas[uri];

    valid = schema.validate(object, schema.getSchema(uri));

    return valid.errors.length === 0;
};

/* API methods */

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

RecordsJS.prototype.putAll = function(objects, options){
    var result, results;

    results = [];
    for(var i=0, len = objects.length; i<len; i++){
        result = this.put(objects[i].key, objects[i].value, options);
        results.push(result);
    }
    return results;
};

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

RecordsJS.prototype.delete = function(id){
    var internalId;

    internalId = this.buildInternalId(id);
    this.deleteFromStorage(internalId);
    this.deleteFromIndex(id);
};

RecordsJS.prototype.deleteAll = function(){
    for(var key in this.index){
        this.delete(key);
    }
};

return RecordsJS;

}));