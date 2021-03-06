/// <reference path="./writer.ts"/>
/// <reference path="./builder.ts"/>


/* @internal */
namespace ts.reflection {
    //TODO: check if Reflection already exists.

    export function initConfig(compilerHost: CompilerHost, compilerOptions: CompilerOptions) {
        if (compilerHost && compilerOptions && !compilerOptions.reflectionEnabled) {
            const configFileName = compilerOptions && compilerOptions.configFilePath || compilerHost && sys && sys.fileExists && findConfigFile(compilerHost.getCurrentDirectory(), sys.fileExists);
            if (configFileName) {
                let config = readConfigFile(configFileName, sys.readFile).config;
                config.compilerOptions = config.compilerOptions || {};
                if (config.reflectionEnabled) {
                    compilerOptions.reflectionEnabled = true;
                }
            }
        }
    }

    export function addReflectionToAST(sourceFile: SourceFile) {
        let compilerOptions = sourceFile.compilerOptions;
        if (!isDeclarationFile(sourceFile) && sourceFile.statements.length > 0 && compilerOptions && compilerOptions.reflectionEnabled) {
            const useDecorators = compilerOptions && compilerOptions.experimentalDecorators;
            injectReflectionHooks2(sourceFile, useDecorators);
            const b = new SourceASTBuilder(sourceFile);
            const importNode = b.createNode<ImportDeclaration>(SyntaxKind.ImportDeclaration);
            importNode.moduleSpecifier = b.createStringLiteral("*reflection");
            b.commit(importNode);
        }

    }

    export function emitReflectionModule(host: EmitHost, program: Program) {
        let compilerOptions = host.getCompilerOptions();
        if (!compilerOptions || !compilerOptions.reflectionEnabled) {
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

        compilerOptions = null;

        function addReflectionImport(file: SourceFile) {
            if (file.$packageNameLiteral && !isDeclarationFile(file)) {
                let name = './' + convertToRelativePath( //what a mess!!
                    removeFileExtension(reflectionFileName),
                    getDirectoryPath(getOwnEmitOutputFilePath(file, host, '.js')),
                    host.getCanonicalFileName);
                let b = new SourceASTBuilder(file);

                for (let statement of file.statements) {
                    if (statement.kind === SyntaxKind.ImportDeclaration && (<ImportDeclaration>statement).moduleSpecifier) {
                        let specifier = <Identifier>(<ImportDeclaration>statement).moduleSpecifier;
                        if (specifier && specifier.text === '*reflection') {
                            //we use this fake literal to change the fake reflection import with the real one.
                            let literal = b.createStringLiteral(name);
                            b.commit();
                            specifier.text = literal.text;
                            specifier.pos = literal.pos;
                            specifier.end = literal.end;
                            break;
                        }
                    }
                }

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
                }
            }
            writer.decreaseIndent().writeLine().write(`};`);
        }

        function emitReflectionForSourceFile(sourceFile: SourceFile) {
            writer.writeObjectPropertyStart(`'${sourceFile.$packageNameLiteral.text}'`);
            writeFlatTypePackage(sourceFile.$typePackage);
            writer.writeObjectEnd().write(',').writeLine();
        }

        function writeFlatTypePackage(typePackage: TypePackage) {
            const rootName = (typePackage.fullName ? typePackage.fullName + '.' : '');
            let typeDeclaration: TypeDeclaration;
            for (let typeName in typePackage.types) {
                typeDeclaration = typePackage.types[typeName];
                let type = checker.getTypeAtLocation(typeDeclaration);
                if (!type.$info) { // only if this type has not been already discovered.
                    addReflectionInfo(type, typeCounter, typeDeclaration);
                    let derivedTypes = writeType(type, checker, typeCounter, typeWriter);
                    writeDerivedTypes(derivedTypes, checker, typeCounter, derivedTypeWriter);
                }
                writer.write(`'${rootName + type.$info.name}': _l[${type.$info.localIndex}],`).writeLine();
            }
            for (let childPackageName in typePackage.children) {
                writeFlatTypePackage(typePackage.children[childPackageName]);
            }
            return map;
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
