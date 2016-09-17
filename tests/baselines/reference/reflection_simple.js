//// [file1.ts]



class Pippo {
	
}

let a = Pippo.getClass().name;



//// [Reflection.js]
;(function(globalObj, undefined) {

    var freeExports = typeof exports == 'object' && exports;
    var freeModule = typeof module == 'object' && module && module.exports == freeExports && module;

    /** Detect free variable 'global' and use it as 'globalObj' */
    var freeGlobal = typeof global == 'object' && global;
    if (freeGlobal) {
        globalObj = freeGlobal;
    }
    var metadataField = (typeof Symbol === 'function') ? Symbol('metadata') : '__reflectionData__';
    function O_o(){return Object.create(null);} //lol

    var Reflection = globalObj.Reflection || { $libs:  O_o() };
    
    var _t, _l = [];

    for(var _cnt = 0; _cnt < 1; _cnt++ ) { _l[_cnt] = O_o(); }
    var _type_any = {kind: 'any'};
    var _type_string = {kind: 'string'};
    var _type_number = {kind: 'number'};
    var _type_boolean = {kind: 'boolean'};
    var _type_symbol = {kind: 'symbol'};
    var _type_void = {kind: 'void'};
    var _type_undefined = {kind: 'undefined'};
    var _type_null = {kind: 'null'};
    var _type_never = {kind: 'never'};
    var _type_this = {kind: 'this'};
    Reflection.$libs['default'] = {
        'file1' : {
            'Pippo': _l[0],
        },
    };
    _t = _l[0];
    _t.kind = 'class';
    _t.name = 'Pippo';

    Reflection.registerPackage = function(name) {
        //console.log('Registering package: ' + name);
        var pkg = Reflection.$libs['default'][name];
        pkg.registerClass = function(ctor, metadata) {
            //console.log('Registering constructor: ' + ctor.name);
            ctor.prototype[metadataField] = metadata;
            metadata.getConstructor = function(){ return ctor; };
        };
        //decorator:
        pkg.RegisterClass  = function(metadata) {
            return function(ctor) {
                //console.log('Invoking RegisterClass decorator for: ' + ctor.name);
                pkg.registerClass(ctor, metadata);
                return ctor;
            };
        };
        return pkg;
    };
    Reflection.interfaceForName = function(pkg, name) {
        var fqn = name ? [pkg, name] : pkg.split('#');
        var type = Reflection.$libs['default'][fqn[0]][fqn[1]];
        if(!type || type.kind !== 'interface') {
            throw new Error('Interface not found: '+ name);
        }
        return type;
    };
    Reflection.registerClass = function(ctor, name) {
        var metadata = Reflection.classForName(name);
        ctor.prototype[metadataField] = metadata;
        metadata.getConstructor = function(){ return ctor; };
    };
    Reflection.RegisterClass  = function(name) {
        return function(ctor) {
            //console.log('Invoking RegisterClass decorator for: ' + ctor.name);
            Reflection.registerClass(ctor, name);
            return ctor;
        };
    };

    Reflection.classForName = function(pkg, name) {
        var fqn = name ? [pkg, name] : pkg.split('#');
        var type = Reflection.$libs['default'][fqn[0]][fqn[1]];
        if(!type || type.kind !== 'class') {
            throw new Error('Class not found: '+ name);
        }
        return type;
    };
    Reflection.classForConstructor = function(ctor) {
        return ctor.prototype[metadataField];
    };
    Function.prototype.getClass = function() {
        return Reflection.classForConstructor(this);
    };

    globalObj.Reflection = Reflection;
    
}(this));

//// [file1.js]
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
require("./Reflection");
var Pippo = (function () {
    function Pippo() {
    }
    return Pippo;
}());
Pippo = __decorate([
    Reflection.RegisterClass("file1" + "#Pippo")
], Pippo);
var a = Pippo.getClass().name;
