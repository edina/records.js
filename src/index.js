(function (root, factory) {
    "use strict";

    if(typeof define === 'function' && define.amd){
        define(['assign', 'tv4'], function(assign, tv4){
          return (root.RecordsJS = factory(assign, tv4));
        });
    }else if(typeof module === 'object' && module.exports){
        var assign = Object.assign || require('object.assign');
        var tv4 = require('tv4');

        module.exports = (root.RecordsJS = factory(assign, tv4));
    }else{
        root.RecordsJS = factory(Object.assign, root.tv4);
    }
}(this, function(assign, tv4){
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

/* Schema functions */

RecordsJS.prototype.addSchema = function(schema){
    var internals;

    internals = this.deserialize(this.dataStore);
    internals.schemas[schema.id] = schema;
    this.serialize(this.dataStore, internals);

    // Add to the cache
    tv4.addSchema(assign({}, schema));
};

RecordsJS.prototype.deleteSchema = function(name){
    var internals;

    internals = this.deserialize(this.dataStore);
    delete internals.schemas[name];
    this.serialize(this.dataStore, internals);
    // tv4.dropSchema(uri, schema);
};

RecordsJS.prototype.getSchema = function(uri){
    var internals;

    internals = this.deserialize(this.dataStore);

    return internals.schemas[uri];
};

RecordsJS.prototype.validateSchema = function(uri, object){
    var schema;
    var valid;

    schema = tv4.getSchema(uri);
    valid = tv4.validate(object, schema);

    return valid;
};

/* Record validation against schema */

RecordsJS.prototype.addRecordValidation = function(prefix, schemaName){

};

RecordsJS.prototype.deleteRecordValidation = function(prefix, schemaName){

};

RecordsJS.prototype.getRecordValidation = function(prefix){

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
    //options = extend({}, options);
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