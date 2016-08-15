/// <reference path="./writer.ts"/>
/// <reference path="./builder.ts"/>


namespace ts.reflection {
    //TODO: check if Reflection already exists.
    var configuration:any; //hack: we don't want to change all signatures from program.ts to main.ts in order to pass configuration.
    let compilerHost: CompilerHost;
    let compilerOptions: CompilerOptions;

    export function setConfig(host: CompilerHost, options: CompilerOptions) {
        compilerHost = host;
        compilerOptions = options;
    }

    function buildConfiguration() {
        const configFileName = compilerOptions && compilerOptions.configFilePath || compilerHost && findConfigFile(compilerHost.getCurrentDirectory(), sys.fileExists);
        if(configFileName) {
            return readConfigFile(configFileName, sys.readFile).config;
        }
        return null;
    }

    export function addReflectionToAST(sourceFile: SourceFile) { //, createNode: (kind: SyntaxKind, pos?: number) => Node | Token | Identifier): void {

        configuration = configuration || buildConfiguration();
		let useDecorators = compilerOptions && compilerOptions.experimentalDecorators;
		
        if(configuration && configuration.reflectionEnabled) {
            injectReflectionHooks(sourceFile);
        }

    }

    export function emitReflectionModule(resolver: EmitResolver, host: EmitHost, program: Program, sourceFile: SourceFile) {
        if (!configuration || !configuration.reflectionEnabled) {
            return;
        }

        let dir = host.getCommonSourceDirectory();
        let reflectionFileName = getOwnEmitOutputFilePath(<SourceFile>{ fileName: dir + reflectionModuleName }, host, '.js');

        if (!program.$reflectionEmitted) {
            host.getSourceFiles().forEach(addReflectionImport);
            program.$reflectionEmitted = true;
            let reflectionFileContent = buildReflectionFile(host, program.getTypeChecker());
            host.writeFile(reflectionFileName, reflectionFileContent, host.getCompilerOptions().emitBOM);
        }

        configuration = null;

        function addReflectionImport(file: SourceFile) {
            if (file.$packageNameLiteral && !isDeclarationFile(file)) {
                let name = './' + convertToRelativePath( //what a mess!!
                    removeFileExtension(reflectionFileName),
                    getDirectoryPath(getOwnEmitOutputFilePath(file, host, '.js')),
                    host.getCanonicalFileName);
                let b = new SourceASTBuilder(file);
                let importNode = b.createNode<ImportDeclaration>(SyntaxKind.ImportDeclaration);
                importNode.moduleSpecifier = b.createStringLiteral(name);
                b.commit(importNode);
                let relativePath = convertToRelativePath(removeFileExtension(file.fileName), dir, host.getCanonicalFileName);
                //we use this fake literal to change the full package name to the short one.
                let tempLiteral = b.createStringLiteral(relativePath.replace(/[\/\\]/g, '.'));
                b.commit();
                file.$packageNameLiteral.text = tempLiteral.text;
                file.$packageNameLiteral.pos = tempLiteral.pos;
                file.$packageNameLiteral.end = tempLiteral.end;
            }
        }
    }

    function buildReflectionFile(host: EmitHost, checker: TypeChecker): string {
        const writer = new Writer(host.getNewLine());
        const typeWriter = new Writer(host.getNewLine()).increaseIndent().writeLine();
        const derivedTypeWriter = new Writer(host.getNewLine()).increaseIndent().writeLine();
        let libraryName = getSafeIdentifierName('default'); //will contain project name
        let typeCounter = createCounter();

        writer.increaseIndent().writeLine();
        emitIntrinsicTypes();
        emitReflectionForSourceFiles(host.getSourceFiles());
        emitInitForLoop();
        writer.writeLine().writeLine();
        derivedTypeWriter.writeLine().writeLine();
        typeWriter.writeLine().writeLine();
        return contentHeader + writer.getText() + derivedTypeWriter.getText() + typeWriter.getText() + contentFooter;

        function emitIntrinsicTypes() {
            for (let index in IntrinsicTypes) {
                writer.write(IntrinsicTypes[index].definition).writeLine();
            }
        }

        function emitInitForLoop() {
            writer.writeAtBeginning(`\n    for(var _cnt = 0; _cnt < ${typeCounter.getValue()}; _cnt++ ) { ${localTypeVar}[_cnt] = O_o(); }\n`);
            writer.writeAtBeginning(`\n    var ${tempTypeVar}, ${localTypeVar} = [];\n`);
        }

        function emitReflectionForSourceFiles(sourceFiles: SourceFile[]) {
            writer.write(`${reflectionModuleName}.${libsField}['${libraryName}'] = {`).writeLine().increaseIndent();
            for (let sourceFile of sourceFiles) {
                if (sourceFile.$packageNameLiteral && !isDeclarationFile(sourceFile)) {
                    emitReflectionForSourceFile(sourceFile);
                    writer.write(',').writeLine();
                }
            }
            writer.decreaseIndent().writeLine().write(`};`);
        }

        function emitReflectionForSourceFile(sourceFile: SourceFile) {
            writer.writeObjectPropertyStart(sourceFile.$packageNameLiteral.text);
            emitTypePackage(sourceFile.$typePackage);
            writer.writeObjectEnd();
        }

        function emitTypePackage(typePackage: TypePackage) {
            if (typePackage.name) { //do not start new object for root
                writer.writeObjectPropertyStart(typePackage.name);
            }
            let typeDeclaration: TypeDeclaration;
            for (let typeName in typePackage.types) {
                typeDeclaration = typePackage.types[typeName];
                var type = checker.getTypeAtLocation(typeDeclaration);
                addReflectionInfo(type, typeCounter, typeDeclaration);
                writer.write(`${type.$info.name}: _l[${type.$info.localIndex}],`).writeLine();
                let derivedTypes = writeType(type, checker, typeCounter, typeWriter);
                writeDerivedTypes(derivedTypes, checker, typeCounter, derivedTypeWriter);
            }
            for (let childPackageName in typePackage.children) {
                emitTypePackage(typePackage.children[childPackageName]);
                writer.write(',').writeLine();
            }
            if (typePackage.name) { //do not end object for root
                writer.writeObjectEnd();
            }
        }


    }

    /**
     * Writes all derived types, that are not declared in the program source code, but in external libraries, like types.d.ts.
     * Only needed types will be written.
     */
    function writeDerivedTypes(types: Type[], checker: TypeChecker, typeCounter: Counter, writer: Writer) {
        for (let i = 0; i < types.length; i++) {
            //types array will grow until all related types have been discovered.
            types = types.concat(writeType(types[i], checker, typeCounter, writer));
        }
    }

}
