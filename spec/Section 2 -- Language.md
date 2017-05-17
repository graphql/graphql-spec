# Language

Clients use the GraphQL query language to make requests to a GraphQL service.
We refer to these request sources as documents. A document may contain
operations (queries, mutations, and subscriptions) as well as fragments, a
common unit of composition allowing for query reuse.

A GraphQL document is defined as a syntactic grammar where terminal symbols are
tokens (indivisible lexical units). These tokens are defined in a lexical
grammar which matches patterns of source characters (defined by a
double-colon `::`).


## Source Text

SourceCharacter :: /[\u0009\u000A\u000D\u0020-\uFFFF]/

GraphQL documents are expressed as a sequence of
[Unicode](http://unicode.org/standard/standard.html) characters. However, with
few exceptions, most of GraphQL is expressed only in the original non-control
ASCII range so as to be as widely compatible with as many existing tools,
languages, and serialization formats as possible and avoid display issues in
text editors and source control.


### Unicode

UnicodeBOM :: "Byte Order Mark (U+FEFF)"

Non-ASCII Unicode characters may freely appear within {StringValue} and
{Comment} portions of GraphQL.

The "Byte Order Mark" is a special Unicode character which
may appear at the beginning of a file containing Unicode which programs may use
to determine the fact that the text stream is Unicode, what endianness the text
stream is in, and which of several Unicode encodings to interpret.


### White Space

WhiteSpace ::
  - "Horizontal Tab (U+0009)"
  - "Space (U+0020)"

White space is used to improve legibility of source text and act as separation
between tokens, and any amount of white space may appear before or after any
token. White space between tokens is not significant to the semantic meaning of
a GraphQL query document, however white space characters may appear within a
{String} or {Comment} token.

Note: GraphQL intentionally does not consider Unicode "Zs" category characters
as white-space, avoiding misinterpretation by text editors and source
control tools.


### Line Terminators

LineTerminator ::
  - "New Line (U+000A)"
  - "Carriage Return (U+000D)" [ lookahead ! "New Line (U+000A)" ]
  - "Carriage Return (U+000D)" "New Line (U+000A)"

Like white space, line terminators are used to improve the legibility of source
text, any amount may appear before or after any other token and have no
significance to the semantic meaning of a GraphQL query document. Line
terminators are not found within any other token.

Note: Any error reporting which provide the line number in the source of the
offending syntax should use the preceding amount of {LineTerminator} to produce
the line number.


### Comments

Comment :: `#` CommentChar*

CommentChar :: SourceCharacter but not LineTerminator

GraphQL source documents may contain single-line comments, starting with the
{`#`} marker.

A comment can contain any Unicode code point except {LineTerminator} so a
comment always consists of all code points starting with the {`#`} character up
to but not including the line terminator.

Comments behave like white space and may appear after any token, or before a
line terminator, and have no significance to the semantic meaning of a GraphQL
query document.


### Insignificant Commas

Comma :: ,

Similar to white space and line terminators, commas ({`,`}) are used to improve
the legibility of source text and separate lexical tokens but are otherwise
syntactically and semantically insignificant within GraphQL query documents.

Non-significant comma characters ensure that the absence or presence of a comma
does not meaningfully alter the interpreted syntax of the document, as this can
be a common user-error in other languages. It also allows for the stylistic use
of either trailing commas or line-terminators as list delimiters which are both
often desired for legibility and maintainability of source code.


### Lexical Tokens

Token ::
  - Punctuator
  - Name
  - IntValue
  - FloatValue
  - StringValue

A GraphQL document is comprised of several kinds of indivisible lexical tokens
defined here in a lexical grammar by patterns of source Unicode characters.

Tokens are later used as terminal symbols in a GraphQL query document syntactic
grammars.


### Ignored Tokens

Ignored ::
  - UnicodeBOM
  - WhiteSpace
  - LineTerminator
  - Comment
  - Comma

Before and after every lexical token may be any amount of ignored tokens
including {WhiteSpace} and {Comment}. No ignored regions of a source
document are significant, however ignored source characters may appear within
a lexical token in a significant way, for example a {String} may contain white
space characters.

No characters are ignored while parsing a given token, as an example no
white space characters are permitted between the characters defining a
{FloatValue}.


### Punctuators

Punctuator :: one of ! $ ( ) ... : = @ [ ] { | }

GraphQL documents include punctuation in order to describe structure. GraphQL
is a data description language and not a programming language, therefore GraphQL
lacks the punctuation often used to describe mathematical expressions.


### Names

Name :: /[_A-Za-z][_0-9A-Za-z]*/

GraphQL query documents are full of named things: operations, fields, arguments,
directives, fragments, and variables. All names must follow the same
grammatical form.

Names in GraphQL are case-sensitive. That is to say `name`, `Name`, and `NAME`
all refer to different names. Underscores are significant, which means
`other_name` and `othername` are two different names.

Names in GraphQL are limited to this <acronym>ASCII</acronym> subset of possible
characters to support interoperation with as many other systems as possible.


## Query Document

Document : Definition+

Definition :
  - OperationDefinition
  - FragmentDefinition

A GraphQL query document describes a complete file or request string received by
a GraphQL service. A document contains multiple definitions of Operations and
Fragments. GraphQL query documents are only executable by a server if they
contain an operation. However documents which do not contain operations may
still be parsed and validated to allow client to represent a single request
across many documents.

If a document contains only one operation, that operation may be unnamed or
represented in the shorthand form, which omits both the query keyword and
operation name. Otherwise, if a GraphQL query document contains multiple
operations, each operation must be named. When submitting a query document with
multiple operations to a GraphQL service, the name of the desired operation to
be executed must also be provided.


## Operations

OperationDefinition :
  - OperationType Name? VariableDefinitions? Directives? SelectionSet
  - SelectionSet

OperationType : one of `query` `mutation` `subscription`

There are three types of operations that GraphQL models:

  * query - a read-only fetch.
  * mutation - a write followed by a fetch.
  * subscription - a long-lived request that fetches data in response to source
    events.

Each operation is represented by an optional operation name and a selection set.

For example, this mutation operation might "like" a story and then retrieve the
new number of likes:

```
mutation {
  likeStory(storyID: 12345) {
    story {
      likeCount
    }
  }
}
```

**Query shorthand**

If a document contains only one query operation, and that query defines no
variables and contains no directives, that operation may be represented in a
short-hand form which omits the query keyword and query name.

For example, this unnamed query operation is written via query shorthand.

```graphql
{
  field
}
```

Note: many examples below will use the query short-hand syntax.


## Selection Sets

SelectionSet : { Selection+ }

Selection :
  - Field
  - FragmentSpread
  - InlineFragment

An operation selects the set of information it needs, and will receive exactly
that information and nothing more, avoiding over-fetching and
under-fetching data.

```graphql
{
  id
  firstName
  lastName
}
```

In this query, the `id`, `firstName`, and `lastName` fields form a selection
set. Selection sets may also contain fragment references.


## Fields

Field : Alias? Name Arguments? Directives? SelectionSet?

A selection set is primarily composed of fields. A field describes one discrete
piece of information available to request within a selection set.

Some fields describe complex data or relationships to other data. In order to
further explore this data, a field may itself contain a selection set, allowing
for deeply nested requests. All GraphQL operations must specify their selections
down to fields which return scalar values to ensure an unambiguously
shaped response.

For example, this operation selects fields of complex data and relationships
down to scalar values.

```graphql
{
  me {
    id
    firstName
    lastName
    birthday {
      month
      day
    }
    friends {
      name
    }
  }
}
```

Fields in the top-level selection set of an operation often represent some
information that is globally accessible to your application and its current
viewer. Some typical examples of these top fields include references to a
current logged-in viewer, or accessing certain types of data referenced by a
unique identifier.

```graphql
# `me` could represent the currently logged in viewer.
{
  me {
    name
  }
}

# `user` represents one of many users in a graph of data, referred to by a
# unique identifier.
{
  user(id: 4) {
    name
  }
}
```


## Arguments

Arguments : ( Argument+ )

Argument : Name : Value

Fields are conceptually functions which return values, and occasionally accept
arguments which alter their behavior. These arguments often map directly to
function arguments within a GraphQL server's implementation.

In this example, we want to query a specific user (requested via the `id`
argument) and their profile picture of a specific `size`:

```graphql
{
  user(id: 4) {
    id
    name
    profilePic(size: 100)
  }
}
```

Many arguments can exist for a given field:

```graphql
{
  user(id: 4) {
    id
    name
    profilePic(width: 100, height: 50)
  }
}
```

**Arguments are unordered**

Arguments may be provided in any syntactic order and maintain identical
semantic meaning.

These two queries are semantically identical:

```graphql
{
  picture(width: 200, height: 100)
}
```

```graphql
{
  picture(height: 100, width: 200)
}
```


## Field Alias

Alias : Name :

By default, the key in the response object will use the field name
queried. However, you can define a different name by specifying an alias.

In this example, we can fetch two profile pictures of different sizes and ensure
the resulting object will not have duplicate keys:

```graphql
{
  user(id: 4) {
    id
    name
    smallPic: profilePic(size: 64)
    bigPic: profilePic(size: 1024)
  }
}
```

Which returns the result:

```js
{
  "user": {
    "id": 4,
    "name": "Mark Zuckerberg",
    "smallPic": "https://cdn.site.io/pic-4-64.jpg",
    "bigPic": "https://cdn.site.io/pic-4-1024.jpg"
  }
}
```

Since the top level of a query is a field, it also can be given an alias:

```graphql
{
  zuck: user(id: 4) {
    id
    name
  }
}
```

Returns the result:

```js
{
  "zuck": {
    "id": 4,
    "name": "Mark Zuckerberg"
  }
}
```

A field's response key is its alias if an alias is provided, and it is
otherwise the field's name.


## Fragments

FragmentSpread : ... FragmentName Directives?

FragmentDefinition : fragment FragmentName TypeCondition Directives? SelectionSet

FragmentName : Name but not `on`

Fragments are the primary unit of composition in GraphQL.

Fragments allow for the reuse of common repeated selections of fields, reducing
duplicated text in the document. Inline Fragments can be used directly within a
selection to condition upon a type condition when querying against an interface
or union.

For example, if we wanted to fetch some common information about mutual friends
as well as friends of some user:

```graphql
query noFragments {
  user(id: 4) {
    friends(first: 10) {
      id
      name
      profilePic(size: 50)
    }
    mutualFriends(first: 10) {
      id
      name
      profilePic(size: 50)
    }
  }
}
```

The repeated fields could be extracted into a fragment and composed by
a parent fragment or query.

```graphql
query withFragments {
  user(id: 4) {
    friends(first: 10) {
      ...friendFields
    }
    mutualFriends(first: 10) {
      ...friendFields
    }
  }
}

fragment friendFields on User {
  id
  name
  profilePic(size: 50)
}
```

Fragments are consumed by using the spread operator (`...`).  All fields selected
by the fragment will be added to the query field selection at the same level
as the fragment invocation. This happens through multiple levels of fragment
spreads.

For example:

```graphql
query withNestedFragments {
  user(id: 4) {
    friends(first: 10) {
      ...friendFields
    }
    mutualFriends(first: 10) {
      ...friendFields
    }
  }
}

fragment friendFields on User {
  id
  name
  ...standardProfilePic
}

fragment standardProfilePic on User {
  profilePic(size: 50)
}
```

The queries `noFragments`, `withFragments`, and `withNestedFragments` all
produce the same response object.


### Type Conditions

TypeCondition : on NamedType

Fragments must specify the type they apply to. In this example, `friendFields`
can be used in the context of querying a `User`.

Fragments cannot be specified on any input value (scalar, enumeration, or input
object).

Fragments can be specified on object types, interfaces, and unions.

Selections within fragments only return values when concrete type of the object
it is operating on matches the type of the fragment.

For example in this query on the Facebook data model:

```graphql
query FragmentTyping {
  profiles(handles: ["zuck", "cocacola"]) {
    handle
    ...userFragment
    ...pageFragment
  }
}

fragment userFragment on User {
  friends {
    count
  }
}

fragment pageFragment on Page {
  likers {
    count
  }
}
```

The `profiles` root field returns a list where each element could be a `Page` or a
`User`. When the object in the `profiles` result is a `User`, `friends` will be
present and `likers` will not. Conversely when the result is a `Page`, `likers`
will be present and `friends` will not.

```js
{
  "profiles": [
    {
      "handle": "zuck",
      "friends": { "count" : 1234 }
    },
    {
      "handle": "cocacola",
      "likers": { "count" : 90234512 }
    }
  ]
}
```


### Inline Fragments

InlineFragment : ... TypeCondition? Directives? SelectionSet

Fragments can be defined inline within a selection set. This is done to
conditionally include fields based on their runtime type. This feature of
standard fragment inclusion was demonstrated in the `query FragmentTyping`
example. We could accomplish the same thing using inline fragments.

```graphql
query inlineFragmentTyping {
  profiles(handles: ["zuck", "cocacola"]) {
    handle
    ... on User {
      friends {
        count
      }
    }
    ... on Page {
      likers {
        count
      }
    }
  }
}
```

Inline fragments may also be used to apply a directive to a group of fields.
If the TypeCondition is omitted, an inline fragment is considered to be of the
same type as the enclosing context.

```graphql
query inlineFragmentNoType($expandedInfo: Boolean) {
  user(handle: "zuck") {
    id
    name
    ... @include(if: $expandedInfo) {
      firstName
      lastName
      birthday
    }
  }
}
```


## Input Values

Value[Const] :
  - [~Const] Variable
  - IntValue
  - FloatValue
  - StringValue
  - BooleanValue
  - NullValue
  - EnumValue
  - ListValue[?Const]
  - ObjectValue[?Const]

Field and directive arguments accept input values of various literal primitives;
input values can be scalars, enumeration values, lists, or input objects.

If not defined as constant (for example, in {DefaultValue}), input values can be
specified as a variable. List and inputs objects may also contain variables (unless defined to be constant).


### Int Value

IntValue :: IntegerPart

IntegerPart ::
  - NegativeSign? 0
  - NegativeSign? NonZeroDigit Digit*

NegativeSign :: -

Digit :: one of 0 1 2 3 4 5 6 7 8 9

NonZeroDigit :: Digit but not `0`

An Int number is specified without a decimal point or exponent (ex. `1`).


### Float Value

FloatValue ::
  - IntegerPart FractionalPart
  - IntegerPart ExponentPart
  - IntegerPart FractionalPart ExponentPart

FractionalPart :: . Digit+

ExponentPart :: ExponentIndicator Sign? Digit+

ExponentIndicator :: one of `e` `E`

Sign :: one of + -

A Float number includes either a decimal point (ex. `1.0`) or an exponent
(ex. `1e50`) or both (ex. `6.0221413e23`).


### Boolean Value

BooleanValue : one of `true` `false`

The two keywords `true` and `false` represent the two boolean values.


### String Value

StringValue ::
  - `""`
  - `"` StringCharacter+ `"`

StringCharacter ::
  - SourceCharacter but not `"` or \ or LineTerminator
  - \u EscapedUnicode
  - \ EscapedCharacter

EscapedUnicode :: /[0-9A-Fa-f]{4}/

EscapedCharacter :: one of `"` \ `/` b f n r t

Strings are sequences of characters wrapped in double-quotes (`"`). (ex.
`"Hello World"`). White space and other otherwise-ignored characters are
significant within a string value.

Note: Unicode characters are allowed within String value literals, however
GraphQL source must not contain some ASCII control characters so escape
sequences must be used to represent these characters.

**Semantics**

StringValue :: `""`

  * Return an empty Unicode character sequence.

StringValue :: `"` StringCharacter+ `"`

  * Return the Unicode character sequence of all {StringCharacter}
    Unicode character values.

StringCharacter :: SourceCharacter but not `"` or \ or LineTerminator

  * Return the character value of {SourceCharacter}.

StringCharacter :: \u EscapedUnicode

  * Return the character whose code unit value in the Unicode Basic Multilingual
    Plane is the 16-bit hexadecimal value {EscapedUnicode}.

StringCharacter :: \ EscapedCharacter

  * Return the character value of {EscapedCharacter} according to the table below.

| Escaped Character | Code Unit Value | Character Name               |
| ----------------- | --------------- | ---------------------------- |
| `"`               | U+0022          | double quote                 |
| `\`               | U+005C          | reverse solidus (back slash) |
| `/`               | U+002F          | solidus (forward slash)      |
| `b`               | U+0008          | backspace                    |
| `f`               | U+000C          | form feed                    |
| `n`               | U+000A          | line feed (new line)         |
| `r`               | U+000D          | carriage return              |
| `t`               | U+0009          | horizontal tab               |


### Null Value

NullValue : `null`

Null values are represented as the keyword {null}.

GraphQL has two semantically different ways to represent the lack of a value:

  * Explicitly providing the literal value: {null}.
  * Implicitly not providing a value at all.

For example, these two field calls are similar, but are not identical:

```graphql
{
  field(arg: null)
  field
}
```

The first has explictly provided {null} to the argument "arg", while the second
has implicitly not provided a value to the argument "arg". These two forms may
be interpreted differently. For example, a mutation representing deleting a
field vs not altering a field, respectively. Neither form may be used for an
input expecting a Non-Null type.

Note: The same two methods of representing the lack of a value are possible via
variables by either providing the a variable value as {null} and not providing
a variable value at all.


### Enum Value

EnumValue : Name but not `true`, `false` or `null`

Enum values are represented as unquoted names (ex. `MOBILE_WEB`). It is
recommended that Enum values be "all caps". Enum values are only used in
contexts where the precise enumeration type is known. Therefore it's not
necessary to supply an enumeration type name in the literal.


### List Value

ListValue[Const] :
  - [ ]
  - [ Value[?Const]+ ]

Lists are ordered sequences of values wrapped in square-brackets `[ ]`. The
values of a List literal may be any value literal or variable (ex. `[1, 2, 3]`).

Commas are optional throughout GraphQL so trailing commas are allowed and repeated
commas do not represent missing values.

**Semantics**

ListValue : [ ]

  * Return a new empty list value.

ListValue : [ Value+ ]

  * Let {inputList} be a new empty list value.
  * For each {Value+}
    * Let {value} be the result of evaluating {Value}.
    * Append {value} to {inputList}.
  * Return {inputList}


### Input Object Values

ObjectValue[Const] :
  - { }
  - { ObjectField[?Const]+ }

ObjectField[Const] : Name : Value[?Const]

Input object literal values are unordered lists of keyed input values wrapped in
curly-braces `{ }`.  The values of an object literal may be any input value
literal or variable (ex. `{ name: "Hello world", score: 1.0 }`). We refer to
literal representation of input objects as "object literals."

**Input object fields are unordered**

Input object fields may be provided in any syntactic order and maintain
identical semantic meaning.

These two queries are semantically identical:

```graphql
{
  nearestThing(location: { lon: 12.43, lat: -53.211 })
}
```

```graphql
{
  nearestThing(location: { lat: -53.211, lon: 12.43 })
}
```

**Semantics**

ObjectValue : { }

  * Return a new input object value with no fields.

ObjectValue : { ObjectField+ }

  * Let {inputObject} be a new input object value with no fields.
  * For each {field} in {ObjectField+}
    * Let {name} be {Name} in {field}.
    * Let {value} be the result of evaluating {Value} in {field}.
    * Add a field to {inputObject} of name {name} containing value {value}.
  * Return {inputObject}


## Variables

Variable : $ Name

VariableDefinitions : ( VariableDefinition+ )

VariableDefinition : Variable : Type DefaultValue?

DefaultValue : = Value[Const]

A GraphQL query can be parameterized with variables, maximizing query reuse,
and avoiding costly string building in clients at runtime.

If not defined as constant (for example, in {DefaultValue}), a {Variable} can be
supplied for an input value.

Variables must be defined at the top of an operation and are in scope
throughout the execution of that operation.

In this example, we want to fetch a profile picture size based on the size
of a particular device:

```graphql
query getZuckProfile($devicePicSize: Int) {
  user(id: 4) {
    id
    name
    profilePic(size: $devicePicSize)
  }
}
```

Values for those variables are provided to a GraphQL service along with a
request so they may be substituted during execution. If providing JSON for the
variables' values, we could run this query and request profilePic of
size `60` width:

```js
{
  "devicePicSize": 60
}
```

**Variable use within Fragments**

Query variables can be used within fragments. Query variables have global scope
with a given operation, so a variable used within a fragment must be declared
in any top-level operation that transitively consumes that fragment. If
a variable is referenced in a fragment and is included by an operation that does
not define that variable, the operation cannot be executed.


## Input Types

Type :
  - NamedType
  - ListType
  - NonNullType

NamedType : Name

ListType : [ Type ]

NonNullType :
  - NamedType !
  - ListType !

GraphQL describes the types of data expected by query variables. Input types
may be lists of another input type, or a non-null variant of any other
input type.

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


## Directives

Directives : Directive+

Directive : @ Name Arguments?

Directives provide a way to describe alternate runtime execution and type
validation behavior in a GraphQL document.

In some cases, you need to provide options to alter GraphQL's execution
behavior in ways field arguments will not suffice, such as conditionally
including or skipping a field. Directives provide this by describing additional information to the executor.

Directives have a name along with a list of arguments which may accept values
of any input type.

Directives can be used to describe additional information for types, fields, fragments
and operations.

As future versions of GraphQL adopt new configurable execution capabilities,
they may be exposed via directives.
