// @module: commonjs
// @libFiles: reflection.d.ts
// @reflectionEnabled: true

// @filename: c:/root/file1.ts

class MyClass {
	named = class NamedClassExpr {
        id: number;
    };
    anonymous = class {
        id: number;
    };
    nested = class A {
        id: number;
        nested = class B {
            id: number;
            nested = class C {
                id: number;
                recursive: A;
            };
        };
    };
}



