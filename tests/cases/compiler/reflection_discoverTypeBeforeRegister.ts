// @module: commonjs
// @libFiles: reflection.d.ts
// @reflectionEnabled: true
// @experimentalDecorators: true
// @removeComments: true
// @filename: c:/root/file1.ts
class Outer {
    // In this test case the type discovery process will detect 'Student' class before it is processed by the package scanner registration.
    // The bug was related to a duplicate type.$info creation, first on the discovered type object, then on the scanned one.
    a: Array<Inner>;
}

class Inner {
    id: number;
}