(function (root, factory) {
    "use strict";

    if(typeof define === "function" && define.amd){
        define([], function(){
          return (root.myModule = factory());
        });
    }else if(typeof module === "object" && module.exports){
        module.exports = (root.recordsjs = factory());
    }else{
        root.pcapi = factory();
    }
}(this, function(){
"use strict";



}));