// @module: commonjs
// @libFiles: reflection.d.ts
// @reflectionEnabled: true

// @filename: c:/root/file1.ts

interface MyInterface {}

export default class implements MyInterface {
	a: string;
    method() {
        this.constructor.getClass().name;
    }
}



