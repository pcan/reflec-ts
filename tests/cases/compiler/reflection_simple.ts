// @module: commonjs
// @libFiles: reflection.d.ts
// @filename: c:/root/tsconfig.json
// @reflectionEnabled: true
{
    "compilerOptions": {
		"target": "ES5",
        "module": "commonjs",
        "reflectionEnabled": true,
        "removeComments": true,
        "noLib": false,
        "preserveConstEnums": true,
        "experimentalDecorators": true,
        "baseUrl": "../",
        "paths": {
            "*": [
                "*"
            ]
        }
    }
}

// @filename: c:/root/file1.ts

class Pippo {
	
}

let a = Pippo.getClass().name;

