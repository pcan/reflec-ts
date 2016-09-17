// @module: commonjs
// @libFiles: reflection.d.ts
// @reflectionEnabled: true

// @filename: c:/root/file1.ts
interface PrivateInt {
    id:number;
}
export interface PublicInt {
    name:string;
}
export class MyClass implements PrivateInt, PublicInt{
	id:number;
    name:string;
}



