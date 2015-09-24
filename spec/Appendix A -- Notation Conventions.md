# A. Appendix: Notation Conventions

This specification document contains a number of notation conventions used to
describe technical concepts such as language grammar and semantics as well as
runtime algorithms.

This appendix seeks to explain these notations in greater detail to
avoid ambiguity.


## Context-Free Grammar

A context-free grammar consists of a number of productions. Each production has
an abstract symbol called a "non-terminal" as its left-hand side, and zero or
more possible sequences of non-terminal symbols and or terminal characters as
its right-hand side.

Starting from a single goal non-terminal symbol, a context-free grammar
describes a language: the set of possible sequences of characters that can be
described by repeatedly replacing any non-terminal in the goal sequence with one
of the sequences it is defined by, until all non-terminal symbols have been
replaced by terminal characters.

Terminals are represented in this document in a monospace font in two forms: a
specific Unicode character or sequence of Unicode characters (ex. {`=`} or {`terminal`}), and a pattern of Unicode characters defined by a regular expression
(ex {/[0-9]+/}).

Non-terminal production rules are represented in this document using the
following notation for a non-terminal with a single definition:

NonTerminalWithSingleDefinition : NonTerminal `terminal`

While using the following notation for a production with a list of definitions:

NonTerminalWithManyDefinitions :
  - OtherNonTerminal `terminal`
  - `terminal`

A definition may refer to itself, which describes repetitive sequences,
for example:

ListOfLetterA :
  - `a`
  - ListOfLetterA `a`


## Lexical and Syntactical Grammar

The GraphQL language is defined in a syntactic grammar where terminal symbols
are tokens. Tokens are defined in a lexical grammar which matches patterns of
source characters. The result of parsing a sequence of source Unicode characters
produces a GraphQL AST.

A Lexical grammar production describes non-terminal "tokens" by
patterns of terminal Unicode characters. No "whitespace" or other ignored
characters may appear between any terminal Unicode characters in the lexical
grammar production. A lexical grammar production is distinguished by a two colon
`::` definition.

Word :: /[A-Za-z]+/

A Syntactical grammar production describes non-terminal "rules" by patterns of
terminal Tokens. Whitespace and other ignored characters may appear before or
after any terminal Token. A syntactical grammar production is distinguished by a
one colon `:` definition.

Sentence : Noun Verb


## Grammar Notation

This specification uses some additional notation to describe common patterns,
such as optional or repeated patterns, or parameterized alterations of the
definition of a non-terminal. This section explains these short-hand notations
and their expanded definitions in the context-free grammar.


**Constraints**

A grammar production may specify that certain expansions are not permitted by
using the phrase "but not" and then indicating the expansions to be excluded.

For example, the production:

SafeName : Name but not SevenCarlinWords

means that the nonterminal {SafeName} may be replaced by any sequence of
characters that could replace {Name} provided that the same sequence of
characters could not replace {SevenCarlinWords}.

A grammar may also list a number of restrictions after "but not" separated
by "or".

For example:

NonBooleanName : Name but not `true` or `false`


**Optionality and Lists**

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


**Parameterized Grammar Productions**

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


## Grammar Semantics

This specification describes the semantic value of many grammar productions in
the form of a list of algorithmic steps.

For example, this describes how a parser should interpret a string literal:

StringValue :: `""`

  * Return an empty Unicode character sequence.

StringValue :: `"` StringCharacter+ `"`

  * Return the Unicode character sequence of all {StringCharacter}
    Unicode character values.


## Algorithms

This specification describes some algorithms used by the static and runtime semantics, they're defined in the form of a function-like syntax along with a
list of algorithmic steps to take.

For example, this describes if a fragment should be spread into place given a
runtime {objectType} and the fragment's {fragmentType}:

doesFragmentTypeApply(objectType, fragmentType):
  * If {fragmentType} is an Object Type:
    * if {objectType} and {fragmentType} are the same type, return {true}, otherwise return {false}.
  * If {fragmentType} is an Interface Type:
    * if {objectType} is an implementation of {fragmentType}, return {true} otherwise return {false}.
  * If {fragmentType} is a Union:
    * if {objectType} is a possible type of {fragmentType}, return {true} otherwise return {false}.

