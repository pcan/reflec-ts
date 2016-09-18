declare const exports: any, module: any, global: any, Symbol: any, define: any;
(function() {

    /**   Built-in method references without a dependency on `root`. */
    /** Detect free variable `global` from Node.js. */
    const freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

    /** Detect free variable `self`. */
    const freeSelf = typeof self == 'object' && self && (<any>self).Object === Object && self;

    /** Used as a reference to the global object. */
    const root = freeGlobal || freeSelf || Function('return this')();

    /** Detect free variable `exports`. */
    const freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    const freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports`. */
    const moduleExports = freeModule && freeModule.exports === freeExports;

    /** Detect free variable `process` from Node.js. */
    const freeProcess = moduleExports && freeGlobal.process;

    const metadataField = (typeof Symbol === 'function') ? Symbol('metadata') : '__reflectionData__';

    const KindEnum = {
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
        Interface: 'interface',
    };

    interface ReflectionLibrary {
        [index: string]: any
    };

    class TypeImpl implements Type {
        constructor(public kind: string) { }
    }

    class Reflection {

        $libs: ReflectionLibrary = {};

        Any: IntrinsicType = new TypeImpl(KindEnum.Any);
        String: IntrinsicType = new TypeImpl(KindEnum.String);
        Number: IntrinsicType = new TypeImpl(KindEnum.Number);
        Boolean: IntrinsicType = new TypeImpl(KindEnum.Boolean);
        Symbol: IntrinsicType = new TypeImpl(KindEnum.Symbol);
        Void: IntrinsicType = new TypeImpl(KindEnum.Void);
        Undefined: IntrinsicType = new TypeImpl(KindEnum.Undefined);
        Null: IntrinsicType = new TypeImpl(KindEnum.Null);
        Never: IntrinsicType = new TypeImpl(KindEnum.Never);
        This: IntrinsicType = new TypeImpl(KindEnum.This);

        constructor() {
            Object.freeze(this);
        }

        registerClass(ctor: Function, fullyQualifiedName: string): void {
            const typeMetadata = this.__getTypeMetadata(KindEnum.Class, fullyQualifiedName);
            ctor.prototype[metadataField] = typeMetadata;
            typeMetadata.getConstructor = function() { return ctor; };
        }

        RegisterClass(name: string) {
            return function(ctor: any) {
                this.registerClass(ctor, name);
                return ctor;
            };
        };

        classForConstructor(ctor: Function) {
            return ctor.prototype[metadataField];
        };

        classForName(pkg: string, name?: string): any {
            const typeMetadata = this.__getTypeMetadata(KindEnum.Class, pkg, name);
            if(!typeMetadata.getConstructor) {
                throw new Error('Dynamic class loading not implemented yet: ' + typeMetadata && typeMetadata.name);
            }
            return typeMetadata;
        }

        interfaceForName(pkg: string, name?: string): any {
            const typeMetadata = this.__getTypeMetadata(KindEnum.Interface, pkg, name);
            return typeMetadata;
        }

        protected __getTypeMetadata(kind: string, pkgName: string, typeName?: string): any {
            const fqn = typeName ? [pkgName, typeName] : pkgName.split('#');
            const pkg = this.$libs['default']; //todo: library management
            const type = pkg && pkg[fqn[0]][fqn[1]];
            if (!type || type.kind !== kind) {
                throw new Error('Metadata not found for type: ' + typeName);
            }
            return type;
        }

        protected _cls() {
            return new TypeImpl(KindEnum.Class);
        };

        protected _int() {
            return new TypeImpl(KindEnum.Interface);
        };

        protected _type(kind: string) {
            return new TypeImpl(kind);
        }
    }
    // Export to the global object.
    const reflection = root.Reflection = (root.Reflection || new Reflection());

    Function.prototype.getClass = Function.prototype.getClass || function() {
        return reflection.classForConstructor(this);
    };

    // Some AMD build optimizers, like r.js, check for condition patterns like:
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        // Expose Reflection on the global object to prevent errors when Reflection is
        // loaded by a script tag in the presence of an AMD loader.
        root.Reflection = reflection;

        // Define as an anonymous module so, through path mapping, it can be
        // referenced as the "underscore" module.
        define(function() {
            return reflection;
        });
    }
    // Check for `exports` after `define` in case a build optimizer adds it.
    else if (freeModule) {
        // Export for Node.js.
        (freeModule.exports = reflection).Reflection = reflection;
        // Export for CommonJS support.
        freeExports.Reflection = reflection;
    }

}.call(this));
