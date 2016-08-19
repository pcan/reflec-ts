
declare namespace Reflection {

    function getLibraryName(): string; //will return the project name. Multiple libraries might use reflective typescript.

    //todo: check 'this.package' and classObject.name/kind.
    function registerClass(constructor: Function, fullyQualifiedName: string): void;

    //decorator equivalent functionality
    function RegisterClass(fullyQualifiedName: string) : (any) => void;

    //todo: check package property.
    function registerPackage<T>(name: string): T & ReflectionPackage;

    function classForName(fullyQualifiedName: string): Class;
    function classForName(pkg: string, name: string): Class;
    function classForConstructor(constructor: Function): Class;

    function interfaceForName(fullyQualifiedName: string): Interface;
    function interfaceForName(pkg: string, name: string,): Interface;
}

interface Function {

    getClass(): Class;

}

/**
  * Basic shape for a type.
  */
interface Type {
    /**
      * Describes the specific shape of the type.
      * @remarks
      * One of:
      *     "any"           -> IntrinsicType
      *     "number"        -> IntrinsicType
      *     "boolean"       -> IntrinsicType
      *     "string"        -> IntrinsicType
      *     "symbol"        -> IntrinsicType
      *     "void"          -> IntrinsicType
      *     "this"          -> IntrinsicType
      *     "parameter"     -> TypeParameter
      *     "reference"     -> TypeReference
      *     "predicate"     -> TypePredicate
      *     "array"         -> ArrayType
      *     "interface"     -> Interface
      *     "alias"         -> TypeAlias
      *     "class"         -> Class
      *     "tuple"         -> TupleType
      *     "union"         -> UnionType
      *     "intersection"  -> IntersectionType
      *     "function"      -> FunctionType
      *     "expression"    -> TypeExpression
      */
    kind: string;
}


/**
  * A type with a name.
  */
interface NamedType extends Type {

    /**
      * The name of the type. Optional, may be undefined.
      */
    name?: string;

}


/**
  * An intrinsic type.
  */
interface IntrinsicType extends Type {
    //kind: string; // "any", "number", "boolean", "string", "symbol", or "void"
}

/**
  * A generic type parameter.
  */
interface TypeParameter extends NamedType {
    //kind: string; // "parameter"

    /**
      * An optional constraint for the type parameter.
      */
    constraint?: Type;
}

/**
  * A reference to a generic type.
  */
interface TypeReference extends Type {
    //kind: string; // "reference"

    /**
      * The referenced generic type
      */
    type: Type;

    /**
      * The generic type arguments, in order.
      */
    typeArguments?: Type[];
}

interface TypePredicate extends Type {
    //kind: string; // "predicate"

    /**
      * The ordinal offset of the parameter in the parameter list
      */
    parameterIndex: number;

    /**
      * The type for the type predicate.
      */
    type: Type;
}

interface ArrayType extends Type {
    //kind: string; // "array"

    /**
      * The element type for the array.
      */
    elementType: Type;
}

/**
  * Describes an interface.
  */
interface TypeAlias extends NamedType {
    //kind: string; // "alias"

    /**
      * Members for the type. May be undefined.
      * @remarks Contains property, accessor, and method declarations.
      */
    members?: Member[];

    /**
      * Construct signatures for the type. May be undefined.
      */
    construct?: Signature[];

    /**
      * Call signatures for the type. May be undefined.
      */
    call?: Signature[];

        /**
      * Index signatures for the type. May be undefined.
      */
    index?: Signature[];
}

/**
  * Describes an interface.
  */
interface Interface extends NamedType {
    //kind: string; // "interface"


    /**
      * Generic type parameters for the type. May be undefined.
      */
    typeParameters?: TypeParameter[];

    /**
      * Extended interfaces.
      */
    extends?: Interface[];

    /**
      * Members for the type. May be undefined.
      * @remarks Contains property, accessor, and method declarations.
      */
    members?: Member[];

    /**
      * Call signatures for the type. May be undefined.
      */
    call?: Signature[];

    /**
      * Construct signatures for the type. May be undefined.
      */
    construct?: Signature[];

    /**
      * Index signatures for the type. May be undefined.
      */
    index?: Signature[];
}

/**
  * Describes a class.
  */
interface Class extends NamedType {
    //kind: string; // "class"

    /**
      * Generic type parameters for the type. May be undefined.
      */
    typeParameters?: TypeParameter[];

    /**
      * The superclass for the type.
      */
    extends?: Class;

    /**
      * Implemented interfaces.
      */
    implements?: Interface[];

    /**
      * Members for the type. May be undefined.
      * @remarks Contains property, accessor, and method declarations.
      */
    members?: Member[];

    /**
      * Static members for the type. May be undefined.
      * @remarks Contains property, accessor, and method declarations.
      */
    statics?: Member[];

    /**
      * Call signatures for the type. May be undefined.
      */
    call?: Signature[];

    /**
      * Construct signatures for the type. May be undefined.
      */
    construct?: Signature[];

    /**
      * Index signatures for the type. May be undefined.
      */
    index?: Signature[];

    /**
      * The constructor function for the class.
      */
    getConstructor?<T>(): new (...args) => T;
}

/**
  * Describes a tuple type.
  */
interface TupleType extends Type {
    //kind: string; // "tuple"

    /**
      * Types of each element in the tuple.
      */
    elements: Type[];
}

/**
  * Describes a union type.
  */
interface UnionType extends Type {
    //kind: string; // "union"

    /**
      * The constituent types of the union.
      */
    types: Type[];
}

/**
  * Describes an intersection type.
  */
interface IntersectionType extends Type {
    //kind: string; // "intersection"

    /**
      * The constituent types of the intersection.
      */
    types: Type[];
}

/**
  * Describes a function type.
  */
interface FunctionType extends NamedType {
    //kind: string; // "function"

    /**
      * The signatures for the function type
      */
    signatures: Signature[];
}

/**
  * Describes a class expression Type
  */
interface TypeExpression extends Type {
    //kind: string; // "expression"

    /**
      * The target class type referenced by this expression.
      */
    type: Class;
}

/**
  * Describes a parameter.
  */
interface ParameterInfo {
    /**
      * The name for the parameter. May be undefined.
      */
    name?: string;

    /**
      * The type of the parameter.
      */
    type: Type;
}

/**
 * Describes a member of a class or an interface.
 */
interface Member extends ParameterInfo {

}

/**
  * Describes a signature.
  */
interface Signature {
    /**
      * A value indicating whether this is a constructor signature.
      */
    construct?: boolean;

    /**
      * Generic type parameters for the function type. May be undefined.
      */
    typeParameters?: TypeParameter[];

    /**
      * Parameters for the function type.
      */
    parameters: ParameterInfo[];

    /**
      * The number of required parameters of the function type.
      */
    length: number;

    /**
      * A value indicating whether the final argument is a rest
      * argument. May be undefined.
      */
    rest?: boolean;

    /**
      * The return type of the function type. May be undefined.
      */
    returns?: Type;
}
