/// <reference path="./commons.ts"/>
/// <reference path="./helpers.ts"/>

/* @internal */
namespace ts.reflection {


    export function injectReflectionHooks2(sourceFile: SourceFile, useDecorators: boolean) {
        const decoratorsEnabled = useDecorators;

        const builder = new SourceASTBuilder(sourceFile);
        //const reflectionObjectLiteral = builder.createTypeLiteral([]);

        if (!isDeclarationFile(sourceFile)) { //TODO: check notes about this.
            sourceFile.$packageNameLiteral = builder.createStringLiteral(sourceFile.fileName);

            let typePackage = sourceFile.$typePackage = createTypePackage(null, sourceFile, null);
            scanStatements(sourceFile, typePackage);
            //this is our last commit, since reflectionObjectLiteral has been filled during scanStatements invocation.
            //injectReflectionVariableDefinition();
        }

        /**
         * Does a deep scan of the whole statementBlock, searching for classes and interfaces.
         * Stores metadata in the reflectionObjectLiteral, that will be the registerPackage() function/decorator argument.
         */
        function scanStatements(statementBlock: StatementsBlock, pkg: TypePackage) {
            let statements = statementBlock.statements;
            let statement: Statement;
            for (let i = 0; statements && i < statements.length; i++) {
                statement = statements[i];
                statement.parent = statementBlock;
                switch (statement.kind) {
                    case ts.SyntaxKind.ModuleDeclaration:
                        scanModuleDeclaration(pkg, <ts.ModuleDeclaration>statement);
                        break;
                    case ts.SyntaxKind.InterfaceDeclaration:
                        //case ts.SyntaxKind.TypeAliasDeclaration: //TODO, during emitting phase
                        scanInterfaceDeclaration(<InterfaceDeclaration>statement, pkg);
                        break;
                    case ts.SyntaxKind.ClassDeclaration: //TODO: scan for class expressions, everywhere!!!!
                        if (decoratorsEnabled) {
                            addRegisterClassDecorator(<ClassDeclaration>statement, pkg);
                            builder.commit();
                        } else {
                            let callStatement = createRegisterClassCallStatement(<ClassDeclaration>statement, pkg);
                            if (callStatement) {
                                callStatement.parent = statementBlock;
                                builder.commit(callStatement, statementBlock, ++i);
                            }
                        }
                        break;
                    default:
                    //nothing of interest for us...
                }
            }
            createInterfaceVariableInits(statementBlock, pkg);
        }

        /**
         * Creates a new TypePackage from a module declaration and starts the deep scanning.
         */
        function scanModuleDeclaration(parent: TypePackage, statement: ModuleDeclaration) {
            let pkg: TypePackage = createTypePackage(getDeclarationName(statement), statement, parent);
            parent.children[pkg.name] = pkg;
            if (statement.body && statement.body.kind === ts.SyntaxKind.ModuleBlock) {
                statement.body.parent = statement;
                scanStatements(<ts.ModuleBlock>statement.body, pkg);
            }
        }


        function scanInterfaceDeclaration(statement: InterfaceDeclaration, pkg: TypePackage) {
            if (!existsTypeDeclarationDuplicate(statement, pkg)) {
                pkg.types[getKeyForNameAndKind(getDeclarationName(statement), statement.kind)] = statement;
            }
        }

        function createInterfaceVariableInits(statementBlock: StatementsBlock, pkg: TypePackage) {
            let declaration: DeclarationStatement;
            let collidingType: DeclarationStatement;
            for (let typeName in pkg.types) {
                declaration = pkg.types[typeName];
                if (declaration.kind === SyntaxKind.InterfaceDeclaration) {
                    //check if a class with the same name exists. Do nothing in this case.
                    collidingType = pkg.types[getKeyForNameAndKind(getDeclarationName(declaration), SyntaxKind.ClassDeclaration)];
                    if (!collidingType) {
                        createInterfaceVariableInit(<InterfaceDeclaration>declaration, statementBlock, pkg);
                    }
                }
            }
        }

        /**
         * Creates the 'var MyInterface = Reflection.interfaceForName("....")' statement.
         */
        function createInterfaceVariableInit(declaration: InterfaceDeclaration, statementBlock: StatementsBlock, pkg: TypePackage) {

            const modifiers = getModifierFlags(declaration) & ModifierFlags.Export
                ? builder.createModifiersArray(NodeFlags.Const, [builder.createNode<Modifier>(SyntaxKind.ExportKeyword),builder.createNode<Modifier>(SyntaxKind.ConstKeyword)])
                : builder.createModifiersArray(NodeFlags.Const, []);

            const statement = builder.createVariableInitializerStatement(getDeclarationName(declaration),
                builder.createCallExpression(
                    builder.createPropertyAccessExpression( //Reflection.interfaceForName
                        interfaceForNameFunctionName,
                        builder.createIdentifier(reflectionModuleName)
                    ),
                    [getFullyQualifiedTypeName(pkg, getDeclarationName(declaration))],
                ),
                modifiers
            );
            statement.declarationList.declarations[0].pos = declaration.pos;
            statement.declarationList.declarations[0].end = declaration.end;
            builder.commit(statement, statementBlock);
        }



        /**
         * adds the @Reflection.RegisterClass() decorator
         */
        function addRegisterClassDecorator(declaration: ClassDeclaration, pkg: TypePackage) {
            if (!existsTypeDeclarationDuplicate(declaration, pkg)) {
                pkg.types[getKeyForNameAndKind(getDeclarationName(declaration), declaration.kind)] = declaration;
                declaration.decorators = declaration.decorators || <NodeArray<Decorator>>[];
                let decorator = builder.createNode<Decorator>(SyntaxKind.Decorator);
                decorator.expression = builder.createCallExpression(
                    builder.createPropertyAccessExpression( //Reflection.RegisterClass
                        registerClassDecoratorName,
                        builder.createIdentifier(reflectionModuleName)
                    ), [
                        getFullyQualifiedTypeName(pkg, getDeclarationName(declaration))
                    ]
                )
                declaration.decorators.push(decorator);
            }
        }

        function getFullyQualifiedTypeName(typePackage: TypePackage, typeName: string): BinaryExpression {
            const packageAndType = (typePackage.fullName ? typePackage.fullName + '.' : '') + typeName;
            return builder.createBinaryExpression(
                sourceFile.$packageNameLiteral,
                builder.createNode<Node>(SyntaxKind.PlusToken),
                builder.createStringLiteral('#' + packageAndType)
            );
        }

        /**
         * Creates the registerClass(...) statement.
         */
        function createRegisterClassCallStatement(declaration: ClassDeclaration, pkg: TypePackage): Statement {
            if (!existsTypeDeclarationDuplicate(declaration, pkg)) {
                pkg.types[getKeyForNameAndKind(getDeclarationName(declaration), declaration.kind)] = declaration;
                let classIdentifier = builder.createIdentifier(getDeclarationName(declaration));
                classIdentifier.$declarationLink = declaration;
                let callStatement = builder.createExpressionStatement(
                    builder.createCallExpression(
                        builder.createPropertyAccessExpression( //Reflection.registerClass
                            registerClassFunctionName,
                            builder.createIdentifier(reflectionModuleName)
                        ), [
                            classIdentifier, //MyClass
                            getFullyQualifiedTypeName(pkg, getDeclarationName(declaration))
                        ]
                    )
                );
                return callStatement;
            }
        }

    }

}
