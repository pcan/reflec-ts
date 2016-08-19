
namespace ts {

    export interface Type {
        $info?: reflection.ReflectionInfo;
    }

    export interface CompilerOptions {
        reflectionEnabled?: boolean;
    }

    export interface Program {
        $reflectionEmitted?: boolean;
    }

    export interface SourceFile {
        $typePackage?: reflection.TypePackage;
        $packageNameLiteral?: StringLiteral;
    }

    export type StatementsBlock = DefaultClause;
    export type TypeDeclaration = DeclarationStatement;

}

namespace ts.reflection {

    export const reflectionModuleName = 'Reflection';
    export const reflectionLocalVariableName = '$reflection';
    export const registerPackageFunctionName = 'registerPackage';
    export const interfaceForNameFunctionName = 'interfaceForName';
    export const registerClassFunctionName = 'registerClass';
    export const registerClassDecoratorName = 'RegisterClass';
    export const classTypeName = 'Class';
    export const interfaceTypeName = 'Interface';

    export const libsField = '$libs'; // Reflection.$libs will contain all data for each loaded module.
    export const localTypeVar = '_l';
    export const tempTypeVar = '_t';

    const reflectionModuleNameInit = 'var ' + reflectionModuleName + ' = globalObj.' + reflectionModuleName + ' || {' + libsField + ':  O_o() };';

    export interface TypePackage {
        name: string;
        fullName:string;
        node: Node;
        parent: TypePackage;
        types?: {
            [index: string]: TypeDeclaration;
        };
        children?: {
            [index: string]: TypePackage;
        };
    }

    export interface ReflectionInfo {
        localIndex?: number;
        path?: string;
        name?: string;
    }

    let invalidIdentifierCharsRegex = /^[\d]|[^a-zA-Z\d\_\$\xA0-\uFFFF]+?/;
    export function getSafeIdentifierName(name: string): string {
        return name.replace(invalidIdentifierCharsRegex, "_");
    }

    export interface IntrinsicTypeDescriptor {
        varName: string,
        definition: string,
    };

    function buildIntrinsicType(name: string): IntrinsicTypeDescriptor {
        let varName = `_type_${name}`;
        return {
            definition: `var ${varName} = {kind: '${name}'};`,
            varName: varName
        };
    }



    export const IntrinsicTypes: { [index: string]: IntrinsicTypeDescriptor } = {};

    IntrinsicTypes[TypeFlags.Any] = buildIntrinsicType('any');
    IntrinsicTypes[TypeFlags.String] = buildIntrinsicType('string');
    IntrinsicTypes[TypeFlags.Number] = buildIntrinsicType('number');
    IntrinsicTypes[TypeFlags.Boolean] = buildIntrinsicType('boolean');
    IntrinsicTypes[TypeFlags.Void] = buildIntrinsicType('void');
    IntrinsicTypes[TypeFlags.ESSymbol] = buildIntrinsicType('symbol');
    IntrinsicTypes[TypeFlags.ThisType] = buildIntrinsicType('this');
    IntrinsicTypes[TypeFlags.Undefined] = buildIntrinsicType('undefined');
    IntrinsicTypes[TypeFlags.Null] = buildIntrinsicType('null');
    IntrinsicTypes[TypeFlags.Never] = buildIntrinsicType('never');

	export function getIntrinsicType(typeFlags: TypeFlags) {
		let filtered = typeFlags & 0x3FFF; //from Any to Never (bit 13)
		return IntrinsicTypes[filtered];
	}

    export const SerializedTypeKind = { //:{[index: string]: string } ????
        Interface: 'interface',
        Class: 'class',
        Function: 'function',
        Array: 'array',
        Parameter: 'parameter',
        Reference: 'reference',
        Alias: 'alias',
    };

    export function getTypeName(type: Type, statement?: Statement | Declaration): string {
        let name: string;
        if (statement &&
            (statement.kind === SyntaxKind.TypeAliasDeclaration
                || statement.kind === SyntaxKind.ClassDeclaration
                || statement.kind === SyntaxKind.InterfaceDeclaration)) {
            let declaration = (<TypeDeclaration>statement);
            name = declaration && declaration.name ? declaration.name.text : type.symbol.name;
        } else {
            name = type.symbol.name;
        }
        return name;
    }

    /**
     * Adds some tracking information to Type objects, useful for building relationships among them.
     */
    export function addReflectionInfo(type: Type, typeCounter: Counter, typeDeclaration?: Statement) {
        type.$info = {
            name: getTypeName(type, typeDeclaration),
            localIndex: typeCounter.increment()
        }
    }

    export interface Counter {
        getValue(): number;
        increment(): number;
    }


    export function createCounter(initValue?: number): Counter {
        let value = initValue >= 0 ? initValue : 0;
        return {
            getValue: () => value,
            increment: () => value++
        }
    }

    /**
     * Mimics the EmitTextWriter, but with fluent API.
     */
    export class Writer {

        private output = "";
        private indent = 0;
        private lineStart = true;
        private lineCount = 0;
        private linePos = 0;

        constructor(private newLine: string) {
        }

        write(s: string) {
            if (s && s.length) {
                if (this.lineStart) {
                    this.output += getIndentString(this.indent);
                    this.lineStart = false;
                }
                this.output += s;
            }
            return this;
        }

        writeAtBeginning(s: string) {
            if (s && s.length) {
                this.output = s + this.output;
            }
            return this;
        }

        writeLine() {
            if (!this.lineStart) {
                this.output += this.newLine;
                this.lineCount++;
                this.linePos = this.output.length;
                this.lineStart = true;
            }
            return this;
        }

        getText() {
            return this.output;
        };

        increaseIndent() {
            this.indent++;
            return this;
        }

        decreaseIndent() {
            this.indent > 0 ? this.indent-- : null;
            return this;
        }

        writeObjectStart(skipNewLine?: boolean) {
            return this.writeDelimiterStart(`{`, skipNewLine);
        }

        writeObjectEnd(skipNewLine?: boolean) {
            return this.writeDelimiterEnd(`}`, skipNewLine);
        }

        writeArrayStart(skipNewLine?: boolean) {
            return this.writeDelimiterStart(`[`, skipNewLine);
        }

        writeArrayEnd(skipNewLine?: boolean) {
            return this.writeDelimiterEnd(`]`, skipNewLine);
        }

        writeDelimiterStart(delimiterStart: string, skipNewLine?: boolean) {
            this.write(delimiterStart).increaseIndent();
            if (!skipNewLine) {
                this.writeLine();
            }
            return this;
        }

        writeDelimiterEnd(delimiterEnd: string, skipNewLine?: boolean) {
            this.decreaseIndent();
            if (!skipNewLine) {
                this.writeLine();
            }
            return this.write(delimiterEnd);
        }

        writeObjectPropertyStart(propertyName: string, skipNewLine?: boolean) {
            return this.write(`${propertyName} : `).writeObjectStart(skipNewLine);
        }

        writeArrayPropertyStart(propertyName: string, skipNewLine?: boolean) {
            return this.write(`${propertyName} : `).writeArrayStart(skipNewLine);
        }

    }

    export function valuesOf<T>(dataObject: { [index: string]: T }) {
        var dataArray: any[] = [];
        for (var key in dataObject)
            dataArray.push(dataObject[key]);
        return <T[]>dataArray;
    }

    export module debug {

        export function info(message: any, ...strArray: any[]) {
            //todo: if debug enabled
            if (strArray) {
                console.info(message, ...strArray);
            }

        }

        export function warn(message: any, ...strArray: any[]) {
            //todo: if warn enabled
            if (strArray) {
                console.warn(message, ...strArray);
            }

        }

    }

    export const contentHeader = `;(function(globalObj, undefined) {

    var freeExports = typeof exports == 'object' && exports;
    var freeModule = typeof module == 'object' && module && module.exports == freeExports && module;

    /** Detect free variable 'global' and use it as 'globalObj' */
    var freeGlobal = typeof global == 'object' && global;
    if (freeGlobal) {
        globalObj = freeGlobal;
    }
    var metadataField = (typeof Symbol === 'function') ? Symbol('metadata') : '__reflectionData__';
    function O_o(){return Object.create(null);} //lol

    var ${reflectionModuleName} = globalObj.${reflectionModuleName} || { ${libsField}:  O_o() };
    `;

    export const contentFooter = `
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
            }
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
        }
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

    globalObj.${reflectionModuleName} = ${reflectionModuleName}
    \n}(this));`;

}
