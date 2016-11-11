/* Copyright © Ben Mewburn ben@mewburn.id.au
 * Licensed under the MIT Licence.
 */

'use strict';

import { Token, Lexer, TokenType } from './lexer';

export class TokenIterator {

    private _tokens: Token[];
    private _pos: number;
    private _endToken: Token = {
        type: TokenType.T_EOF,
        text: null,
        mode: null,
        range: null
    };
    private _lastDocComment: Token;

    constructor(tokens: Token[]) {
        this._tokens = tokens;
        this._pos = 0;
    }

    get current() {
        return this._pos < this._tokens.length ? this._tokens[this._pos] : this._endToken;
    }

    get lastDocComment() {
        let t = this._lastDocComment;
        this._lastDocComment = null;
        return t;
    }

    next(): Token {
        let t = this._pos < this._tokens.length ? this._tokens[this._pos++] : this._endToken;
        if (t.type === '}') {
            this._lastDocComment = null;
        }
        if (this.shouldSkip(t)) {
            return this.next();
        }
        return t;
    }

    expectNext(tokenType: TokenType | string, pushToArray: Token[]) {
        let t = this.next();
        if (t.type === tokenType) {
            pushToArray.push(t);
            return true;
        } else {
            return false;
        }
    }

    expectCurrent(tokenType: TokenType | string, pushToArray: Token[]) {
        let t = this.current;
        if (t.type === tokenType) {
            pushToArray.push(t);
            return true;
        } else {
            return false;
        }
    }

    lookahead(n = 0) {
        let pos = this._pos + n;
        return pos < this._tokens.length ? this._tokens[pos] : this._endToken;
    }

    rewind() {
        this._pos = 0;
        this._lastDocComment = null;
    }

    private shouldSkip(t: Token) {
        return t.type === TokenType.T_WHITESPACE ||
            t.type === TokenType.T_COMMENT ||
            t.type === TokenType.T_DOC_COMMENT ||
            t.type === TokenType.T_OPEN_TAG ||
            t.type === TokenType.T_OPEN_TAG_WITH_ECHO ||
            t.type === TokenType.T_CLOSE_TAG;
    }

}

export enum NodeType {
    None = 0,
    TopStatementList,
    Namespace,
    NamespaceName,
    UseElement,
    UseList,
    UseGroup,
    MixedUseList,
    MixedUseGroup,
    HaltCompiler,
    ConstDeclarationList,
    ConstElement,
    DynamicVariable,
    ArrayDeclaration,
    UnaryOp,
    ArrayPair,
    Name,
    ParenthesisedExpression,
    Call,
    ArgumentList,
    Dimension,
    ClassConstant,
    StaticProperty,
    StaticMethodCall,
    MethodCall,
    Property,
    Closure,
    ParameterList,
    Parameter,
    ClosureUse,
    IssetList,
    Isset,
    Empty,
    Eval,
    Include,
    YieldFrom,
    Yield,
    Print,
    BackticksExpression,
    ComplexVariable,
    EncapsulatedVariableList,
    AnonymousClass,
    New,
    ClassExtends,
    Implements,
    InterfaceExtends,
    NameList,
    ClassStatementList,
    MemberModifierList,
    PropertyDeclaration,
    PropertyDeclarationList,
    ClassConstantDeclaration,
    ClassConstantDeclarationList,
    ReturnType,
    TypeExpression,
    ParenthesisedInnerStatementList,
    InnerStatementList,
    ExpressionStatement,
    FunctionDeclaration,
    MethodDeclaration,
    UseTrait,
    TraitAdaptationList,
    TraitAdaptation,
    MethodReference,
    TraitPrecendence,
    TraitAlias,
    ClassModifiers,
    ClassDeclaration,
    TraitDeclaration,
    InterfaceDeclaration,
    BinaryExpression,
    EncapsulatedVariable,
    Variable,
    ArrayElementList,
    ClosureUseVariable,
    ClosureUseList,
    List,
    Clone,
    Heredoc,
    DoubleQuotes,
    TopStatement,
    Statement,
    IfStatementList,
    IfStatement,
    WhileStatement,
    DoWhileStatement,
    ExpressionList,
    ForStatement,
    BreakStatement,
    ContinueStatement,
    ReturnStatement,
    GlobalVariableListStatement,
    StaticVariableListStatement,
    StaticVariable,
    EchoStatement,
    UnsetStatement,
    ThrowStatement,
    GotoStatement,
    LabelStatement,
    ForeachStatement
}

export interface NodeFactory<T> {
    (type: NodeType, children: (T | Token)[], doc?: Token, error?: ParseError): T;
}

export interface ParseError {
    unexpected: Token,
    expected: (TokenType | string)[],
    nodeTypes?: NodeType[]
}

enum Associativity {
    None,
    Left,
    Right
}

enum OpType {
    None = 0,
    Unary = 1,
    Binary = 2
}

var opPrecedenceMap: { [op: string]: [number, number, number] } = {
    'clone': [50, Associativity.None, OpType.Unary],
    'new': [50, Associativity.None, OpType.Unary],
    '[': [49, Associativity.Left, OpType.Unary],
    '**': [48, Associativity.Right, OpType.Binary],
    '++': [47, Associativity.Right, OpType.Unary],
    '--': [47, Associativity.Right, OpType.Unary],
    '@': [47, Associativity.Right, OpType.Unary],
    '~': [47, Associativity.Right, OpType.Unary],
    '(int)': [47, Associativity.Right, OpType.Unary],
    '(string)': [47, Associativity.Right, OpType.Unary],
    '(float)': [47, Associativity.Right, OpType.Unary],
    '(array)': [47, Associativity.Right, OpType.Unary],
    '(object)': [47, Associativity.Right, OpType.Unary],
    '(bool)': [47, Associativity.Right, OpType.Unary],
    'instanceof': [46, Associativity.None, OpType.Binary],
    '!': [45, Associativity.Right, OpType.Unary],
    '*': [44, Associativity.Left, OpType.Binary],
    '/': [44, Associativity.Left, OpType.Binary],
    '%': [44, Associativity.Left, OpType.Binary],
    '+': [43, Associativity.Left, OpType.Binary | OpType.Unary],
    '-': [43, Associativity.Left, OpType.Binary | OpType.Unary],
    '.': [43, Associativity.Left, OpType.Binary],
    '<<': [42, Associativity.Left, OpType.Binary],
    '>>': [42, Associativity.Left, OpType.Binary],
    '<': [41, Associativity.None, OpType.Binary],
    '>': [41, Associativity.None, OpType.Binary],
    '<=': [41, Associativity.None, OpType.Binary],
    '>=': [41, Associativity.None, OpType.Binary],
    '==': [40, Associativity.None, OpType.Binary],
    '===': [40, Associativity.None, OpType.Binary],
    '!=': [40, Associativity.None, OpType.Binary],
    '!==': [40, Associativity.None, OpType.Binary],
    '<>': [40, Associativity.None, OpType.Binary],
    '<=>': [40, Associativity.None, OpType.Binary],
    '&': [39, Associativity.Left, OpType.Binary | OpType.Unary],
    '^': [38, Associativity.Left, OpType.Binary],
    '|': [37, Associativity.Left, OpType.Binary],
    '&&': [36, Associativity.Left, OpType.Binary],
    '||': [35, Associativity.Left, OpType.Binary],
    '??': [34, Associativity.Right, OpType.Binary],
    '?:': [33, Associativity.Left, OpType.Binary],
    '=': [32, Associativity.Right, OpType.Binary],
    '.=': [32, Associativity.Right, OpType.Binary],
    '+=': [32, Associativity.Right, OpType.Binary],
    '-=': [32, Associativity.Right, OpType.Binary],
    '*=': [32, Associativity.Right, OpType.Binary],
    '/=': [32, Associativity.Right, OpType.Binary],
    '%=': [32, Associativity.Right, OpType.Binary],
    '**=': [32, Associativity.Right, OpType.Binary],
    '&=': [32, Associativity.Right, OpType.Binary],
    '|=': [32, Associativity.Right, OpType.Binary],
    '^=': [32, Associativity.Right, OpType.Binary],
    '<<=': [32, Associativity.Right, OpType.Binary],
    '>>=': [32, Associativity.Right, OpType.Binary],
    'and': [31, Associativity.Left, OpType.Binary],
    'xor': [30, Associativity.Left, OpType.Binary],
    'or': [29, Associativity.Left, OpType.Binary],
};

var reservedTokens: (TokenType | string)[] = [
    TokenType.T_INCLUDE, TokenType.T_INCLUDE_ONCE, TokenType.T_EVAL, TokenType.T_REQUIRE, TokenType.T_REQUIRE_ONCE,
    TokenType.T_LOGICAL_OR, TokenType.T_LOGICAL_XOR, TokenType.T_LOGICAL_AND,
    TokenType.T_INSTANCEOF, TokenType.T_NEW, TokenType.T_CLONE, TokenType.T_EXIT, TokenType.T_IF, TokenType.T_ELSEIF,
    TokenType.T_ELSE, TokenType.T_ENDIF, TokenType.T_ECHO, TokenType.T_DO, TokenType.T_WHILE, TokenType.T_ENDWHILE,
    TokenType.T_FOR, TokenType.T_ENDFOR, TokenType.T_FOREACH, TokenType.T_ENDFOREACH, TokenType.T_DECLARE,
    TokenType.T_ENDDECLARE, TokenType.T_AS, TokenType.T_TRY, TokenType.T_CATCH, TokenType.T_FINALLY,
    TokenType.T_THROW, TokenType.T_USE, TokenType.T_INSTEADOF, TokenType.T_GLOBAL, TokenType.T_VAR, TokenType.T_UNSET,
    TokenType.T_ISSET, TokenType.T_EMPTY, TokenType.T_CONTINUE, TokenType.T_GOTO,
    TokenType.T_FUNCTION, TokenType.T_CONST, TokenType.T_RETURN, TokenType.T_PRINT, TokenType.T_YIELD, TokenType.T_LIST,
    TokenType.T_SWITCH, TokenType.T_ENDSWITCH, TokenType.T_CASE, TokenType.T_DEFAULT, TokenType.T_BREAK,
    TokenType.T_ARRAY, TokenType.T_CALLABLE, TokenType.T_EXTENDS, TokenType.T_IMPLEMENTS, TokenType.T_NAMESPACE, TokenType.T_TRAIT,
    TokenType.T_INTERFACE, TokenType.T_CLASS, TokenType.T_CLASS_C, TokenType.T_TRAIT_C, TokenType.T_FUNC_C, TokenType.T_METHOD_C,
    TokenType.T_LINE, TokenType.T_FILE, TokenType.T_DIR, TokenType.T_NS_C
];

var semiReservedTokens: (TokenType | string)[] = [
    TokenType.T_STATIC, TokenType.T_ABSTRACT, TokenType.T_FINAL, TokenType.T_PRIVATE, TokenType.T_PROTECTED, TokenType.T_PUBLIC
];

export class Parser<T> {

    private _lexer: Lexer;
    private _nodeFactory: NodeFactory<T>;
    private _errors: ParseError[];
    private _opPrecedenceMap = opPrecedenceMap;
    private _reserved = reservedTokens;
    private _semiReserved = semiReservedTokens;

    constructor(lexer: Lexer, nodeFactory: NodeFactory<T>) {
        this._lexer = lexer;
        this._nodeFactory = nodeFactory;
    }

    get errors() {
        return this._errors;
    }

    hasErrors() {
        return this._errors.length !== 0;
    }

    private isReserved(t: Token) {
        return this._reserved.indexOf(t.type) !== -1;
    }

    private isSemiReserved(t: Token) {
        return this._semiReserved.indexOf(t.type) !== -1 || this.isReserved(t);
    }

    private topStatementList(toks: TokenIterator, stopOnTokenTypeArray: (TokenType | string)[]) {

        let children: (T | Token)[] = [];
        stopOnTokenTypeArray.push(TokenType.T_EOF);

        while (true) {

            if (stopOnTokenTypeArray.indexOf(toks.current.type) !== -1) {
                break;
            }

            children.push(this.topStatement(toks));

        }

        return this._nodeFactory(NodeType.TopStatementList, children);

    }

    private topStatement(toks: TokenIterator) {

        let lookForSemiColon = true;
        let children: (T | Token)[] = [];
        let t = toks.current;

        switch (t.type) {
            case TokenType.T_NAMESPACE:
                let isEmpty = { isEmpty: false };
                children.push(this.namespace(toks, isEmpty));
                lookForSemiColon = isEmpty.isEmpty;
                break;
            case TokenType.T_USE:
                children.push(this.use(toks));
                break;
            case TokenType.T_HALT_COMPILER:
                children.push(this.haltCompiler(toks));
                break;
            case TokenType.T_CONST:
                children.push(this.constDeclarationList(toks));
                break;
            case TokenType.T_FUNCTION:
                children.push(this.functionDeclaration(toks));
                lookForSemiColon = false;
                break;
            case TokenType.T_CLASS:
            case TokenType.T_ABSTRACT:
            case TokenType.T_FINAL:
                children.push(this.classDeclaration(toks));
                lookForSemiColon = false;
                break;
            case TokenType.T_TRAIT:
                children.push(this.traitDeclaration(toks));
                lookForSemiColon = false;
                break;
            case TokenType.T_INTERFACE:
                children.push(this.interfaceDeclaration(toks));
                lookForSemiColon = false;
                break;
            default:
                if (this.isStatementToken(toks.current)) {
                    children.push(this.statement(toks));
                    lookForSemiColon = false;
                } else {
                    //error
                }
                break;
        }

        if (lookForSemiColon) {
            if (toks.current.type !== ';') {
                //error
            }
            children.push(t);
            toks.next();
        }

        return this._nodeFactory(NodeType.TopStatement, children);

    }

    private isStatementToken(t: Token) {
        return true;
    }

    private constDeclarationList(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];

        while (true) {

            children.push(this.constElement(toks));
            if (toks.current.type !== ',') {
                break;
            }
            children.push(toks.current);
            toks.next();
        }

        return this._nodeFactory(NodeType.ConstDeclarationList, children);

    }

    private constElement(toks: TokenIterator) {

        let children: (T | Token)[] = [];
        let doc = toks.lastDocComment;

        if (toks.current.type !== TokenType.T_CONST) {
            //error
        }

        children.push(toks.current);

        if (toks.next().type !== '=') {
            //error
        }

        children.push(toks.current);
        children.push(this.expression(toks));

        if (toks.current.type !== ';') {
            //error
        }

        children.push(toks.current);
        toks.next();

        return this._nodeFactory(NodeType.ConstElement, children, doc);

    }

    private expression(toks: TokenIterator, minPrecedence = 0) {

        let lhs = this.atom(toks);
        let precedence: number;
        let associativity: Associativity;
        let op: Token;
        let rhs: T | Token;

        while (true) {

            op = toks.current;

            if (!this.isBinaryOp(op)) {
                break;
            }

            [precedence, associativity] = this._opPrecedenceMap[op.text];

            if (precedence < minPrecedence) {
                break;
            }

            if (associativity === Associativity.Left) {
                ++precedence;
            }

            toks.next();
            rhs = this.expression(toks, precedence);
            lhs = this._nodeFactory(NodeType.BinaryExpression, [lhs, op, rhs]);

        }

        return lhs;


    }

    private atom(toks: TokenIterator) {

        switch (toks.current.type) {
            case TokenType.T_VARIABLE:
            case '$':
            case TokenType.T_ARRAY:
            case '[':
            case TokenType.T_CONSTANT_ENCAPSED_STRING:
            case TokenType.T_NS_SEPARATOR:
            case TokenType.T_STRING:
            case TokenType.T_NAMESPACE:
            case '(':
                return this.variable(toks);
            case TokenType.T_STATIC:
                if (toks.lookahead().type === TokenType.T_FUNCTION) {
                    return this.closure(toks);
                } else {
                    return this.variable(toks);
                }
            case TokenType.T_INC:
            case TokenType.T_DEC:
            case '+':
            case '-':
            case '!':
            case '~':
            case '@':
            case TokenType.T_INT_CAST:
            case TokenType.T_DOUBLE_CAST:
            case TokenType.T_STRING_CAST:
            case TokenType.T_ARRAY_CAST:
            case TokenType.T_OBJECT_CAST:
            case TokenType.T_BOOL_CAST:
            case TokenType.T_UNSET_CAST:
                return this.unaryExpression(toks);
            case TokenType.T_LIST:
                return this.listAssignment(toks);
            case TokenType.T_CLONE:
                return this.cloneExpression(toks);
            case TokenType.T_NEW:
                return this.newExpression(toks);
            case TokenType.T_DNUMBER:
            case TokenType.T_LNUMBER:
            case TokenType.T_LINE:
            case TokenType.T_FILE:
            case TokenType.T_DIR:
            case TokenType.T_TRAIT_C:
            case TokenType.T_METHOD_C:
            case TokenType.T_FUNC_C:
            case TokenType.T_NS_C:
            case TokenType.T_CLASS_C:
                return toks.current;
            case TokenType.T_START_HEREDOC:
                return this.heredoc(toks);
            case '"':
                return this.doubleQuotesExpression(toks);
            case '`':
                return this.backticksExpression(toks);
            case TokenType.T_PRINT:
                return this.printExpression(toks);
            case TokenType.T_YIELD:
                return this.yieldExpression(toks);
            case TokenType.T_YIELD_FROM:
                return this.yieldFromExpression(toks);
            case TokenType.T_FUNCTION:
                return this.closure(toks);
            case TokenType.T_INCLUDE:
            case TokenType.T_INCLUDE_ONCE:
            case TokenType.T_REQUIRE:
            case TokenType.T_REQUIRE_ONCE:
                return this.includeExpression(toks);
            case TokenType.T_EVAL:
                return this.evalExpression(toks);
            case TokenType.T_EMPTY:
                return this.emptyExpression(toks);
            case TokenType.T_ISSET:
                return this.issetExpression(toks);
            default:
                //error
                break;
        }

    }

    private issetExpression(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];

        if (toks.next().type !== '(') {
            //error
        }

        children.push(toks.current);
        toks.next();

        while (true) {

            children.push(this.expression(toks));
            if (toks.current.type !== ',') {
                break;
            }

            children.push(toks.current);
        }

        if (toks.current.type !== ')') {
            //error
        }

        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.Isset, children);

    }

    private emptyExpression(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];

        if (toks.next().type !== '(') {
            //error
        }

        children.push(toks.current);
        toks.next();
        children.push(this.expression(toks));

        if (toks.current.type !== ')') {
            //error
        }

        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.Empty, children);

    }

    private evalExpression(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];

        if (toks.next().type !== '(') {
            //error
        }

        children.push(toks.current);
        toks.next();
        children.push(this.expression(toks));

        if (toks.current.type !== ')') {
            //error
        }

        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.Eval, children);

    }

    private includeExpression(toks: TokenIterator) {

        return this.keywordExpression(NodeType.Include, toks);

    }

    private yieldFromExpression(toks: TokenIterator) {

        return this.keywordExpression(NodeType.YieldFrom, toks);

    }

    private keywordExpression(nodeType: NodeType, toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        toks.next();
        children.push(this.expression(toks));
        return this._nodeFactory(nodeType, children);
    }

    private isExpressionStartToken(t: Token) {

    }

    private yieldExpression(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];

        if (!this.isExpressionStartToken(toks.next())) {
            return this._nodeFactory(NodeType.Yield, children);
        }

        children.push(this.expression(toks));

        if (toks.current.type !== TokenType.T_DOUBLE_ARROW) {
            return this._nodeFactory(NodeType.Yield, children);
        }

        children.push(toks.current);
        toks.next();
        children.push(this.expression(toks));
        return this._nodeFactory(NodeType.Yield, children);

    }

    private printExpression(toks: TokenIterator) {

        return this.keywordExpression(NodeType.Print, toks);

    }

    private doubleQuotesExpression(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        toks.next();
        children.push(this.encapsulatedVariableList(toks));
        if (toks.current.type !== '"') {
            //error
        }
        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.DoubleQuotes, children);

    }

    private backticksExpression(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        toks.next();
        children.push(this.encapsulatedVariableList(toks));

        if (toks.current.type !== '`') {
            //error
        }

        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.BackticksExpression, children);
    }

    private encapsulatedVariableList(toks: TokenIterator) {

        let children: (T | Token)[] = [];

        while (true) {

            switch (toks.current.type) {
                case TokenType.T_ENCAPSED_AND_WHITESPACE:
                    children.push(toks.current);
                    toks.next();
                    continue;
                case TokenType.T_VARIABLE:
                    if (toks.lookahead().type === '[') {
                        children.push(this.encapsulatedDimension(toks));
                    } else if (toks.lookahead().type === TokenType.T_OBJECT_OPERATOR) {
                        children.push(this.encapsulatedProperty(toks));
                    } else {
                        children.push(this._nodeFactory(NodeType.EncapsulatedVariable, [this._nodeFactory(NodeType.Variable, [toks.current])]));
                        toks.next();
                    }
                    continue;
                case TokenType.T_DOLLAR_OPEN_CURLY_BRACES:
                    children.push(this.dollarCurlyOpenEncapsulatedVariable(toks));
                    continue;
                case TokenType.T_CURLY_OPEN:
                    children.push(this.curlyOpenEncapsulatedVariable(toks));
                    continue;
                default:
                    break;
            }

            break;

        }

        return this._nodeFactory(NodeType.EncapsulatedVariableList, children);

    }

    private curlyOpenEncapsulatedVariable(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current, this.variable(toks)];

        if (toks.current.type !== '}') {
            //error
        }

        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.EncapsulatedVariable, children);

    }

    private dollarCurlyOpenEncapsulatedVariable(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];

        if (toks.next().type === TokenType.T_STRING_VARNAME) {

            if (toks.lookahead().type === '[') {

                let dimChildren: (T | Token)[] = [this._nodeFactory(NodeType.Variable, [toks.current]), toks.next(), this.expression(toks)];
                if (toks.current.type !== ']') {
                    //error
                }
                dimChildren.push(toks.current);
                children.push(this._nodeFactory(NodeType.Dimension, dimChildren));
            } else {
                children.push(this._nodeFactory(NodeType.Variable, [toks.current]));
            }

            toks.next();

        } else {
            children.push(this.expression(toks));
        }

        if (toks.current.type !== '}') {
            //error
        }
        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.EncapsulatedVariable, children);

    }

    private encapsulatedDimension(toks: TokenIterator) {

        let children: (T | Token)[] = [this._nodeFactory(NodeType.Variable, [toks.current]), toks.next()];

        switch (toks.next().type) {
            case TokenType.T_STRING:
            case TokenType.T_NUM_STRING:
                children.push(toks.current);
                break;
            case TokenType.T_VARIABLE:
                children.push(this._nodeFactory(NodeType.Variable, [toks.current]));
                break;
            case '-':
                let unaryNodeChildren = [toks.current];
                if (toks.next().type !== TokenType.T_NUM_STRING) {
                    //error
                }
                unaryNodeChildren.push(toks.current);
                children.push(this._nodeFactory(NodeType.UnaryOp, unaryNodeChildren));
                break;
            default:
                //error
                break;
        }

        if (toks.next().type !== ']') {
            //error
        }

        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.EncapsulatedVariable, [this._nodeFactory(NodeType.Dimension, children)]);

    }

    private encapsulatedProperty(toks: TokenIterator) {
        let children: (T | Token)[] = [this._nodeFactory(NodeType.Variable, [toks.current]), toks.next()];

        if (toks.next().type !== TokenType.T_STRING) {
            //error
        }

        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.EncapsulatedVariable, [this._nodeFactory(NodeType.Property, children)]);
    }

    private heredoc(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        toks.next();
        children.push(this.encapsulatedVariableList(toks));
        if (toks.current.type !== TokenType.T_END_HEREDOC) {
            //error
        }
        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.Heredoc, children);

    }

    private anonymousClassDeclaration(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        let doc = toks.lastDocComment;
        let t = toks.next();

        if (doc) {
            children.unshift(doc);
        }

        if (t.type === '(') {
            children.push(this.argumentList(toks));
            t = toks.current;
        }

        if (t.type === TokenType.T_EXTENDS) {
            children.push(this.extendsClass(toks));
            t = toks.current;
        }

        if (t.type === TokenType.T_IMPLEMENTS) {
            children.push(this.implementsInterfaces(toks));
            t = toks.current;
        }

        children.push(this.classStatementList(toks));
        return this._nodeFactory(NodeType.AnonymousClass, children);

    }

    private classStatementList(toks: TokenIterator) {

        let t = toks.current;
        let children: (T | Token)[] = [];

        if (t.type !== '{') {
            //error
        }

        children.push(t);
        t = toks.next();

        while (true) {

            if (t.type === '}' || t.type === TokenType.T_EOF) {
                break;
            }

            children.push(this.classStatement(toks));
            t = toks.current;
        }

        if (t.type !== '}') {
            //error
        }

        children.push(t);
        toks.next();

        return this._nodeFactory(NodeType.ClassStatementList, children);

    }

    private classStatement(toks: TokenIterator) {

        let t = toks.current;

        switch (t.type) {
            case TokenType.T_PUBLIC:
            case TokenType.T_PROTECTED:
            case TokenType.T_PRIVATE:
            case TokenType.T_STATIC:
            case TokenType.T_ABSTRACT:
            case TokenType.T_FINAL:
                let modifierList = this.memberModifierList(toks);
                t = toks.current;
                if (t.type === TokenType.T_VARIABLE) {
                    return this.propertyDeclarationList(toks, modifierList);
                } else if (t.type === TokenType.T_FUNCTION) {
                    return this.methodDeclaration(toks, modifierList);
                } else if (t.type === TokenType.T_CONST) {
                    return this.classConstantDeclarationList(toks, modifierList);
                } else {
                    //error
                }
            case TokenType.T_FUNCTION:
                return this.methodDeclaration(toks);
            case TokenType.T_VAR:
                toks.next();
                return this.propertyDeclarationList(toks, t);
            case TokenType.T_CONST:
                return this.classConstantDeclarationList(toks);
            case TokenType.T_USE:
                return this.useTrait(toks);
            default:
                //error
                break;

        }

    }

    private useTrait(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        let t = toks.next();

        children.push(this.nameList(toks));
        t = toks.current;

        if (t.type === ';') {
            children.push(t);
            toks.next();
            return this._nodeFactory(NodeType.UseTrait, children);
        }

        if (t.type !== '{') {
            //error
        }

        children.push(this.traitAdaptationList(toks));
        return this._nodeFactory(NodeType.TraitAdaptationList, children);

    }

    private traitAdaptationList(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        let t = toks.next();

        while (true) {
            if (t.type === '}' || t.type === TokenType.T_EOF) {
                break;
            }
            children.push(this.traitAdaptation(toks));
            t = toks.current;
        }

        if (t.type !== '}') {
            //error
        }

        children.push(t);
        toks.next();
        return this._nodeFactory(NodeType.TraitAdaptationList, children);
    }

    private traitAdaptation(toks: TokenIterator) {

        let t = toks.current;
        let methodRefOrIdent: T | Token;
        let t2 = toks.lookahead();

        if (t.type === TokenType.T_NAMESPACE ||
            t.type === TokenType.T_NS_SEPARATOR ||
            (t.type === TokenType.T_STRING &&
                (t2.type === TokenType.T_PAAMAYIM_NEKUDOTAYIM || t2.type === TokenType.T_NS_SEPARATOR))) {

            methodRefOrIdent = this.methodReference(toks);

            if (t.type === TokenType.T_INSTEADOF) {
                return this.traitPrecedence(toks, methodRefOrIdent);
            }

        } else if (t.type === TokenType.T_STRING || this.isSemiReserved(t)) {
            methodRefOrIdent = t;
            toks.next();
        } else {
            //error
        }

        return this.traitAlias(toks, methodRefOrIdent);


    }

    private traitAlias(toks: TokenIterator, methodReferenceOrIdentifier: T | Token) {
        let t = toks.current;
        let children: (T | Token)[] = [methodReferenceOrIdentifier];

        if (t.type !== TokenType.T_AS) {
            //error
        }

        children.push(t);
        t = toks.next();

        if (t.type === TokenType.T_STRING || this.isReserved(t)) {
            children.push(t);
            t = toks.next();
        } else if (t.type === TokenType.T_PUBLIC || t.type === TokenType.T_PROTECTED || t.type === TokenType.T_PRIVATE) {
            children.push(t);
            t = toks.next();
            if (t.type === TokenType.T_STRING || this.isSemiReserved(t)) {
                children.push(t);
                t = toks.next();
            }
        } else {
            //error
        }

        if (t.type !== ';') {
            //error
        }

        children.push(t);
        toks.next();
        return this._nodeFactory(NodeType.TraitAlias, children);
    }

    private traitPrecedence(toks: TokenIterator, methodReference: T) {

        let children: (T | Token)[] = [methodReference, toks.current];
        toks.next();
        children.push(this.nameList(toks));
        let t = toks.current;

        if (t.type !== ';') {
            //error
        }

        children.push(t);
        toks.next();
        return this._nodeFactory(NodeType.TraitPrecendence, children);

    }

    private methodReference(toks: TokenIterator) {

        let t = toks.current;
        let children: (T | Token)[] = [];

        children.push(this.name(toks));
        t = toks.current;

        if (t.type !== TokenType.T_PAAMAYIM_NEKUDOTAYIM) {
            //error
        }

        children.push(t);
        t = toks.next();

        if (t.type !== TokenType.T_STRING || !this.isSemiReserved(t)) {
            //error
        }

        children.push(t);
        toks.next();
        return this._nodeFactory(NodeType.MethodReference, children);

    }

    private methodDeclaration(toks: TokenIterator, modifiers: T = null) {

        let t = toks.current;
        let children: (T | Token)[] = [];
        let doc = toks.lastDocComment;

        if (modifiers) {
            children.push(modifiers);
        }

        children.push(t);
        t = toks.next();

        if (t.type === '&') {
            children.push(t);
            t = toks.next();
        }

        if (t.type !== TokenType.T_STRING && !this.isSemiReserved(t)) {
            //error
        }

        children.push(t);
        t = toks.next();
        children.push(this.parameterList(toks));
        t = toks.current;

        if (t.type === ':') {
            children.push(this.returnType(toks));
            t = toks.current;
        }

        children.push(this.parenthesisedInnerStatementList(toks));
        return this._nodeFactory(NodeType.MethodDeclaration, children);

    }

    private parenthesisedInnerStatementList(toks: TokenIterator) {

        let t = toks.current;
        let children: (T | Token)[] = [];

        if (t.type !== '{') {
            //error
        }

        children.push(t);
        children.push(this.innerStatementList(toks, [TokenType.T_EOF, '}']));
        t = toks.current;

        if (t.type !== '}') {
            //error
        }

        children.push(t);
        return this._nodeFactory(NodeType.ParenthesisedInnerStatementList, children);

    }

    private innerStatementList(toks: TokenIterator, stopTokenTypeArray: (TokenType | string)[]) {

        let children: (T | Token)[] = [];

        while (true) {
            if (stopTokenTypeArray.indexOf(toks.current.type) !== -1) {
                break;
            }
            children.push(this.innerStatement(toks));
        }

        return this._nodeFactory(NodeType.InnerStatementList, children);
    }

    private innerStatement(toks: TokenIterator) {

        let t = toks.current;

        switch (t.type) {
            case TokenType.T_FUNCTION:
                return this.functionDeclaration(toks);
            case TokenType.T_ABSTRACT:
            case TokenType.T_FINAL:
            case TokenType.T_CLASS:
                return this.classDeclaration(toks);
            case TokenType.T_TRAIT:
                return this.traitDeclaration(toks);
            case TokenType.T_INTERFACE:
                return this.interfaceDeclaration(toks);
            default:
                return this.statement(toks);
        }

    }

    private interfaceDeclaration(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        let doc = toks.lastDocComment;
        let t = toks.next();

        if (t.type !== TokenType.T_STRING) {
            //error
        }

        children.push(t);
        t = toks.next();

        if (t.type === TokenType.T_EXTENDS) {
            children.push(this.extendsInterface(toks));
        }

        children.push(this.classStatementList(toks));
        return this._nodeFactory(NodeType.InterfaceDeclaration, children, doc);

    }

    private extendsInterface(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        toks.next();
        children.push(this.nameList(toks));
        return this._nodeFactory(NodeType.InterfaceExtends, children);

    }

    private traitDeclaration(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        let doc = toks.lastDocComment;
        let t = toks.next();

        if (t.type !== TokenType.T_STRING) {
            //error
        }

        children.push(t);
        toks.next();
        children.push(this.classStatementList(toks));
        return this._nodeFactory(NodeType.TraitDeclaration, children, doc);

    }

    private functionDeclaration(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        let doc = toks.lastDocComment;
        let t = toks.next();

        if (t.type === '&') {
            children.push(t);
            t = toks.next();
        }

        if (t.type !== TokenType.T_STRING) {
            //error
        }

        children.push(t);
        children.push(this.parameterList(toks));
        t = toks.current;

        if (t.type === ':') {
            children.push(this.returnType(toks));
            t = toks.current;
        }

        children.push(this.parenthesisedInnerStatementList(toks));
        return this._nodeFactory(NodeType.FunctionDeclaration, children);

    }

    private classDeclaration(toks: TokenIterator) {

        let t = toks.current;
        let children: (T | Token)[] = [];
        let doc = toks.lastDocComment;

        if (t.type === TokenType.T_ABSTRACT || t.type === TokenType.T_FINAL) {
            children.push(this.classModifiers(toks));
        }

        t = toks.current;
        if (t.type !== TokenType.T_CLASS) {
            //error
        }
        children.push(t);
        t = toks.next();

        if (t.type !== TokenType.T_STRING) {
            //error
        }

        children.push(t);
        t = toks.next();

        if (t.type === TokenType.T_EXTENDS) {
            children.push(this.extendsClass(toks));
            t = toks.current;
        }

        if (t.type === TokenType.T_IMPLEMENTS) {
            children.push(this.implementsInterfaces(toks));
            t = toks.current;
        }

        children.push(this.classStatementList(toks));
        return this._nodeFactory(NodeType.ClassDeclaration, children, doc);

    }

    private classModifiers(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        let t = toks.next();

        while (true) {
            if (t.type !== TokenType.T_ABSTRACT && t.type !== TokenType.T_FINAL) {
                break;
            }
            children.push(t);
            t = toks.next();
        }

        return this._nodeFactory(NodeType.ClassModifiers, children);

    }

    private statement(toks: TokenIterator) {

        let t = toks.current;

        switch (t.type) {
            case '{':
                let children: (T | Token)[] = [t];
                toks.next();
                children.push(this.innerStatementList(toks, [TokenType.T_EOF, '}']));
                t = toks.current;

                if (t.type !== '}') {
                    //error
                }

                children.push(t);
                toks.next();
                return this._nodeFactory(NodeType.Statement, children);
            case TokenType.T_IF:
                return this.ifStatementList(toks);
            case TokenType.T_WHILE:
                return this.whileStatement(toks);
            case TokenType.T_DO:
                return this.doWhileStatement(toks);
            case TokenType.T_FOR:
                return this.forStatement(toks);
            case TokenType.T_SWITCH:
                return this.switchStatement(toks);
            case TokenType.T_BREAK:
                return this.keywordOptionalExpressionStatement(toks, NodeType.BreakStatement);
            case TokenType.T_CONTINUE:
                return this.keywordOptionalExpressionStatement(toks, NodeType.ContinueStatement);
            case TokenType.T_RETURN:
                return this.keywordOptionalExpressionStatement(toks, NodeType.ReturnStatement);
            case TokenType.T_GLOBAL:
                return this.globalVarList(toks);
            case TokenType.T_STATIC:
                return this.staticVarList(toks);
            case TokenType.T_ECHO:
                return this.echoExpressionList(toks);
            case TokenType.T_INLINE_HTML:
                return t;
            case TokenType.T_UNSET:
                return this.unsetVarList(toks);
            case TokenType.T_FOREACH:
                return this.foreachStatement(toks);
            case TokenType.T_DECLARE:
                return this.declareStatement(toks);
            case TokenType.T_TRY:
                return this.tryBlock(toks);
            case TokenType.T_THROW:
                return this.throwStatement(toks);
            case TokenType.T_GOTO:
                return this.gotoStatement(toks);
            case TokenType.T_STRING:
                return this.labelStatement(toks);
            case ';':
                toks.next();
                return this._nodeFactory(NodeType.Statement, [t]);
            default:
                if (this.isExpressionStartToken(t)) {
                    let children: (T | Token)[] = [this.expression(toks)];
                    let t = toks.current;

                    if (t.type !== ';') {
                        //error
                    }

                    children.push(t);
                    toks.next();
                    return this._nodeFactory(NodeType.Statement, children);
                } else {
                    //error
                }

        }

    }

    private switchStatement(toks:TokenIterator){

        let children:(T|Token)[] = [toks.current];

        


    }

    private labelStatement(toks:TokenIterator){

        let children:(T|Token)[]  =[toks.current];
        if(!toks.expectNext(':', children)){
            //error
        }
        toks.next();
        return this._nodeFactory(NodeType.LabelStatement, children);

    }

    private gotoStatement(toks:TokenIterator){

        let children:(T|Token)[] = [toks.current];

        if(!toks.expectNext(TokenType.T_STRING, children)){
            //error
        }

        if(!toks.expectNext(';', children)){
            //error
        }

        toks.next();
        return this._nodeFactory(NodeType.GotoStatement, children);

    }

    private throwStatement(toks:TokenIterator){

        let children:(T|Token)[] = [toks.current];
        toks.next();
        children.push(this.expression(toks));
        
        if(!toks.expectCurrent(';', children)){
            //error
        }
        toks.next();

        return this._nodeFactory(NodeType.ThrowStatement, children);
    }

    private foreachStatement(toks:TokenIterator){

        let children:(T|Token)[] = [toks.current];

        if(!toks.expectNext('(', children)){
            //error
        }
        toks.next();
        children.push(this.expression(toks));
        if(!toks.expectCurrent(TokenType.T_AS, children)){
            //error
        }
        toks.next();
        children.push(this.foreachVariable(toks));

        if(toks.current.type === TokenType.T_DOUBLE_ARROW){
            children.push(toks.current);
            toks.next();
            children.push(this.foreachVariable(toks));
        }

        if(!toks.expectCurrent(')', children)){
            //error
        }


        if(toks.next().type === ':'){

            children.push(toks.current);
            toks.next();
            children.push(this.innerStatementList(toks, [TokenType.T_ENDFOREACH]));

            if(!toks.expectCurrent(TokenType.T_ENDFOREACH, children)){
                //error
            }

            if(!toks.expectNext(';', children)){
                //error
            }

            toks.next();

        } else if(this.isStatementToken(toks.current)) {
            children.push(this.statement(toks));
        } else {
            //error
        }

        return this._nodeFactory(NodeType.ForeachStatement, children);


    }

    private foreachVariable(toks:TokenIterator){

        let t = toks.current;
        switch(t.type){

            case '&':
                toks.next();
                return this._nodeFactory(NodeType.UnaryOp, [t, this.variable(toks)]);
            case TokenType.T_LIST:
                return this.listAssignment(toks);
            case '[':
                return this.shortArray(toks);
            default:
                if(this.isVariableStartToken(t)){
                    return this.variable(toks);
                } else {
                    //error
                }

        }

    }

    private isVariableStartToken(t:Token){

    }

    private unsetVarList(toks:TokenIterator){

        let children:(T|Token)[] = [toks.current];
        
        if(!toks.expectNext('(', <Token[]>children)){
            //error
        }
        
        while(true){

            children.push(this.variable(toks));
            if(toks.current.type !== ','){
                break;
            }
            children.push(toks.current);
            toks.next();

        }

        if(!toks.expectCurrent(')', children)){
            //error
        }

        if(!toks.expectNext(';', children)){
            //error
        }

        return this._nodeFactory(NodeType.UnsetStatement, children);

    }

    private echoExpressionList(toks:TokenIterator){

       let children:(T|Token)[] = [toks.current];
        let t = toks.next();

        while(true){

            children.push(this.expression(toks));
            if(toks.current.type !== ','){
                break;
            }
            children.push(toks.current);
            toks.next();

        }

        if(toks.current.type !== ';'){
            //error
        }
        children.push(toks.current);
        toks.next();

        return this._nodeFactory(NodeType.EchoStatement, children);

    }

    private staticVarList(toks:TokenIterator){

        let children:(T|Token)[] = [toks.current];
        let t = toks.next();

        while(true){

            children.push(this.staticVariable(toks));
            if(toks.current.type !== ','){
                break;
            }
            children.push(toks.current);
            toks.next();

        }

        if(toks.current.type !== ';'){
            //error
        }
        children.push(toks.current);
        toks.next();

        return this._nodeFactory(NodeType.StaticVariableListStatement, children);

    }



    private globalVarList(toks:TokenIterator){

        let children:(T|Token)[] = [toks.current];
        let t = toks.next();

        while(true){

            children.push(this.simpleVariable(toks));
            if(toks.current.type !== ','){
                break;
            }
            children.push(toks.current);
            toks.next();

        }

        if(toks.current.type !== ';'){
            //error
        }
        children.push(toks.current);
        toks.next();

        return this._nodeFactory(NodeType.GlobalVariableListStatement, children);

    }

    private staticVariable(toks:TokenIterator){

        let children:(T|Token)[] = [toks.current];

        if(toks.next().type !== '='){
            return this._nodeFactory(NodeType.StaticVariable, children);
        }

        children.push(toks.current);
        toks.next();
        children.push(this.expression(toks));
        return this._nodeFactory(NodeType.StaticVariable, children);

    }

    private keywordOptionalExpressionStatement(toks:TokenIterator, nodeType:NodeType){
        let children:(T|Token)[] = [toks.current];
        let t = toks.current;

        if(t.type !== ';' && this.isExpressionStartToken(t)){
            if(this.isExpressionStartToken(t)){
                children.push(this.expression(toks));
                t = toks.current;
            } else {
                //error
            }
        }

        if(t.type !== ';'){
            //error
        }

        children.push(t);
        toks.next();
        return this._nodeFactory(nodeType, children);
    }

    private isExpressionStartToken(t: Token) {

    }

    private forStatement(toks:TokenIterator){

        let children:(T|Token)[] = [toks.current];
        let t = toks.next();

        if(t.type !== '('){
            //error
        }

        children.push(t);
        t = toks.next();

        for(let n = 0; n < 2; ++n){
            if(t.type !== ';' && this.isExpressionStartToken(t)) {
                children.push(this.expressionList(toks));
                t = toks.current;
            }

            if(t.type !== ';'){
                //error
            }

            children.push(t);
            t = toks.next();
        }

        if(t.type !== ')' && this.isExpressionStartToken(t)){
            children.push(this.expression(toks));
            t = toks.current;
        }

        if(t.type !== ')'){
            //error
        }

        children.push(t);
        t = toks.next();

        if(t.type === ':'){
            children.push(t);
            t = toks.next();
            children.push(this.innerStatementList(toks, [TokenType.T_ENDFOR]));
            t = toks.current;
            if(t.type !== TokenType.T_ENDFOR){
                //error
            }
            children.push(t);
            t = toks.next();
            if(t.type !== ';'){
                //error
            }
            children.push(t);
            t = toks.next();
        } else if(this.isStatementToken(t)){
            children.push(this.statement(toks))
        } else {
            //error
        }

        return this._nodeFactory(NodeType.ForStatement, children);



    }

    private expressionList(toks:TokenIterator){

        let children:(T|Token)[] = [];

        while(true){
            children.push(this.expression(toks));
            if(toks.current.type !== ','){
                break;
            }
            children.push(toks.current);
            toks.next();
        }

        return this._nodeFactory(NodeType.ExpressionList, children);

    }

    private doWhileStatement(toks:TokenIterator){

        let children: (T | Token)[] = [toks.current];
        let t = toks.next();

        children.push(this.statement(toks));
        t = toks.current;

        if(t.type !== TokenType.T_WHILE){
            //error
        }

        children.push(t);
        t = toks.next();
        if(t.type !== '('){
            //error
        }
        children.push(t);
        t = toks.next();
        children.push(this.expression(toks));
        t = toks.current;
        if(t.type !== ')'){
            //error
        }
        children.push(t);
        t = toks.next();
        if(t.type !== ';'){
            //error
        }
        children.push(t);
        toks.next();
        return this._nodeFactory(NodeType.DoWhileStatement, children);

    }

    private whileStatement(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        let t = toks.next();

        if (t.type !== '(') {
            //error
        }

        children.push(t);
        t = toks.next();
        children.push(this.expression(toks));

        t = toks.current;
        if (t.type !== ')') {
            //error
        }

        children.push(t);
        t = toks.next();

        if (t.type === ':') {
            children.push(t);
            toks.next();
            children.push(this.innerStatementList(toks, [TokenType.T_ENDWHILE]));
            t = toks.current;
            if (t.type !== TokenType.T_ENDWHILE) {
                //error
            }
            children.push(t);
            t = toks.next();
            if (t.type !== ';') {
                //error
            }
            children.push(t);
            toks.next();
        } else {
            children.push(this.statement(toks));
        }

        return this._nodeFactory(NodeType.WhileStatement, children);

    }

    private ifStatementList(toks: TokenIterator) {

        let children: (T | Token)[] = [];
        let t = toks.current;
        let discoverAlt = { isAlt: false };

        children.push(this.ifStatement(toks, false, discoverAlt));
        t = toks.current;

        while (true) {

            if (t.type !== TokenType.T_ELSEIF) {
                break;
            }

            children.push(this.ifStatement(toks, discoverAlt.isAlt));
            t = toks.current;

        }

        if (t.type === TokenType.T_ELSE) {
            children.push(this.ifStatement(toks, discoverAlt.isAlt));
            t = toks.current;
        }

        if (discoverAlt.isAlt) {

            if (t.type !== TokenType.T_ENDIF) {
                //error
            }

            let endIfchildren: (T | Token)[] = [t];
            t = toks.next();
            if (t.type !== ';') {
                //error
            }
            endIfchildren.push(t);
            toks.next();
            children.push(this._nodeFactory(NodeType.IfStatement, endIfchildren));
        }

        return this._nodeFactory(NodeType.IfStatementList, children);

    }

    private ifStatement(toks: TokenIterator, isAlt: boolean, discoverAlt: { isAlt: boolean } = null) {

        let t = toks.current;
        let children: (T | Token)[] = [t];

        if (t.type === TokenType.T_IF || t.type === TokenType.T_ELSEIF) {

            t = toks.next();

            if (t.type !== '(') {
                //error
            }

            children.push(t);
            toks.next();
            children.push(this.expression(toks));
            t = toks.current;

            if (t.type !== ')') {
                //error
            }

            children.push(t);
            t = toks.next();
        } else {
            //must be else
            children.push(t);
            t = toks.next();
        }

        if ((isAlt || discoverAlt) && t.type === ':') {
            if (discoverAlt) {
                discoverAlt.isAlt = true;
            }

            children.push(t);
            t = toks.next();
            children.push(this.innerStatementList(toks, [TokenType.T_ELSEIF, TokenType.T_ELSE, TokenType.T_ENDIF]));
        } else if (this.isStatementToken(t)) {
            children.push(this.statement(toks));
        } else {
            //error

        }

        return this._nodeFactory(NodeType.IfStatement, children);

    }

    private expressionStatement(toks: TokenIterator) {

        let children: (T | Token)[] = [this.expression(toks)];
        let t = toks.current;

        if (t.type !== ';') {
            //error
        }

        children.push(t);
        toks.next();
        return this._nodeFactory(NodeType.ExpressionStatement, children);

    }

    private returnType(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        toks.next();
        children.push(this.typeExpression(toks));
        return this._nodeFactory(NodeType.ReturnType, children);

    }

    private typeExpression(toks: TokenIterator) {

        let t = toks.current;
        let children: (T | Token)[] = [];

        if (t.type === '?') {
            children.push(t);
            t = toks.next();
        }

        switch (t.type) {
            case TokenType.T_CALLABLE:
            case TokenType.T_ARRAY:
                children.push(t);
                toks.next();
                break;
            case TokenType.T_STRING:
            case TokenType.T_NAMESPACE:
            case TokenType.T_NS_SEPARATOR:
                children.push(this.name(toks));
                break;
            default:
                //error
                break;
        }

        return this._nodeFactory(NodeType.TypeExpression, children);

    }

    private classConstantDeclarationList(toks: TokenIterator, modifiers: T = null) {
        let t = toks.current;
        let children: (T | Token)[] = [];

        if (modifiers) {
            children.push(modifiers);
        }

        children.push(t);
        t = toks.next();

        while (true) {
            children.push(this.classConstantDeclaration(toks));
            t = toks.current;

            if (t.type !== ',') {
                break;
            } else {
                children.push(t);
                t = toks.next();
            }
        }

        if (t.type !== ';') {
            //error
        }

        children.push(t);
        toks.next();
        return this._nodeFactory(NodeType.ClassConstantDeclarationList, children);
    }

    private classConstantDeclaration(toks: TokenIterator) {
        let t = toks.current;
        let children: (T | Token)[] = [];
        let doc = toks.lastDocComment;

        if (t.type !== TokenType.T_STRING && !this.isSemiReserved(t)) {
            //error
        }

        children.push(t);
        t = toks.next();

        if (t.type !== '=') {
            //error
        }

        children.push(t);
        t = toks.next();

        children.push(this.expression(toks));
        return this._nodeFactory(NodeType.ClassConstantDeclaration, children, doc);

    }

    private propertyDeclarationList(toks: TokenIterator, modifiersOrVar: T | Token) {
        let t = toks.current;
        let children: (T | Token)[] = [modifiersOrVar];

        while (true) {

            children.push(this.propertyDeclaration(toks));
            t = toks.current;

            if (t.type !== ',') {
                break;
            } else {
                children.push(t);
                t = toks.next();
            }

        }

        if (t.type !== ';') {
            //error
        }

        children.push(t);
        toks.next();
        return this._nodeFactory(NodeType.PropertyDeclarationList, children);

    }

    private propertyDeclaration(toks: TokenIterator) {
        let t = toks.current;
        let children: (T | Token)[] = [];
        let doc = toks.lastDocComment;

        if (t.type !== TokenType.T_VARIABLE) {
            //error
        }

        children.push(t);
        t = toks.next();

        if (t.type !== '=') {
            return this._nodeFactory(NodeType.PropertyDeclaration, children, doc);
        }

        children.push(t);
        t = toks.next();

        children.push(this.expression(toks));
        return this._nodeFactory(NodeType.PropertyDeclaration, children, doc);

    }

    private memberModifierList(toks: TokenIterator) {

        let t = toks.current;
        let children: (T | Token)[] = [t];

        while (true) {
            t = toks.next();
            if (t.type === TokenType.T_PUBLIC ||
                t.type === TokenType.T_PROTECTED ||
                t.type === TokenType.T_PRIVATE ||
                t.type === TokenType.T_STATIC ||
                t.type === TokenType.T_ABSTRACT ||
                t.type === TokenType.T_FINAL) {
                children.push(t);
            } else {
                break;
            }
        }

        return this._nodeFactory(NodeType.MemberModifierList, children);

    }

    private extendsClass(toks: TokenIterator) {

        let t = toks.current;
        toks.next();
        return this._nodeFactory(NodeType.ClassExtends, [t, this.name(toks)]);

    }

    private implementsInterfaces(toks: TokenIterator) {

        let t = toks.current;
        toks.next();
        return this._nodeFactory(NodeType.Implements, [t, this.nameList(toks)]);

    }

    private nameList(toks: TokenIterator) {

        let children: (T | Token)[] = [];
        let t: Token;

        while (true) {
            children.push(this.name(toks));
            t = toks.current;
            if (t.type !== ',') {
                break;
            }
            children.push(t);
            toks.next();
        }

        return this._nodeFactory(NodeType.NameList, children);

    }

    private newExpression(toks: TokenIterator) {

        let t = toks.current;
        let children: (T | Token)[] = [t];
        t = toks.next();

        if (t.type === TokenType.T_CLASS) {
            children.push(this.anonymousClassDeclaration(toks));
            return this._nodeFactory(NodeType.New, children);
        }

        let name = this.newVariablePart(toks);

        t = toks.current;
        if (t.type === '[' || t.type === '{' || t.type === TokenType.T_OBJECT_OPERATOR || t.type === TokenType.T_PAAMAYIM_NEKUDOTAYIM) {
            name = this.newVariable(toks, name);
            t = toks.current;
        }

        children.push(name);

        if (t.type === '(') {
            children.push(this.argumentList(toks));
        }

        return this._nodeFactory(NodeType.New, children);

    }

    private newVariable(toks: TokenIterator, part: T | Token = null) {

        if (!part) {
            part = this.newVariablePart(toks);
        }

        let t: Token;
        let next: Token;
        let propName: T | Token;

        while (true) {

            t = toks.current;

            switch (t.type) {
                case '[':
                case '{':
                    part = this.dimension(toks, part);
                    continue;
                case TokenType.T_OBJECT_OPERATOR:
                    toks.next();
                    part = this._nodeFactory(NodeType.Property, [part, t, this.propertyName(toks)]);
                    continue;
                case TokenType.T_PAAMAYIM_NEKUDOTAYIM:
                    next = toks.next();
                    part = this._nodeFactory(NodeType.StaticProperty, [part, t, this.simpleVariable(toks)]);
                    continue;
                default:
                    break;
            }

            break;

        }

        return part;

    }

    private newVariablePart(toks: TokenIterator) {

        let t = toks.current;
        let newVariablePart: T | Token = null;

        switch (t.type) {
            case TokenType.T_STATIC:
                newVariablePart = t;
                toks.next();
                break;
            case TokenType.T_VARIABLE:
            case '$':
                newVariablePart = this.simpleVariable(toks);
                break;
            case TokenType.T_STRING:
            case TokenType.T_NAMESPACE:
            case TokenType.T_NS_SEPARATOR:
                newVariablePart = this.name(toks);
                break;
            default:
                //error
                break;

        }

        return newVariablePart;

    }

    private cloneExpression(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        toks.next();
        children.push(this.expression(toks));
        return this._nodeFactory(NodeType.Clone, children);

    }

    private listAssignment(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];

        if (toks.next().type !== '(') {
            //error
        }

        children.push(toks.current);
        toks.next();
        children.push(this.arrayElementList(toks, ')'));

        if (toks.current.type !== ')') {
            //error
        }

        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.List, children);

    }

    private unaryExpression(toks: TokenIterator) {

        let t = toks.current;
        let children: (T | Token)[] = [t];
        toks.next();
        children.push(this.expression(toks, this._opPrecedenceMap[t.text][0]));
        return this._nodeFactory(NodeType.UnaryOp, children);

    }

    private closure(toks: TokenIterator) {

        let children: (T | Token)[] = [];
        let doc = toks.lastDocComment;

        if (toks.current.type === TokenType.T_STATIC) {
            children.push(toks.current);
            toks.next();
        }

        children.push(toks.current);
        toks.next();

        if (toks.current.type === '&') {
            children.push(toks.current);
            toks.next();
        }

        children.push(this.parameterList(toks));

        if (toks.current.type === TokenType.T_USE) {
            children.push(this.closureUseList(toks));
        }

        if (toks.current.type === ':') {
            children.push(this.returnType(toks));
        }

        if (toks.current.type !== '{') {
            //error
        }

        children.push(toks.current);
        toks.next();
        children.push(this.innerStatementList(toks, ['}']));

        if (toks.current.type !== '}') {
            //error
        }

        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.Closure, children);

    }

    private closureUseList(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];

        if (toks.next().type !== '(') {
            //error
        }

        children.push(toks.current);
        toks.next();

        while (true) {

            children.push(this.closureUseVariable(toks));

            if (toks.current.type !== ',') {
                break;
            }

            children.push(toks.current);
            toks.next();

        }

        if (toks.current.type !== ')') {
            //error
        }

        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.ClosureUseList, children);

    }

    private closureUseVariable(toks: TokenIterator) {

        let children: (T | Token)[] = [];

        if (toks.current.type === '&') {
            children.push(toks.current);
            toks.next();
        }

        if (toks.current.type !== TokenType.T_VARIABLE) {
            //error
        }

        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.ClosureUseVariable, children);

    }

    private parameterList(toks: TokenIterator) {

        let t = toks.current;
        let children: (T | Token)[] = [];

        if (t.type !== '(') {
            //error
        }
        children.push(t);
        t = toks.next();

        if (t.type === ')') {
            children.push(t);
            toks.next();
            return this._nodeFactory(NodeType.ParameterList, children);
        }

        while (true) {

            children.push(this.parameter());
            t = toks.current;

            if (t.type !== ',') {
                break;
            }
            children.push(t);
            t = toks.next();
        }

        if (t.type !== ')') {
            //error
        }

        children.push(t);
        toks.next();
        return this._nodeFactory(NodeType.ParameterList, children);

    }

    private parameter() {

        let t = this._lexer.current;
        let children: (T | Token)[] = [];

        if (t.type === TokenType.T_NS_SEPARATOR ||
            t.type === TokenType.T_STRING ||
            t.type === TokenType.T_NAMESPACE) {
            children.push(this.name());
        } else if (t.type === TokenType.T_ARRAY || t.type === TokenType.T_CALLABLE) {
            children.push(t);
            this._lexer.next();
        }

        t = this._lexer.current;

        if (t.type === '&') {
            children.push(t);
            t = this._lexer.next();
        }

        if (t.type === TokenType.T_ELLIPSIS) {
            children.push(t);
            t = this._lexer.next();
        }

        if (t.type !== TokenType.T_VARIABLE) {
            return this._nodeFactory(NodeType.Parameter, children, this.parseError(t, [TokenType.T_VARIABLE]));
        }

        children.push(t);
        t = this._lexer.next();

        if (t.type !== '=') {
            return this._nodeFactory(NodeType.Parameter, children);
        }

        children.push(t);
        t = this._lexer.next();

        children.push(this.expression(0));
        return this._nodeFactory(NodeType.Parameter, children);

    }

    private variable(toks: TokenIterator) {

        let variableAtom = this.variableAtom(toks);

        while (true) {

            switch (toks.current.type) {
                case TokenType.T_PAAMAYIM_NEKUDOTAYIM:
                    variableAtom = this.staticMember(toks, variableAtom);
                    continue;
                case TokenType.T_OBJECT_OPERATOR:
                    variableAtom = this.instanceMember(toks, variableAtom);
                    continue;
                case '[':
                case '{':
                    variableAtom = this.dimension(toks, variableAtom);
                    continue;
                case '(':
                    variableAtom = this._nodeFactory(NodeType.Call, [variableAtom, this.argumentList(toks)]);
                    continue;
                default:
                    break;
            }

            break;
        }

        return variableAtom;
    }

    private staticMember(toks: TokenIterator, lhs: T | Token) {

        let children: (T | Token)[] = [lhs, toks.current];
        let t = toks.next();
        let nodeType = NodeType.StaticMethodCall;

        switch (t.type) {
            case '{':
                children.push(this.parenthesisedExpression(toks));
                break;
            case '$':
            case TokenType.T_VARIABLE:
                children.push(this.simpleVariable(toks));
                nodeType = NodeType.StaticProperty;
                break;
            case TokenType.T_STRING:
                children.push(t);
                toks.next();
                nodeType = NodeType.ClassConstant;
                break;
            default:
                if (this.isSemiReserved(t)) {
                    children.push(t);
                    toks.next();
                    nodeType = NodeType.ClassConstant;
                } else {
                    //error
                }
                break;
        }

        t = toks.current;

        if (t.type === '(') {
            children.push(this.argumentList(toks));
            return this._nodeFactory(NodeType.StaticMethodCall, children);
        } else if (nodeType !== NodeType.StaticMethodCall) {
            return this._nodeFactory(nodeType, children);
        } else {
            //error
        }

    }

    private instanceMember(toks: TokenIterator, lhs: T | Token) {

        let children: (T | Token)[] = [lhs, toks.current];
        toks.next();
        let name = this.propertyName(toks);

        if (!name) {
            //error
        }

        children.push(name);

        if (toks.current.type === '(') {
            children.push(this.argumentList(toks));
            return this._nodeFactory(NodeType.MethodCall, children);
        }

        return this._nodeFactory(NodeType.Property, children);

    }

    private propertyName(toks: TokenIterator): T | Token {

        let t = toks.current;

        switch (t.type) {
            case TokenType.T_STRING:
                toks.next();
                return t;
            case '{':
                return this.parenthesisedExpression(toks);
            case '$':
            case TokenType.T_VARIABLE:
                return this.simpleVariable(toks);
            default:
                //error
                break;
        }

    }

    private dimension(toks: TokenIterator, lhs: T | Token) {
        let t = toks.current;
        let close = t.type === '[' ? ']' : '}';
        let children: (T | Token)[] = [lhs, t];

        t = toks.next();
        if (t.type !== close) {
            children.push(this.expression(toks));
            t = toks.current;
        }

        if (t.type !== close) {
            //error
        }

        children.push(t);
        toks.next();
        return this._nodeFactory(NodeType.Dimension, children);

    }

    private argumentList(toks: TokenIterator) {

        let children: (T | Token)[] = [];
        let t = toks.current;

        if (t.type !== '(') {
            //error
        }

        children.push(t);
        t = toks.next();

        if (t.type === ')') {
            children.push(t);
            toks.next();
            return this._nodeFactory(NodeType.ArgumentList, children);
        }

        while (true) {

            if (t.type === TokenType.T_ELLIPSIS) {
                toks.next();
                children.push(this._nodeFactory(NodeType.UnaryOp, [t, this.expression(toks)]));
            } else {
                children.push(this.expression(toks));
            }

            t = toks.current;

            if (t.type !== ',') {
                break;
            }

            children.push(t);
            t = toks.next();
        }

        if (t.type !== ')') {
            //error
        }

        children.push(t);
        toks.next();
        return this._nodeFactory(NodeType.ArgumentList, children);

    }

    private subAtom() {

        let t = this._lexer.current;
        let subAtom: T | Token;

        switch (t.type) {
            case TokenType.T_VARIABLE:
            case TokenType.T_CONSTANT_ENCAPSED_STRING:
            case TokenType.T_STATIC:
                subAtom = t;
                break;
            case '$':
                subAtom = this.simpleVariable();
                break;
            case TokenType.T_ARRAY:
                subAtom = this.longArray(toks);
                break;
            case '[':
                subAtom = this.shortArray(toks);
                break;
            case TokenType.T_NS_SEPARATOR:
            case TokenType.T_STRING:
            case TokenType.T_NAMESPACE:
                subAtom = this.name();
                break;
            case '(':
                subAtom = this.parenthesisedExpression();
                break;
            default:
                //unexpected tokens should be handled higher up
                throw new Error(`Unexpected token: ${t.type}`);
        }

        return subAtom;

    }

    private name(toks: TokenIterator) {

        let t = toks.current;
        let children: (T | Token)[] = [];

        if (t.type === TokenType.T_NS_SEPARATOR) {
            children.push(t);
            t = toks.next();
        } else if (t.type === TokenType.T_NAMESPACE) {
            children.push(t);
            t = toks.next();
            if (t.type === TokenType.T_NS_SEPARATOR) {
                children.push(t);
                t = toks.next();
            } else {
                //error
            }
        }

        children.push(this.namespaceName(toks));

        return this._nodeFactory(NodeType.Name, children);

    }

    private shortArray(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];

        if (toks.next().type === ']') {
            children.push(toks.current);
            toks.next();
            return this._nodeFactory(NodeType.ArrayDeclaration, children);
        }

        children.push(this.arrayElementList(toks, ']'));

        if (toks.current.type !== ']') {
            //error
        }
        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.ArrayDeclaration, children);

    }

    private longArray(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];

        if (toks.next().type !== '(') {
            //error
        }

        children.push(toks.current);
        if (toks.next().type === ')') {
            children.push(toks.current);
            toks.next();
            return this._nodeFactory(NodeType.ArrayDeclaration, children);
        }

        children.push(this.arrayElementList(toks, ')'));

        if (toks.current.type !== ')') {
            //error
        }
        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.ArrayDeclaration, children);

    }

    private arrayElementList(toks: TokenIterator, closeTokenType: string) {

        let children: (T | Token)[] = [];

        while (true) {

            children.push(this.arrayElement(toks));
            if (toks.current.type !== ',') {
                break;
            }

            children.push(toks.current);
            if (toks.next().type === closeTokenType) {
                break;
            }

        }

        return this._nodeFactory(NodeType.ArrayElementList, children);

    }

    private arrayElement(toks: TokenIterator) {

        let t = toks.current;

        if (t.type === '&') {
            toks.next();
            return this._nodeFactory(NodeType.UnaryOp, [t, this.variable(toks)]);
        }

        let expr = this.expression(toks);
        t = toks.current;

        if (t.type !== TokenType.T_DOUBLE_ARROW) {
            return expr;
        }

        let children: (T | Token)[] = [expr, t];
        t = toks.next();

        if (t.type === '&') {
            toks.next();
            children.push(this._nodeFactory(NodeType.UnaryOp, [t, this.variable(toks)]));
            return this._nodeFactory(NodeType.ArrayPair, children);
        }

        children.push(this.expression(toks));
        return this._nodeFactory(NodeType.ArrayPair, children);

    }


    private variableAtom(toks: TokenIterator) {
        let t = toks.current;

        switch (t.type) {
            case TokenType.T_VARIABLE:
            case '$':
                return this.simpleVariable(toks);
            case '(':
                return this.parenthesisedExpression(toks);
            case TokenType.T_ARRAY:
                return this.longArray(toks);
            case '[':
                return this.shortArray(toks);
            case TokenType.T_CONSTANT_ENCAPSED_STRING:
            case TokenType.T_STATIC:
                toks.next();
                return t;
            case TokenType.T_STRING:
            case TokenType.T_NAMESPACE:
            case TokenType.T_NS_SEPARATOR:
                return this.name(toks);
            default:
                //error
                break;
        }

    }

    private simpleVariable(toks: TokenIterator) {

        let children: (T | Token)[] = [];
        let t = toks.current;

        if (t.type === TokenType.T_VARIABLE) {
            children.push(toks.current);
            toks.next();
        } else if (t.type === '$') {
            children.push(toks.current);
            t = toks.next();
            if (t.type === '{') {
                children.push(t);
                toks.next();
                children.push(this.expression(toks));
                if (toks.current.type !== '}') {
                    //error
                }
                children.push(toks.current);
                toks.next();
            } else if (t.type === '$' || t.type === TokenType.T_VARIABLE) {
                children.push(this.simpleVariable(toks));
            } else {
                //error
            }
        } else {
            //error
        }

        return this._nodeFactory(NodeType.Variable, children);

    }

    private parenthesisedExpression(toks: TokenIterator) {

        let map: { [id: string]: string } = {
            '(': ')',
            '{': '}',
            '[': ']'
        };
        let t = toks.current;
        let close = map[t.type];
        let children: (T | Token)[] = [t];

        toks.next();
        children.push(this.expression(toks));
        t = toks.current;

        if (t.type !== close) {
            //error
        }

        children.push(t);
        toks.next();
        return this._nodeFactory(NodeType.ParenthesisedExpression, children);
    }

    private isBinaryOp(t: Token) {
        return this._opPrecedenceMap.hasOwnProperty(t.text) && (this._opPrecedenceMap[t.text][2] & OpType.Binary) === OpType.Binary;
    }

    private haltCompiler(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];

        if (toks.next().type !== '(') {
            //error
        }

        children.push(toks.current);

        if (toks.next().type !== ')') {
            //error
        }

        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.HaltCompiler, children);

    }

    private use(toks: TokenIterator) {

        let children: (T | Token)[] = [toks.current];
        let t = toks.next();
        let isMixed = true;

        if (t.type === TokenType.T_FUNCTION || t.type === TokenType.T_CONST) {
            children.push(t);
            t = toks.next();
            isMixed = false;
        }

        let useElementParts: (T | Token)[] = [];

        if (t.type === TokenType.T_NS_SEPARATOR) {
            useElementParts.push(t);
            t = toks.next();
        }

        useElementParts.push(this.namespaceName(toks));
        t = toks.current;

        if (t.type === TokenType.T_NS_SEPARATOR) {
            children.push(...useElementParts);
            return this.useGroup(toks, children, isMixed);
        }

        //must be use list

        children.push(this.useElement(toks, useElementParts, false, true));
        t = toks.current;

        if (t.type !== ',') {
            return this._nodeFactory(NodeType.UseList, children);
        }

        children.push(t);
        toks.next();

        while (true) {

            children.push(this.useElement(toks, [], false, true));
            if (toks.current.type !== ',') {
                break;
            }
            children.push(toks.current);
            toks.next();

        }

        return this._nodeFactory(NodeType.UseList, children);

    }

    private useGroup(toks: TokenIterator, children: (T | Token)[], isMixed: boolean) {

        //current will be T_NS_SEPARATOR
        children.push(toks.current);

        if (toks.next().type !== '{') {
            //error
        }

        children.push(toks.current);
        toks.next();

        while (true) {

            children.push(this.useElement(toks, [], isMixed, false));
            if (toks.current.type !== ',') {
                break;
            }
            children.push(toks.current);
            toks.next();

        }

        if (toks.current.type !== '}') {
            //errror
        }

        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.UseGroup, children);

    }

    private useElement(toks: TokenIterator, children: (T | Token)[], isMixed: boolean, lookForPrefix: boolean) {

        //if children not empty then it contains tokens to left of T_AS

        if (!children.length) {

            if ((isMixed && [TokenType.T_FUNCTION, TokenType.T_CONST].indexOf(<TokenType>toks.current.type)) ||
                (lookForPrefix && toks.current.type === TokenType.T_NS_SEPARATOR)) {
                children.push(toks.current);
                toks.next();
            }

            children.push(this.namespaceName(toks));
        }

        if (toks.current.type !== TokenType.T_AS) {
            return this._nodeFactory(NodeType.UseElement, children);
        }

        children.push(toks.current);

        if (toks.next().type !== TokenType.T_STRING) {
            //error
        }

        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.UseElement, children);

    }

    private namespace(toks: TokenIterator, isEmpty: { isEmpty: boolean }) {

        let children: (T | Token)[] = [toks.current];
        let t = toks.next();
        toks.lastDocComment;

        if (t.type == TokenType.T_STRING) {
            children.push(this.namespaceName(toks));
            t = toks.current;
            if (t.type !== '{') {
                isEmpty.isEmpty = true;
                return this._nodeFactory(NodeType.Namespace, children);
            }
        }

        if (toks.current.type !== '{') {
            //error
        }

        children.push(toks.current);
        toks.next();
        children.push(this.topStatementList(toks, ['}']));

        if (toks.current.type !== '}') {
            //error
        }

        children.push(toks.current);
        toks.next();
        return this._nodeFactory(NodeType.Namespace, children);

    }

    private namespaceName(toks: TokenIterator) {

        let t = toks.current;
        let children: (T | Token)[] = [];

        if (t.type !== TokenType.T_STRING) {
            //error
        }

        children.push(t);

        while (true) {

            t = toks.next();
            if (t.type !== TokenType.T_NS_SEPARATOR || toks.lookahead().type !== TokenType.T_STRING) {
                break;
            }

            children.push(t, toks.next());
        }

        return this._nodeFactory(NodeType.NamespaceName, children);

    }

    private parseError(unexpected: Token, expected: (TokenType | string)[], nodeTypes?: NodeType[]): ParseError {
        let error: ParseError = {
            unexpected: unexpected,
            expected: expected
        }
        this._errors.push(error);
        return error;
    }

}

