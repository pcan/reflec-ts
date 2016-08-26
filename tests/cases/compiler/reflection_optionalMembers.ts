// @module: commonjs
// @libFiles: reflection.d.ts
// @reflectionEnabled: true

// @filename: c:/root/file1.ts

interface MyInterface {
    a:string,
    b?:number,
    c?:MyInterface;
    d:MyInterface;
    e?();
    f();
}



