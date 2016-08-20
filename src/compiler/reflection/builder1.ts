/// <reference path="./commons.ts"/>
/// <reference path="./helpers.ts"/>

/* @internal */
namespace ts.reflection {


    /**
     * AST enhancement entry point.
     */
    export function injectReflectionHooks1(sourceFile: SourceFile, useDecorators: boolean) {
        const decoratorsEnabled = useDecorators;

        const builder = new SourceASTBuilder(sourceFile);
        const reflectionObjectLiteral = builder.createTypeLiteral([]);

        if (!isDeclarationFile(sourceFile)) { //TODO: check notes about this.
            let typePackage = sourceFile.$typePackage = createTypePackage(null, sourceFile, null);
            scanStatements(sourceFile, typePackage, reflectionObjectLiteral);
            //this is our last commit, since reflectionObjectLiteral has been filled during scanStatements invocation.
            injectReflectionVariableDefinition();
        }

        /**
         * Creates the first statement of the SourceFile:
         * Reflection.registerPackage('package.name', { .... });
         *
         * The object literal will contain all classes and interfaces metadata references.
         */
        function injectReflectionVariableDefinition() {
            //this text literal will be changed on the fly by the emitter
            sourceFile.$packageNameLiteral = builder.createStringLiteral(sourceFile.fileName);
            let statement = builder.createVariableInitializerStatement(reflectionLocalVariableName,
                builder.createCallExpression(
                    builder.createPropertyAccessExpression( //Reflection.registerPackage
                        registerPackageFunctionName,
                        builder.createIdentifier(reflectionModuleName)
                    ),
                    [sourceFile.$packageNameLiteral], //package name,
                    [reflectionObjectLiteral]
                ),
                builder.createModifiersArray(
                    NodeFlags.Export | NodeFlags.Const,
                    [builder.createNode<Modifier>(SyntaxKind.ExportKeyword)]
                )
            );
            builder.commit(statement);
        }

        /**
         * Does a deep scan of the whole statementBlock, searching for classes and interfaces.
         * Stores metadata in the reflectionObjectLiteral, that will be the registerPackage() function/decorator argument.
         */
        function scanStatements(statementBlock: StatementsBlock, pkg: TypePackage, reflectionObj: TypeLiteralNode) {
            let statements = statementBlock.statements;
            let statement: Statement;
            for (let i = 0; statements && i < statements.length; i++) {
                statement = statements[i];
                statement.parent = statementBlock;
                switch (statement.kind) {
                    case ts.SyntaxKind.ModuleDeclaration:
                        scanModuleDeclaration(pkg, <ts.ModuleDeclaration>statement, reflectionObj);
                        break;
                    case ts.SyntaxKind.InterfaceDeclaration:
                        //case ts.SyntaxKind.TypeAliasDeclaration: //TODO, during emitting phase
                        scanInterfaceDeclaration(<InterfaceDeclaration>statement, pkg, reflectionObj);
                        break;
                    case ts.SyntaxKind.ClassDeclaration: //TODO: scan for class expressions, everywhere!!!!
                        if (decoratorsEnabled) {
                            addRegisterClassDecorator(<ClassDeclaration>statement, pkg, reflectionObj);
                        } else {
                            let callStatement = createRegisterClassCallStatement(<ClassDeclaration>statement, pkg, reflectionObj);
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
        }

        /**
         * Creates a new TypePackage from a module declaration and starts the deep scanning.
         */
        function scanModuleDeclaration(parent: TypePackage, statement: ts.ModuleDeclaration, reflectionObj: TypeLiteralNode) {
            let pkg: TypePackage = createTypePackage(statement.name.text, statement, parent);
            parent.children[pkg.name] = pkg;
            let childReflectionObj = builder.createTypeLiteral([]);
            let reflectionObjProperty = builder.createPropertySignature(pkg.name, childReflectionObj);
            reflectionObj.members.push(reflectionObjProperty);
            childReflectionObj.parent = reflectionObj;
            if (statement.body && statement.body.kind === ts.SyntaxKind.ModuleBlock) {
                statement.body.parent = statement;
                scanStatements(<ts.ModuleBlock>statement.body, pkg, childReflectionObj);
            }
        }

        function scanInterfaceDeclaration(statement: InterfaceDeclaration, pkg: TypePackage, reflectionObj: TypeLiteralNode) {
            if (statement.name && statement.name.text && !existsTypeDeclarationDuplicate(statement, pkg)) {
                pkg.types[getKeyForNameAndKind(statement.name.text, statement.kind)] = statement;
                addReflectionObjectTypeProperty(statement, pkg, reflectionObj);
            }
        }

        /**
         * adds the @$reflection.RegisterClass() decorator
         */
        function addRegisterClassDecorator(declaration: ClassDeclaration, pkg: TypePackage, reflectionObj: TypeLiteralNode) {
            if (declaration.name && declaration.name.text && !existsTypeDeclarationDuplicate(declaration, pkg)) {
                pkg.types[getKeyForNameAndKind(declaration.name.text, declaration.kind)] = declaration;
                let reflectionObjProperty = addReflectionObjectTypeProperty(declaration, pkg, reflectionObj);
                declaration.decorators = declaration.decorators || <NodeArray<Decorator>>[];
                let decorator = builder.createNode<Decorator>(SyntaxKind.Decorator);
                decorator.expression = builder.createCallExpression(
                    builder.createPropertyAccessExpression( //$reflection.registerClass
                        registerClassDecoratorName,
                        builder.createIdentifier(reflectionLocalVariableName)
                    ), [
                        getReflectionClassPropertyFullAccess(declaration.name.text, pkg) //$reflection.pkg1.pkg2.MyClass
                    ]
                )

                declaration.decorators.push(decorator);
            }
        }

        /**
         * Creates the registerClass(...) statement.
         */
        function createRegisterClassCallStatement(statement: ClassDeclaration, pkg: TypePackage, reflectionObj: TypeLiteralNode): Statement {
            if (statement.name && statement.name.text && !existsTypeDeclarationDuplicate(statement, pkg)) {
                pkg.types[getKeyForNameAndKind(statement.name.text, statement.kind)] = statement;
                let reflectionObjProperty = addReflectionObjectTypeProperty(statement, pkg, reflectionObj);
                let callStatement = builder.createExpressionStatement(
                    builder.createCallExpression(
                        builder.createPropertyAccessExpression( //$reflection.registerClass
                            registerClassFunctionName,
                            builder.createIdentifier(reflectionLocalVariableName)
                        ), [
                            builder.createIdentifier(statement.name.text), //MyClass
                            getReflectionClassPropertyFullAccess(statement.name.text, pkg) //$reflection.pkg1.pkg2.MyClass
                        ]
                    )
                );
                return callStatement;
            }
        }



        /**
         * Builds the AST nodes for full property access on reflection local object for the given typeName.
         * For example, given 'MyClass' as typeName and a three-level package (p1,p2,p3), this method generates
         * the AST nodes for this property access expression: $reflection.p1.p2.p3.MyClass
         */
        function getReflectionClassPropertyFullAccess(typeName: string, pkg: TypePackage): PropertyAccessExpression {
            let expression: LeftHandSideExpression = builder.createIdentifier(reflectionLocalVariableName);
            let path: TypePackage[] = [];
            for (let tempPkg = pkg; tempPkg.parent != null; tempPkg = tempPkg.parent) {
                path.unshift(tempPkg);
            }
            for (let tempPkg of path) {
                expression = builder.createPropertyAccessExpression(tempPkg.name, expression);
            }
            return builder.createPropertyAccessExpression(typeName, expression);
        }

        /**
         * Adds the given TypeDeclaration to the reflectionObj as a PropertySignature. It checks possible
         * name clashes (eg. an interface and a class with the same name) and fix them by adding a suffix to
         * their names.
         */
        function addReflectionObjectTypeProperty(declaration: TypeDeclaration, pkg: TypePackage, reflectionObj: TypeLiteralNode): PropertySignature {
            let name = fixupDeclarationName(declaration, pkg, reflectionObj);
            if (name) { //dirty hack. Interfaces with colliding class names must be ignored, so skip this
                let typeKind = getTypeKindFromDeclaration(declaration);
                let reflectionObjProperty = builder.createPropertySignature(
                    name,
                    builder.createTypeReference(typeKind)
                );
                reflectionObjProperty.parent = reflectionObj;
                reflectionObj.members.push(reflectionObjProperty);
                return reflectionObjProperty;
            }
        }

        /**
         * Checks if the given declaration has the same name of another declaration but with different type.
         * If this is the case, it adds a suffix to the interface declaration name.
         */
        function fixupDeclarationName(declaration: TypeDeclaration, pkg: TypePackage, reflectionObj: TypeLiteralNode): string {
            let declarationName: string = null;
            if (reflectionObj.members && declaration.name) {
                declarationName = declaration.name.text;
                let otherKind = declaration.kind == SyntaxKind.ClassDeclaration ? SyntaxKind.InterfaceDeclaration : SyntaxKind.ClassDeclaration;
                let collidingKey = getKeyForNameAndKind(declarationName, otherKind);
                let collidingType = pkg.types[collidingKey];
                if (collidingType) {
                    if (otherKind === SyntaxKind.InterfaceDeclaration) {
                        //we are registering the class declaration, change the interface name
                        removeExistingInterfaceDeclarationName(declarationName, reflectionObj);
                        delete pkg.types[collidingKey];
                    } else {
                        //otherwise, we are going to register the interface declaration, skip this and return null.
                        declarationName = null;
                    }
                }
            }
            return declarationName;
        }

        /**
         * Looks for the interface declaration with the given name and changes it by adding a suffix.
         */
        function removeExistingInterfaceDeclarationName(declarationName: string, reflectionObj: TypeLiteralNode) {
            let oldIdentifier: Identifier;
            let members = <NodeArray<PropertySignature>>reflectionObj.members;
            let member: PropertySignature;
            for (let i = 0; i < members.length; i++) {
                member = members[i];
                oldIdentifier = <Identifier>member.name;
                //just find the declaration with same name, it cannot be of same type (check done previously).
                if ((<Identifier>member.name).text === declarationName) {
                    members.splice(i, 1);
                    return;
                }
            }
        }

        /**
         * Returns the runtime name for 'Class' and 'Interface' meta-interfaces, given the declaration.
         */
        function getTypeKindFromDeclaration(declaration: TypeDeclaration): string {
            if (declaration.kind === SyntaxKind.ClassDeclaration) {
                return classTypeName;
            } else if (declaration.kind === SyntaxKind.InterfaceDeclaration) {
                return interfaceTypeName;
            }
            return null;
        }

    }

}
