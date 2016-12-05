/// <reference path="./commons.ts"/>

/* @internal */
namespace ts.reflection {

    /**
     * Helper class for synthetic AST building.
     */
    export class SourceASTBuilder {

        constructor(private sourceFile: SourceFile) {
        }

        createNode<T extends Node>(kind: SyntaxKind, pos?: number, end?: number): T {
            return <T>createNode(kind, (pos >= 0) ? pos : 0, (end >= 0) ? end : (pos >= 0) ? pos : 0);
        }

        createToken<TKind extends SyntaxKind>(kind: TKind, pos?: number, end?: number): Token<TKind> {
            return <Token<TKind>>createNode(kind, (pos >= 0) ? pos : 0, (end >= 0) ? end : (pos >= 0) ? pos : 0);
        }

        createIdentifier(text: string): Identifier {
            const node = this.createNode<Identifier>(SyntaxKind.Identifier, this.pos());
            node.text = text;
            node.end = this.pos();
            return node;
        }

        createStringLiteral(stringText: string): StringLiteral {
            const node = this.createNode<StringLiteral>(SyntaxKind.StringLiteral, this.pos());
            node.text = stringText;
            node.end = this.pos();
            return node;
        }

        createExpressionStatement(expression: Expression): ExpressionStatement {
            const node = this.createNode<ExpressionStatement>(SyntaxKind.ExpressionStatement);
            node.expression = expression;
            return node;
        }

        createVariableInitializerStatement(variableName: string, expression: Expression, modifiers?: NodeArray<Modifier>): VariableStatement {
            const node = this.createNode<VariableStatement>(SyntaxKind.VariableStatement);
            node.modifiers = modifiers;
            node.declarationList = this.createNode<VariableDeclarationList>(SyntaxKind.VariableDeclarationList);
            const declaration = this.createNode<VariableDeclaration>(SyntaxKind.VariableDeclaration);
            node.declarationList.declarations = <NodeArray<VariableDeclaration>>[declaration];
            declaration.name = this.createIdentifier(variableName);
            declaration.initializer = expression;
            return node;
        }

        createBinaryExpression(left: Expression, operatorToken: Token<BinaryOperator>, right: Expression): BinaryExpression {
            const node = this.createNode<BinaryExpression>(SyntaxKind.BinaryExpression);
            node.left = left;
            node.operatorToken = operatorToken;
            node.right = right;
            return node;
        }

        createCallExpression<E extends Expression, T extends TypeNode>(expression: LeftHandSideExpression, args: Array<E>, typeArgs?: Array<T>): CallExpression {
            const node = this.createNode<CallExpression>(SyntaxKind.CallExpression);
            node.expression = expression;
            node.arguments = <NodeArray<E>>args;
            node.typeArguments = <NodeArray<T>>typeArgs;
            return node;
        }

        createPropertyAccessExpression(propertyName: string, expression: LeftHandSideExpression): PropertyAccessExpression {
            const node = this.createNode<PropertyAccessExpression>(SyntaxKind.PropertyAccessExpression);
            node.expression = expression;
            node.name = this.createIdentifier(propertyName);
            return node;
        }

        createPropertyAssignment(propertyName: string, expression: Expression): PropertyAssignment {
            const node = this.createNode<PropertyAssignment>(SyntaxKind.PropertyAssignment); //lo zero ci vuole!
            node.name = this.createIdentifier(propertyName);
            node.initializer = expression;
            return node;
        }

        createTypeAssertionExpression(typeNode: TypeNode, expression: UnaryExpression): TypeAssertion {
            const node = this.createNode<TypeAssertion>(SyntaxKind.TypeAssertionExpression);
            node.expression = expression;
            node.type = typeNode;
            return node;
        }

        createTypeReference<T extends TypeNode>(typeName: string, typeArguments?: Array<T>): TypeReferenceNode {
            const node = this.createNode<TypeReferenceNode>(SyntaxKind.TypeReference);
            node.typeName = this.createIdentifier(typeName);
            node.typeArguments = <NodeArray<T>>typeArguments;
            return node;
        }

        createTypeLiteral<T extends TypeElement>(typeElements: Array<T>): TypeLiteralNode {
            const node = this.createNode<TypeLiteralNode>(SyntaxKind.TypeLiteral);
            node.members = <NodeArray<T>>typeElements;
            return node;
        }

        createPropertySignature(propertyName: string, type: TypeNode): PropertySignature {
            const node = this.createNode<PropertySignature>(SyntaxKind.PropertySignature);
            node.name = this.createIdentifier(propertyName);
            node.type = type;
            return node;
        }

        commit(statement?: Statement, parent?: StatementsBlock, index?: number) {
            if (statement) {
                if (!parent) {
                    parent = this.sourceFile;
                }
                checkParentSourceFile(parent, this.sourceFile);
                if (!(index >= 0)) {
                    index = 0;
                }
                parent.statements.splice(index, 0, statement);
                fixupParentReferences(statement);
                statement.parent = parent;
            }
        }

        private pos(): number {
            return -1;
        }

    }

    function checkParentSourceFile(node: Node, sourceFile: SourceFile) {
        let parent = node;
        while (parent != sourceFile) {
            parent = parent.parent;
            if (!parent) {
                throw new Error("Cannot relate a node with the given source file.");
            }
        }
    }

    function fixupParentReferences(rootNode: Node) {
        let parent: Node = rootNode;
        forEachChild(rootNode, visitNode);
        return;

        function visitNode(n: Node): void {

            if (n.parent !== parent) {
                n.parent = parent;
                const saveParent = parent;
                parent = n;
                forEachChild(n, visitNode);
                parent = saveParent;
            }
        }
    }

    export function createTypePackage(name: string, node: Node, parent: TypePackage): TypePackage {
        const package = <TypePackage>Object.create(null); //no prototype needed.
        package.name = name ? getSafeIdentifierName(name) : null;
        package.fullName = parent && parent.fullName ? (parent.fullName + '.' + name) : name;
        package.node = node;
        package.parent = parent;
        package.children = {};
        package.types = {};
        return package;
    }

    /**
     * Converts name = NAME and kind = SyntaxKind.KIND to NAME:KIND
     */
    export function getKeyForNameAndKind(name: string, kind: SyntaxKind) {
        return name + ':' + kind;
    }

    /**
     * Checks for declared type literals with the same name and kind of the given typeDeclaration.
     */
    export function existsTypeDeclarationDuplicate(statement: TypeDeclaration, pkg: TypePackage) {
        return !!pkg.types[getKeyForNameAndKind(getDeclarationName(statement), statement.kind)];
    }

    export function getDeclarationName(decl: DeclarationStatement) {
        return decl && decl.name && decl.name.text ? decl.name.text : getModifierFlags(decl) & ModifierFlags.Default ? 'default' : '';
    }

}
