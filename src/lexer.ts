/* Copyright © Ben Mewburn ben@mewburn.id.au
 * Licensed under the MIT Licence.
 */

'use strict';

export enum TokenType {
    T_NONE,
    T_ABSTRACT,
    T_AND_EQUAL,
    T_ARRAY,
    T_ARRAY_CAST,
    T_AS,
    T_BAD_CHARACTER,
    T_BOOLEAN_AND,
    T_BOOLEAN_OR,
    T_BOOL_CAST,
    T_BREAK,
    T_CALLABLE,
    T_CASE,
    T_CATCH,
    T_CHARACTER,
    T_CLASS,
    T_CLASS_C,
    T_CLONE,
    T_CLOSE_TAG,
    T_COMMENT,
    T_CONCAT_EQUAL,
    T_CONST,
    T_CONSTANT_ENCAPSED_STRING,
    T_CONTINUE,
    T_CURLY_OPEN,
    T_DEC,
    T_DECLARE,
    T_DEFAULT,
    T_DIR,
    T_DIV_EQUAL,
    T_DNUMBER,
    T_DOC_COMMENT,
    T_DO,
    T_DOLLAR_OPEN_CURLY_BRACES,
    T_DOUBLE_ARROW,
    T_DOUBLE_CAST,
    T_DOUBLE_COLON,
    T_ECHO,
    T_ELLIPSIS,
    T_ELSE,
    T_ELSEIF,
    T_EMPTY,
    T_ENCAPSED_AND_WHITESPACE,
    T_ENDDECLARE,
    T_ENDFOR,
    T_ENDFOREACH,
    T_ENDIF,
    T_ENDSWITCH,
    T_ENDWHILE,
    T_END_HEREDOC,
    T_EVAL,
    T_EXIT,
    T_EXTENDS,
    T_FILE,
    T_FINAL,
    T_FINALLY,
    T_FOR,
    T_FOREACH,
    T_FUNCTION,
    T_FUNC_C,
    T_GLOBAL,
    T_GOTO,
    T_HALT_COMPILER,
    T_IF,
    T_IMPLEMENTS,
    T_INC,
    T_INCLUDE,
    T_INCLUDE_ONCE,
    T_INLINE_HTML,
    T_INSTANCEOF,
    T_INSTEADOF,
    T_INT_CAST,
    T_INTERFACE,
    T_ISSET,
    T_IS_EQUAL,
    T_IS_GREATER_OR_EQUAL,
    T_IS_IDENTICAL,
    T_IS_NOT_EQUAL,
    T_IS_NOT_IDENTICAL,
    T_IS_SMALLER_OR_EQUAL,
    T_SPACESHIP,
    T_LINE,
    T_LIST,
    T_LNUMBER,
    T_LOGICAL_AND,
    T_LOGICAL_OR,
    T_LOGICAL_XOR,
    T_METHOD_C,
    T_MINUS_EQUAL,
    T_MOD_EQUAL,
    T_MUL_EQUAL,
    T_NAMESPACE,
    T_NS_C,
    T_NS_SEPARATOR,
    T_NEW,
    T_NUM_STRING,
    T_OBJECT_CAST,
    T_OBJECT_OPERATOR,
    T_OPEN_TAG,
    T_OPEN_TAG_WITH_ECHO,
    T_OR_EQUAL,
    T_PAAMAYIM_NEKUDOTAYIM,
    T_PLUS_EQUAL,
    T_POW,
    T_POW_EQUAL,
    T_PRINT,
    T_PRIVATE,
    T_PUBLIC,
    T_PROTECTED,
    T_REQUIRE,
    T_REQUIRE_ONCE,
    T_RETURN,
    T_SL,
    T_SL_EQUAL,
    T_SR,
    T_SR_EQUAL,
    T_START_HEREDOC,
    T_STATIC,
    T_STRING,
    T_STRING_CAST,
    T_STRING_VARNAME,
    T_SWITCH,
    T_THROW,
    T_TRAIT,
    T_TRAIT_C,
    T_TRY,
    T_UNSET,
    T_UNSET_CAST,
    T_USE,
    T_VAR,
    T_VARIABLE,
    T_WHILE,
    T_WHITESPACE,
    T_XOR_EQUAL,
    T_YIELD,
    T_YIELD_FROM
}

export enum LexerMode {
    None,
    Initial,
    Scripting,
    LookingForProperty,
    DoubleQuotes,
    NowDoc,
    HereDoc,
    EndHereDoc,
    BackQuote,
    VarOffset,
    LookingForVarName
}

class LexerState {

    input: string;
    lexeme: string;
    mode: LexerMode[];
    line: number;
    char: number;
    lastLexemeEndedWithNewline: boolean;
    hereDocLabel: string;
    doubleQuoteScannedLength: number;

    less(n: number = 0) {
        this.input = this.lexeme.slice(n) + this.input;
        this.lexeme = this.lexeme.substr(0, n);
    }

    more(n: number) {
        this.lexeme += this.input.substr(0, n);
        this.input = this.input.slice(n);
    }

    advancePosition(countLines = true) {
        if (!this.lexeme) {
            return;
        }

        if (!countLines) {
            if (this.lastLexemeEndedWithNewline) {
                this.char = -1;
                ++this.line;
                this.lastLexemeEndedWithNewline = false;
            }
            this.char += this.lexeme.length;
            return;
        }

        let n = 0;
        let c: string;

        while (n < this.lexeme.length) {
            if (this.lastLexemeEndedWithNewline) {
                this.char = -1;
                ++this.line;
                this.lastLexemeEndedWithNewline = false;
            }
            ++this.char;
            c = this.lexeme[n++];
            if (c === '\n' || c === '\r') {
                this.lastLexemeEndedWithNewline = true;
                if (c === '\r' && n < this.lexeme.length && this.lexeme[n] === '\n') {
                    ++n;
                    ++this.char;
                }
            }
        }

    }

}