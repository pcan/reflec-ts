//// [file1.ts]


interface I1 {
    id:number;
    description:string;
}

interface I2 {
    name:string;
    description:string;
}

class MyClass {
	union: I1 | I2;
    intersection: I1 & I2;
    unionAndIntersection: I1 & MyClass | I2;
}





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

    for(var _cnt = 0; _cnt < 7; _cnt++ ) { _l[_cnt] = O_o(); }
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
            'I1': _l[0],
            'I2': _l[1],
            'MyClass': _l[2],
        },
    };
    _t = _l[3];
    _t.kind = 'union';
    _t.types = [_l[0], _l[1], ];
    _t = _l[4];
    _t.kind = 'intersection';
    _t.types = [_l[0], _l[1], ];
    _t = _l[5];
    _t.kind = 'union';
    _t.types = [_l[1], _l[6], ];
    _t = _l[6];
    _t.kind = 'intersection';
    _t.types = [_l[0], _l[2], ];
    _t = _l[0];
    _t.kind = 'interface';
    _t.name = 'I1';
    _t.members = [
        {
            name: 'id',
            type: _type_number,
        },
        {
            name: 'description',
            type: _type_string,
        },
    ];
    _t = _l[1];
    _t.kind = 'interface';
    _t.name = 'I2';
    _t.members = [
        {
            name: 'name',
            type: _type_string,
        },
        {
            name: 'description',
            type: _type_string,
        },
    ];
    _t = _l[2];
    _t.kind = 'class';
    _t.name = 'MyClass';
    _t.members = [
        {
            name: 'union',
            type: _l[3],
        },
        {
            name: 'intersection',
            type: _l[4],
        },
        {
            name: 'unionAndIntersection',
            type: _l[5],
        },
    ];

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
require("./Reflection");
var I2 = Reflection.interfaceForName("file1" + "#I2");
var I1 = Reflection.interfaceForName("file1" + "#I1");
var MyClass = (function () {
    function MyClass() {
    }
    return MyClass;
}());
Reflection.registerClass(MyClass, "file1" + "#MyClass");
