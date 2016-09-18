(function () {
    var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;
    var freeSelf = typeof self == 'object' && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function('return this')();
    var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;
    var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var freeProcess = moduleExports && freeGlobal.process;
    var metadataField = (typeof Symbol === 'function') ? Symbol('metadata') : '__reflectionData__';
    var KindEnum = {
        Any: 'any',
        String: 'string',
        Number: 'number',
        Boolean: 'boolean',
        Symbol: 'symbol',
        Void: 'void',
        Undefined: 'undefined',
        Null: 'null',
        Never: 'never',
        This: 'this',
        Class: 'class',
        Interface: 'interface'
    };
    ;
    var TypeImpl = (function () {
        function TypeImpl(kind) {
            this.kind = kind;
        }
        return TypeImpl;
    }());
    var Reflection = (function () {
        function Reflection() {
            this.$libs = {};
            this.Any = new TypeImpl(KindEnum.Any);
            this.String = new TypeImpl(KindEnum.String);
            this.Number = new TypeImpl(KindEnum.Number);
            this.Boolean = new TypeImpl(KindEnum.Boolean);
            this.Symbol = new TypeImpl(KindEnum.Symbol);
            this.Void = new TypeImpl(KindEnum.Void);
            this.Undefined = new TypeImpl(KindEnum.Undefined);
            this.Null = new TypeImpl(KindEnum.Null);
            this.Never = new TypeImpl(KindEnum.Never);
            this.This = new TypeImpl(KindEnum.This);
            Object.freeze(this);
        }
        Reflection.prototype.registerClass = function (ctor, fullyQualifiedName) {
            var typeMetadata = this.__getTypeMetadata(KindEnum.Class, fullyQualifiedName);
            ctor.prototype[metadataField] = typeMetadata;
            typeMetadata.getConstructor = function () { return ctor; };
        };
        Reflection.prototype.RegisterClass = function (name) {
            return function (ctor) {
                this.registerClass(ctor, name);
                return ctor;
            };
        };
        ;
        Reflection.prototype.classForConstructor = function (ctor) {
            return ctor.prototype[metadataField];
        };
        ;
        Reflection.prototype.classForName = function (pkg, name) {
            var typeMetadata = this.__getTypeMetadata(KindEnum.Class, pkg, name);
            if (!typeMetadata.getConstructor) {
                throw new Error('Dynamic class loading not implemented yet: ' + typeMetadata && typeMetadata.name);
            }
            return typeMetadata;
        };
        Reflection.prototype.interfaceForName = function (pkg, name) {
            var typeMetadata = this.__getTypeMetadata(KindEnum.Interface, pkg, name);
            return typeMetadata;
        };
        Reflection.prototype.__getTypeMetadata = function (kind, pkgName, typeName) {
            var fqn = typeName ? [pkgName, typeName] : pkgName.split('#');
            var pkg = this.$libs['default'];
            var type = pkg && pkg[fqn[0]][fqn[1]];
            if (!type || type.kind !== kind) {
                throw new Error('Metadata not found for type: ' + typeName);
            }
            return type;
        };
        Reflection.prototype._cls = function () {
            return new TypeImpl(KindEnum.Class);
        };
        ;
        Reflection.prototype._int = function () {
            return new TypeImpl(KindEnum.Interface);
        };
        ;
        Reflection.prototype._type = function (kind) {
            return new TypeImpl(kind);
        };
        return Reflection;
    }());
    var reflection = root.Reflection = (root.Reflection || new Reflection());
    Function.prototype.getClass = Function.prototype.getClass || function () {
        return reflection.classForConstructor(this);
    };
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        root.Reflection = reflection;
        define(function () {
            return reflection;
        });
    }
    else if (freeModule) {
        (freeModule.exports = reflection).Reflection = reflection;
        freeExports.Reflection = reflection;
    }
}.call(this));
