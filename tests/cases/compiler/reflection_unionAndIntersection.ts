// @module: commonjs
// @libFiles: reflection.d.ts
// @reflectionEnabled: true

// @filename: c:/root/file1.ts

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



