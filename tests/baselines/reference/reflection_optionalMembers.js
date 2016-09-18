//// [file1.ts]


interface MyInterface {
    a:string,
    b?:number,
    c?:MyInterface;
    d:MyInterface;
    e?();
    f();
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
            'MyInterface': _l[0],
        },
    };
    _t = _l[0];
    _t.kind = 'interface';
    _t.name = 'MyInterface';
    _t.members = [
        {
            name: 'a',
            type: _type_string,
        },
        {
            name: 'b',
            type: _type_number,
            optional: true,
        },
        {
            name: 'c',
            type: _l[0],
            optional: true,
        },
        {
            name: 'd',
            type: _l[0],
        },
        {
            name: 'e',
            type: {
                kind: 'function',
                name: 'e', 
                signatures: [
                    {
                        length: 0,
                        parameters: [],
                        returns: _type_any, 
                    },
                ]
            },
            optional: true,
        },
        {
            name: 'f',
            type: {
                kind: 'function',
                name: 'f', 
                signatures: [
                    {
                        length: 0,
                        parameters: [],
                        returns: _type_any, 
                    },
                ]
            },
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
const MyInterface = Reflection.interfaceForName("file1" + "#MyInterface");
