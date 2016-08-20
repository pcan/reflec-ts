// @module: commonjs
// @libFiles: reflection.d.ts
// @filename: c:/root/tsconfig.json
{
    "compilerOptions": {
		"target": "ES5",
        "module": "commonjs",
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
    },
	"reflectionEnabled": true
}

// @filename: c:/root/file1.ts

class Pippo {
	
}

let a = Pippo.getClass().name;

