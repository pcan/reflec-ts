// @module: commonjs
// @libFiles: reflection.d.ts
// @reflectionEnabled: true

// @filename: c:/root/file1.ts

interface TypedInterface<S,T> {
    a: T;
    b: S;
}
interface TypedInterface2<S, T extends TypedInterface<S,T>> {
}
class MyClass {
    x: TypedInterface<string, TypedInterface<number, MyClass>>;
}


