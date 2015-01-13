(function (root, factory) {
    "use strict";

    if(typeof define === "function" && define.amd){
        define([], function(){
          return (root.myModule = factory());
        });
    }else if(typeof module === "object" && module.exports){
        module.exports = (root.RecordsJS = factory());
    }else{
        root.pcapi = factory();
    }
}(this, function(){
"use strict";


var RecordsJS = function (){

};

RecordsJS.prototype.put = function(){

};

RecordsJS.prototype.putAll = function(){

};

RecordsJS.prototype.get = function(){

};

RecordsJS.prototype.getAll = function(){

};


return new RecordsJS();

}));