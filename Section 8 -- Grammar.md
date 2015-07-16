# Grammar

A GraphQL document is defined in a syntactic grammar where terminal symbols are
tokens. Tokens are defined in a lexical grammar which matches patterns of source
characters. The result of parsing a sequence of source UTF-8 characters produces
a GraphQL AST.

Symbols are defined (ex. Symbol :) as either one sequence of symbols or a list
of possible sequences of symbols, either as a bulleted list or using the
"one of" short hand.

A subscript suffix "{Symbol?}" is shorthand for two possible sequences, one
including that symbol and one excluding it.

As an example:

Sentence : Noun Verb Adverb?

is shorthand for

Sentence :
  - Noun Verb
  - Noun Verb Adverb

A subscript suffix "{Symbol+}" is shorthand for a list of
one or more of that symbol.

As an example:

Book : Cover Page+ Cover

is shorthand for

Book : Cover Page_list Cover

Page_list :
  - Page
  - Page_list Page

A symbol definition subscript suffix parameter in braces "{Symbol[Param]}"
is shorthand for two symbol definitions, one appended with that parameter name,
the other without. The same subscript suffix on a symbol is shorthand for that
variant of the definition. If the parameter starts with "?", that
form of the symbol is used if in a symbol definition with the same parameter.
Some possible sequences can be included or excluded conditionally when
respectively prefixed with "\[+Param]" and "\[~Param]".

As an example:

Example[Param] :
  - A
  - B[Param]
  - C[?Param]
  - [+Param] D
  - [~Param] E

is shorthand for

Example :
  - A
  - B_param
  - C
  - E

Example_param :
  - A
  - B_param
  - C_param
  - D

A grammar production may specify that certain expansions are not permitted by
using the phrase "but not" and then indicating the expansions to be excluded.

For example, the production:

SafeName : Name but not SevenCarlinWords

means that the nonterminal {SafeName} may be replaced by any sequence of
characters that could replace {Name} provided that the same sequence of
characters could not replace {SevenCarlinWords}.

A grammar may also list a number of restrictions after "but not" seperated
by "or".

For example:

NonBooleanName : Name but not `true` or `false`


## Ignored Source

Before and after every lexical token may be any amount of ignored source
characters including whitespace and comments. No ignored regions of a source
document are significant, however ignored source characters may appear within a
lexical token, for example a {String} may contain whitespace.

**Ignoring commas**

GraphQL ignores the comma ({`,`}) character. This ensures that the absence or
presence of a comma does not meaningfully alter the interpreted syntax of the
document, as this can be a common user-error in other languages. It also allows
for the stylistic use of either trailing commas or line-terminators as
delimiters which are often desired for legibility and maintainability of source
code. The use of commas, whitespace, and line-terminators is encouraged only
when they improve the legibility of GraphQL documents.

GraphQL ignores these character sequences:

Ignored :
  - WhiteSpace
  - LineTerminator
  - Comment
  - ,

WhiteSpace :
  - "Horizontal Tab (U+0009)"
  - "Vertical Tab (U+000B)"
  - "Form Feed (U+000C)"
  - "Space (U+0020)"
  - "No-break Space (U+00A0)"

LineTerminator :
  - "New Line (U+000A)"
  - "Carriage Return (U+000D)"
  - "Line Separator (U+2028)"
  - "Paragraph Separator (U+2029)"

Comment :
  - `#` CommentChar+?

CommentChar : "Any character" but not LineTerminator


## Tokens

A GraphQL document is comprised of several kinds of source tokens defined here
in a lexical grammar. This lexical grammar defines patterns of source characters
by specifying character patterns in {`monospace`} or as {/regular_expressions/}.
Non-terminal patterns are defined as {Italics}.

No characters are ignored while parsing a given token, for example no whitespace
is allowed between the characters defining a {FloatValue}, however ignored
characters are skipped before and after each well-formed Token.

Tokens are later used as terminal symbols in GraphQL's syntactic grammar.

The GraphQL document syntactic grammar is defined in terms of these
lexical tokens:

Token :
  - Punctuator
  - Name
  - IntValue
  - FloatValue
  - StringValue

Punctuator : one of ! $ ( ) ... : = @ [ ] { | }

Name : /[_A-Za-z][_0-9A-Za-z]*/

IntValue : Sign? IntegerPart

FloatValue : Sign? IntegerPart . Digit+ ExponentPart?

Sign : -

IntegerPart :
  - 0
  - NonZeroDigit
  - NonZeroDigit Digit+

ExponentPart : e Sign? Digit+

NonZeroDigit : one of 1 2 3 4 5 6 7 8 9

Digit :
  - 0
  - NonZeroDigit

StringValue :
  - `""`
  - `"` StringCharacter+ `"`

StringCharacter :
  - "Any character" but not `"` or \ or LineTerminator
  - \ EscapedUnicode
  - \ EscapedCharacter

EscapedUnicode : u /[0-9A-Fa-f]{4}/

EscapedCharacter : one of `"` \ `/` b f n r t


## Syntax

A GraphQL document is defined in a syntactic grammar where terminal symbols are
expressed as either an italicized token (ex. {Document}) or as
monospaced short-hand for a {Punctuator} (ex. {`:`}) or short-hand for a {Name}
(ex. {`query`}).

Since whitespace, comments, and other ignored source is skipped between each
well-formed token, this ignored source can appear at any point between the
terminal tokens in the syntactic grammars defined below. However GraphQL
source documents are encouraged to use ignored source only to
improve legibility.


### Document

A GraphQL document describes a complete file or request string. A document
contains multiple definitions including an Operation.

Document : Definition+

Definition :
  - OperationDefinition
  - FragmentDefinition


### Operations

An operation describes some type of request to GraphQL. The most common
operation is a `query`, a read-only request for data from GraphQL. A short-hand
syntax exists for a query operation.

OperationDefinition :
  - SelectionSet
  - OperationType Name VariableDefinitions? Directives? SelectionSet

OperationType : one of query mutation

VariableDefinitions : ( VariableDefinition+ )

VariableDefinition : Variable : Type DefaultValue?

Variable : $ Name

DefaultValue : = Value[Const]

SelectionSet : { Selection+ }

Selection :
  - Field
  - FragmentSpread
  - InlineFragment

Field : Alias? Name Arguments? Directives? SelectionSet?

Alias : Name :

Arguments : ( Argument+ )

Argument : Name : Value


### Fragments

Fragments allow for the reuse of common selections of fields, reducing
duplicated text in the document. Inline fragments can be used directly inline a
selection to apply a type condition when querying against an interface or union.

FragmentSpread : ... FragmentName Directives?

InlineFragment : ... on TypeCondition Directives? SelectionSet

FragmentDefinition : fragment FragmentName on TypeCondition Directives? SelectionSet

FragmentName : Name but not `on`

TypeCondition : TypeName


### Values

Fields may take values for arguments. A value may be any JSON-style value,
a variable or an Enum value.

Value[Const] :
  - [~Const] Variable
  - IntValue
  - FloatValue
  - StringValue
  - BooleanValue
  - EnumValue
  - ArrayValue[?Const]
  - ObjectValue[?Const]

BooleanValue :
  - true
  - false

EnumValue : Name but not `true`, `false` or `null`


#### Array Value

ArrayValue[Const] :
  - [ ]
  - [ Value[?Const]+ ]

**Semantics**

ArrayValue : [ ]

  * Return a new empty list value.

ArrayValue : [ Value+ ]

  * Let {inputList} be a new empty list value.
  * For each {Value+}
    * Let {value} be the result of evaluating {Value}.
    * Append {value} to {inputList}.
  * Return {inputList}


#### Object Value

ObjectValue[Const] :
  - { }
  - { ObjectField[?Const]+ }

ObjectField[Const] : Name : Value[?Const]

**Semantics**

ObjectValue : { }

  * Return a new input object value with no fields.

ObjectValue : { ObjectField+ }

  * Let {inputObject} be a new input object value with no fields.
  * For each {field} in {ObjectField+}
    * Let {name} be {Name} in {field}.
    * If {inputObject} contains a field named {name} throw Syntax Error.
    * Let {value} be the result of evaluating {Value} in {field}.
    * Add a field to {inputObject} of name {name} containing value {value}.
  * Return {inputObject}


### Directives

Directives provide a way to describe runtime execution and type validation
behavior in a GraphQL document.

Directives : Directive+

Directive : @ Name Arguments?


### Types

GraphQL describes the schema of the data it provides using a type system. These
types are referred to in the document when defining query variables.

Type :
  - TypeName
  - ListType
  - NonNullType

TypeName : Name

ListType : [ Type ]

NonNullType :
  - TypeName !
  - ListType !

**Semantics**

Type : Name

  * Let {name} be the string value of {Name}
  * Let {type} be the type defined in the Schema named {name}
  * {type} must not be {null}
  * Return {type}

Type : [ Type ]

  * Let {itemType} be the result of evaluating {Type}
  * Let {type} be a List type where {itemType} is the contained type.
  * Return {type}

Type : Type !

  * Let {nullableType} be the result of evaluating {Type}
  * Let {type} be a Non-Null type where {nullableType} is the contained type.
  * Return {type}
