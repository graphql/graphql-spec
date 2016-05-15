# 语言Language

客户端利用GraphQL 查询语言向 GraphQL 服务发送请求，我们把这些请求源称之为文档。
一份文档可能会包含操作(查询和mutation都是操作)和片段(可以用做查询复用的通用组件)。

Clients use the GraphQL query language to make requests to a GraphQL service.
We refer to these request sources as documents. A document may contain
operations (queries and mutations are both operations) as well as fragments, a
common unit of composition allowing for query reuse.

一份GraphQL的文档语法结构定义中终结符是token(不可再分割的词汇单元)。这些token定义的词汇语法能够匹配源字符的模式(使用双冒号来定义"::")

A GraphQL document is defined as a syntactic grammar where terminal symbols are
tokens (indivisible lexical units). These tokens are defined in a lexical
grammar which matches patterns of source characters (defined by a
double-colon `::`).


## Source Text

SourceCharacter :: "Any Unicode character"


GraphQL文档可以表示成[Unicode](http://unicode.org/standard/standard.html)的序列。但是
除了很少的例外情况，大多数GraphQL只是使用传统的ASCII范围来表示，这样子尽可能多地兼容众多已经存在的工具、语言和序列化格式。
除了comment里面会出现之外，非-ASCII Unicode字符只存在于{StringValue}中。

GraphQL documents are expressed as a sequence of
[Unicode](http://unicode.org/standard/standard.html) characters. However, with
few exceptions, most of GraphQL is expressed only in the original ASCII range
so as to be as widely compatible with as many existing tools, languages, and
serialization formats as possible. Other than within comments, Non-ASCII Unicode
characters are only found within {StringValue}.


### 空格 White Space

WhiteSpace ::
  - "Horizontal Tab (U+0009)"
  - "Vertical Tab (U+000B)"
  - "Form Feed (U+000C)"
  - "Space (U+0020)"
  - "No-break Space (U+00A0)"

空格用来提高source text的可读性，用于分隔token，在任意token的前后可能会存在任意个空格。token之间的空格对于GraphQL 查询文档的语义是不重要的，但{String} or {Comment} 类型的token中可能会存在空格。

White space is used to improve legibility of source text and act as separation
between tokens, and any amount of white space may appear before or after any
token. White space between tokens is not significant to the semantic meaning of
a GraphQL query document, however white space characters may appear within a
{String} or {Comment} token.


### 行尾字符Line Terminators

LineTerminator ::
  - "New Line (U+000A)"
  - "Carriage Return (U+000D)"
  - "Line Separator (U+2028)"
  - "Paragraph Separator (U+2029)"


和空格一样，行尾字符用于提高source text的可读性，在任意token的前后可能会存在任意个空格。token之间的空格对于GraphQL 查询文档的语义是不重要的。任何token之内是不存在行尾字符的。

Like white space, line terminators are used to improve the legibility of source
text, any amount may appear before or after any other token and have no
significance to the semantic meaning of a GraphQL query document. Line
terminators are not found within any other token.


### 注释 Comments

Comment :: `#` CommentChar*

CommentChar :: SourceCharacter but not LineTerminator


GraphQL source document 可能会包含单行的注释，行首是{`#`}。

GraphQL source documents may contain single-line comments, starting with the
{`#`} marker.

一段注释可以包括除了 {LineTerminator} 之外的任意Unicode code point，所以一段注释往往包含了以{`#`}开头的出line terminator 行尾字符之外的所有code point。

A comment can contain any Unicode code point except {LineTerminator} so a
comment always consists of all code points starting with the {`#`} character up
to but not including the line terminator.

注释和空格一样，可能会出现在token的后面，或者行尾字符的前面，但是对于GraphQL 查询文档的语义毫无意义。

Comments behave like white space and may appear after any token, or before a
line terminator, and have no significance to the semantic meaning of a GraphQL
query document.


### Insignificant Commas

Comma :: ,



与空格、行尾字符一样，逗号({`,`}) 用于提高source text的可读性，分隔lexical tokens ，但不同的是，在GraphQL查询文档中，语法上和语义上都是毫无意义的。

Similar to white space and line terminators, commas ({`,`}) are used to improve
the legibility of source text and separate lexical tokens but are otherwise
syntactically and semantically insignificant within GraphQL query documents.

无意义的逗号字符保证了逗号的存在与否都不会从语义上改变对文档的语法解析，这种用户错误在其他语言中是很常见的。同时，也允许将trailing commas 或line-terminators用于
list分隔符，二者都是为了源代码的可读性和可维护性而存在。

Non-significant comma characters ensure that the absence or presence of a comma
does not meaningfully alter the interpreted syntax of the document, as this can
be a common user-error in other languages. It also allows for the stylistic use
of either trailing commas or line-terminators as list delimiters which are both
often desired for legibility and maintainability of source code.


### 词法token Lexical Tokens


Token ::
  - Punctuator
  - Name
  - IntValue
  - FloatValue
  - StringValue


一份 GraphQL 文档由多种不可分割的lexical token组成。这里通过source Unicode 字符的不同模式以lexical语法定义了lexical token。

A GraphQL document is comprised of several kinds of indivisible lexical tokens
defined here in a lexical grammar by patterns of source Unicode characters.

Token 在后面的GraphQL 查询文档 syntactic grammars 中用作terminal symbols。

Tokens are later used as terminal symbols in a GraphQL query document syntactic
grammars.

### 可忽略的token Ignored Tokens

Ignored ::
  - WhiteSpace
  - LineTerminator
  - Comment
  - Comma

在每个lexical token的前后可能会有任意数量的可忽略的 ignored token，其中包括了 {WhiteSpace} and {Comment}。一份文档的不可忽略部分是很重要的，
但可忽略的source character可能会存在于lexical token内，并且是有意义的，比如 {String} 可能包含空格字符。

Before and after every lexical token may be any amount of ignored tokens
including {WhiteSpace} and {Comment}. No ignored regions of a source
document are significant, however ignored source characters may appear within
a lexical token in a significant way, for example a {String} may contain white
space characters.

在解析任意给定的token时，不会忽略任何字符，打个比方，在定义一个 {FloatValue}的字符中间是不允许存在空格的。

No characters are ignored while parsing a given token, as an example no
white space characters are permitted between the characters defining a
{FloatValue}.


### 标点符号 Punctuators

Punctuator :: one of ! $ ( ) ... : = @ [ ] { }


GraphQL 文档包含标点符号是为了描述结构。GraphQL 是一种数据描述语言而非编程语言，因此没有表示数学表达式的运算符。

GraphQL documents include punctuation in order to describe structure. GraphQL
is a data description language and not a programming language, therefore GraphQL
lacks the punctionation often used to describe mathematical expressions.


### Names

Name :: /[_A-Za-z][_0-9A-Za-z]*/


GraphQL 查询文档中全是有名称的内容：operations操作, fields字段, arguments,
directives命令, fragments, and variables变量。所有名称都必须遵循同样的语法格式。

GraphQL query documents are full of named things: operations, fields, arguments,
directives, fragments, and variables. All names must follow the same
grammatical form.

GraphQL 中的名称是大小写敏感的。也就是说 `name`, `Name`, and `NAME`指的都是不同的名称。下划线也是有意义的，意味着`other_name` and `othername`是两个不同的名称。

Names in GraphQL are case-sensitive. That is to say `name`, `Name`, and `NAME`
all refer to different names. Underscores are significant, which means
`other_name` and `othername` are two different names.

GraphQL 名称中的字符仅限于<acronym>ASCII</acronym>的子集， 一些可能的字符，是为了支持与尽可能多的系统互联互通。

Names in GraphQL are limited to this <acronym>ASCII</acronym> subset of possible
characters to support interoperation with as many other systems as possible.


## Query Document

Document : Definition+

Definition :
  - OperationDefinition
  - FragmentDefinition

GraphQL 查询文档描述了GraphQL服务所接收的整个文件或请求串。一份文档包含了多个Operation操作和Fragment的定义。只有当文档中包含operation操作时服务器才会执行一份
GraphQL查询文档。然而，不包含operation的文档仍然可以被解析和校验，这样，客户端就能够通过多个文档来表示单个请求。

A GraphQL query document describes a complete file or request string received by
a GraphQL service. A document contains multiple definitions of Operations and
Fragments. GraphQL query documents are only executable by a server if they
contain an operation. However documents which do not contain operations may
still be parsed and validated to allow client to represent a single request
across many documents.

如果查询文档只包含一个operation，该operation可能是用shorthand模式表示的，也就是说其中省略了operation的名称和查询的关键词。否则，如果一份查询文档包含多个operation，每个operation必须有名称。当提交一份包含多个operation的查询文档到一个GraphQL服务时，必须提供你想要执行的哪个operation的名称。

If a query document contains only one query operation, that operation may be
represented in the shorthand form, which omits the query keyword and
operation name. Otherwise, if a GraphQL query document contains multiple
operations, each operation must be named. When submitting a query document with
multiple operations to a GraphQL service, the name of the desired operation to
be executed must also be provided.


### Operations

OperationDefinition :
  - OperationType Name VariableDefinitions? Directives? SelectionSet
  - SelectionSet

OperationType : one of `query` `mutation`

GraphQL 中有2类operation：
There are two types of operations that GraphQL models:

  * query - 只读的获取操作 a read-only fetch.
  * mutation - 获取之后的写操作 a write followed by a fetch.

每个operation都是用一个operation名称和 selection set来表示的。

Each operation is represented by an operation name and a selection set.

**Query shorthand**

如果文档中仅包含一个query operation，query 定义中没有变量variable，也没有directive，该operation可以用shorthand的形式来表示，也就是省略query的 keyword和name。

If a document contains only one query operation, and that query defines no
variables and contains no directives, that operation may be represented in a
short-hand form which omits the query keyword and query name.

比如，shorthand形式的该没有名称的query operation：

For example, this unnamed query operation is written via query shorthand.

```graphql
{
  field
}
```

注意：下面的很多例子会采用shorthand语法形式的query。

Note: many examples below will use the query short-hand syntax.


### Selection Sets

SelectionSet : { Selection+ }

Selection :
  - Field
  - FragmentSpread
  - InlineFragment

一个operation选择一些它所需要的信息集合selection set，仅且只能接收这些信息，避免数据的过度获取和不足。

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

在该query中，`id`, `firstName`, and `lastName`构成了一个selection set。selection set也可以包含frament reference。

In this query, the `id`, `firstName`, and `lastName` fields form a selection
set. Selection sets may also contain fragment references.

### Fields

Field : Alias? Name Arguments? Directives? SelectionSet?

selections set 主要是由 filed字段组成。字段指的是在selections set中请求可访问的具体的信息片段。

A selection set is primarily composed of fields. A field describes one discrete
piece of information available to request within a selection set.

一些filed描述的是与其他数据的关系或复杂的数据。对于多层嵌套的请求而言，为了进一步表达此类数据，一个filed本身也可包含一个selection set。
所有的GraphQL operation必须规定selections到返回 scalar values的field层面来保证响应格式的无歧义。

Some fields describe complex data or relationships to other data. In order to
further explore this data, a field may itself contain a selection set, allowing
for deeply nested requests. All GraphQL operations must specify their selections
down to fields which return scalar values to ensure an unambiguosly
shaped response.

比如，该操作
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

operation最高层级的selection set中的filed通常表示一些系统全局层面可访问的信息和当前的viewer信息。
顶层filed的例子包括对当前已登录viewer的引用，或者是访问某个唯一标识符所引用的特定类型的数据。

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


### Arguments

Arguments : ( Argument+ )

Argument : Name : Value

field是能够返回值的概念上的function函数/功能，偶尔会接收能够改变它们行为的argument。
这些Argument常常可以直接对应到啊GraphQL 服务器实现中的函数argument上去。

Fields are conceptually functions which return values, and occasionally accept
arguments which alter their behavior. These arguments often map directly to
function arguments within a GraphQL server's implementation.

在该例中，我们想查询某个user(通过id argument来请求)以及特殊size的它们的profile picture。

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

一个filed可以有多个argument：

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

Argument可以以任意的次序出现，并且语义是一样的。

Arguments may be provided in any syntactic order and maintain identical
semantic meaning.

从语义上，以下2个query是一致的：

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


### Field Alias

Alias : Name :


默认地，响应对象response对象中的key将会使用查询中的field 名称。然而，你可以通过指定alias的方式定义另一个名称。

By default, the key in the response object will use the field name
queried. However, you can define a different name by specifying an alias.

在该例中，我们获取2份不同size的profile picture，保证2个结果的key不会重复：

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

返回的结果是：

Which returns the result:

```js
{
  "user": {
    "id": 4,
    "name": "Mark",
    "smallPic": "https://cdn.site.io/pic-4-64.jpg",
    "bigPic": "https://cdn.site.io/pic-4-1024.jpg"
  }
}
```

由于query的顶级元素是一个field，也可以给它一个alias：

Since the top level of a query is a field, it also can be given an alias:

```graphql
{
  zuck: user(id: 4) {
    id
    name
  }
}
```

返回的结果是：

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


### Fragments

FragmentSpread : ... FragmentName Directives?

FragmentDefinition : fragment FragmentName on TypeCondition Directives? SelectionSet

FragmentName : Name but not `on`

Fragments是GraphQL中主要的composition单位。

Fragments are the primary unit of composition in GraphQL.

Fragments能够复用通用的可重复的字段的selection，减少文档中文本的重复。当查询某个接口或union时，
可以直接在selection中使用内嵌式fragment来condition upon a type condition。

Fragments allow for the reuse of common repeated selections of fields, reducing
duplicated text in the document. Inline Fragments can be used directly within a
selection to condition upon a type condition when querying against an interface
or union.

比如，如果想要获取互为好友和用户的好友的通用信息：

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

重复的字段field可以被整合成一个fragment，包含在一个父fragment或query当中。

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

利用(`...`)操作符可以来使用Fragment。当调用fragment时，fragment选择的所有field都会被添加到query field selection同一层级。

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

#### Type Conditions

TypeCondition : NamedType

Fragment必须规定它所应用的类型。该例中，`friendFields`可以用在查询`User`.

Fragments must specify the type they apply to. In this example, `friendFields`
can be used in the context of querying a `User`.

Fragment不能用在规定任何输入值中(scalar, enumeration, or input
object)

Fragments cannot be specified on any input value (scalar, enumeration, or input
object).

Fragment可以用在对象类型、接口和集合当中。

Fragments can be specified on object types, interfaces, and unions.

fragment中的selection只有在它所操作的对象的具体类型与fragment的类型匹配时才能返回值。

Selections within fragments only return values when concrete type of the object
it is operating on matches the type of the fragment.

比如，如下是对Facebook数据模型的查询：

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

`profiles`根字段返回的列表中每个元素可以是`Page` 或`User`。如果`profiles`中返回的对象是`User`,会存在`friends`，`likers` 则不会。相反，如果返回的对象是
`Page`, `likers`会存在，而`friends` 则不会。

The `profiles` root field returns a list where each element could be a `Page` or a
`User`. When the object in the `profiles` result is a `User`, `friends` will be
present and `likers` will not. Conversely when the result is a `Page`, `likers`
will be present and `friends` will not.

```js
{
  "profiles" : [
    {
      "handle" : "zuck",
      "friends" : { "count" : 1234 }
    },
    {
      "handle" : "cocacola",
      "likers" : { "count" : 90234512 }
    }
  ]
}
```

#### Inline Fragments

InlineFragment : ... on TypeCondition Directives? SelectionSet

在一个selection set中，可以定义内嵌Fragment。这样子做，就可以按照情况，根据运行时的类型来包含字段。在`query FragmentTyping`的例子中演示了
这种 standard fragment inclusion。我们也可以通过内嵌式Fragment来达到同样的效果。

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


### Input Values

Value[Const] :
  - [~Const] Variable
  - IntValue
  - FloatValue
  - StringValue
  - BooleanValue
  - EnumValue
  - ListValue[?Const]
  - ObjectValue[?Const]

Field 和directive argument 的输入值可以是多种基本数据类型：scalars、枚举值、列表和对象。

Field and directive arguments accept input values of various literal primitives;
input values can be scalars, enumeration values, lists, or input objects.

如果没有定义成固定值(比方说，在{DefaultValue}中)，输入值可以指定成variable。List和输入对象也可以包含variable(除非定义成固定值)

If not defined as constant (for example, in {DefaultValue}), input values can be
specified as a variable. List and inputs objects may also contain variables (unless defined to be constant).

#### Int Value

IntValue :: IntegerPart

IntegerPart ::
  - NegativeSign? 0
  - NegativeSign? NonZeroDigit Digit*

NegativeSign :: -

Digit :: one of 0 1 2 3 4 5 6 7 8 9

NonZeroDigit :: Digit but not `0`

Int数字 number指的是不包含小数点和指数的数字。

An Int number is specified without a decimal point or exponent (ex. `1`).

#### Float Value

FloatValue ::
  - IntegerPart FractionalPart
  - IntegerPart ExponentPart
  - IntegerPart FractionalPart ExponentPart

FractionalPart :: . Digit+

ExponentPart :: ExponentIndicator Sign? Digit+

ExponentIndicator :: one of `e` `E`

Sign :: one of + -

Float 数字包括小数点(ex. `1.0`)或指数(ex. `1e50`)或两者都有 (ex. `6.0221413e23`).

A Float number includes either a decimal point (ex. `1.0`) or an exponent
(ex. `1e50`) or both (ex. `6.0221413e23`).

#### Boolean Value

BooleanValue : one of `true` `false`

 关键词`true` and `false` 表示boolean值。
 
The two keywords `true` and `false` represent the two boolean values.

#### String Value

StringValue ::
  - `""`
  - `"` StringCharacter+ `"`

StringCharacter ::
  - SourceCharacter but not `"` or \ or LineTerminator
  - \ EscapedUnicode
  - \ EscapedCharacter

EscapedUnicode :: u /[0-9A-Fa-f]{4}/

EscapedCharacter :: one of `"` \ `/` b f n r t

String就是用`"`引起来的字符的列表(ex.`"Hello World"`)。在字符串值中空格和其他otherwise-ignored字符都是很重要的。

Strings are lists of characters wrapped in double-quotes `"`. (ex.
`"Hello World"`). White space and other otherwise-ignored characters are
significant within a string value.

#### Enum Value

EnumValue : Name but not `true`, `false` or `null`

Enum值是用没有引号的name来表示的 (ex. `MOBILE_WEB`)。建议枚举值Enum值全部大写。只有当具体的枚举类型明确的时候才能使用枚举值。因此，在literal中
提供枚举类型名称是没有必要的。

Enum values are represented as unquoted names (ex. `MOBILE_WEB`). It is
recommended that Enum values be "all caps". Enum values are only used in
contexts where the precise enumeration type is known. Therefore it's not
necessary to supply an enumeration type name in the literal.

为了避免混淆，枚举值不允许为“null”。GraphQL中并没有值可以用来表示{null}概念。

An enum value cannot be "null" in order to avoid confusion. GraphQL
does not supply a value literal to represent the concept {null}.

#### List Value

ListValue[Const] :
  - [ ]
  - [ Value[?Const]+ ]

List是用`[ ]`包起来的值的有序序列。List literal字面值可能是任意的literal或variable (ex. `[1, 2, 3]`).

Lists are ordered sequences of values wrapped in square-brackets `[ ]`. The
values of a List literal may be any value literal or variable (ex. `[1, 2, 3]`).

所有GraphQL中都可以选择使用逗号，因此是允许在末尾使用逗号的，重复的逗号并不表示缺失值。

Commas are optional throughout GraphQL so trailing commas are allowed and repeated
commas do not represent missing values.

**Semantics**

ListValue : [ ]

  * 返回一个空列表值Return a new empty list value.

ListValue : [ Value+ ]

  * 将{inputList}作为一个新的空列表值 Let {inputList} be a new empty list value.
  * 对于其中每个{Value+} For each {Value+}
    * 将 {value}值作为 {Value}评估的结果 Let {value} be the result of evaluating {Value}.
    * 将{value}添加到{inputList}中 Append {value} to {inputList}.
  * 返回 {inputList} Return {inputList}

#### Input Object Values

ObjectValue[Const] :
  - { }
  - { ObjectField[?Const]+ }

ObjectField[Const] : Name : Value[?Const]

input object literal values是用花括号`{ }`包起来的带键的输入值的无序列表。对象字面值可以是任何输入值literal或者variable(ex. `{ name: "Hello world", score: 1.0 }`)。我们把input object的literal representation称之为"object literals."

Input object literal values are unordered lists of keyed input values wrapped in
curly-braces `{ }`.  The values of an object literal may be any input value
literal or variable (ex. `{ name: "Hello world", score: 1.0 }`). We refer to
literal representation of input objects as "object literals."

**Semantics**

ObjectValue : { }

  * 返回没有任何field的新的input object值 Return a new input object value with no fields.

ObjectValue : { ObjectField+ }

  * 将  {inputObject} 作为一个不带任何field的新的input object Let {inputObject} be a new input object value with no fields.
  * 对于{ObjectField+}中的每个{field} For each {field} in {ObjectField+}
    * 将{name}作为{field}的{Name} Let {name} be {Name} in {field}.
    * 如果 {inputObject} 包含一个名称为 {name}的字段则报语法错误 If {inputObject} contains a field named {name} throw Syntax Error.
    * 将 {value} 作为{field}中 {Value} 评估的结果 Let {value} be the result of evaluating {Value} in {field}.
    * Add a field to {inputObject} of name {name} containing value {value}.
  * Return {inputObject}


### Variables

Variable : $ Name

VariableDefinitions : ( VariableDefinition+ )

VariableDefinition : Variable : Type DefaultValue?

DefaultValue : = Value[Const]

GraphQL query 可以使用variable来参数化，最大化对query的复用，避免客户端在运行时构建string所带来的成本。

A GraphQL query can be parameterized with variables, maximizing query reuse,
and avoiding costly string building in clients at runtime.

如果并不是定义成常量constant(比如，在{DefaultValue})中，)，{Variable} 可以作为任意的input value输入值。

If not defined as constant (for example, in {DefaultValue}), a {Variable} can be
supplied for an input value.

Variable 必须在operation的最高层级来定义，操作执行的整个范围。

Variables must be defined at the top of an operation and are in scope
throughout the execution of that operation.

在该例中，我们想要根据特定设备的大小来获取profile picture的大小：

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

在请求中把变量值提供给GraphQL 服务，这样子在执行请求时就可以替换。如果变量值是json，我们就能够运行该query，请求大小为`60` width的profilePic：

Values for those variables are provided to a GraphQL service along with a
request so they may be substituted during execution. If providing JSON for the
variables' values, we could run this query and request profilePic of
size `60` width:

```js
{
  "devicePicSize": 60
}
```

#### Variable use within Fragments

查询变量也可以用在fragment中。查询变量属于某个操作的全局范围，因此在fragment中用到的变量必须在操作的任意顶级进行声明来传递到fragment中。
如果是在fragment中引用variable，而且该operation并没有定义该变量，则该operation无法执行。

Query variables can be used within fragments. Query variables have global scope
with a given operation, so a variable used within a fragment must be declared
in any top-level operation that transitively consumes that fragment. If
a variable is referenced in a fragment and is included by an operation that does
not define that variable, the operation cannot be executed.


### Input Types

Type :
  - NamedType
  - ListType
  - NonNullType

NamedType : Name

ListType : [ Type ]

NonNullType :
  - NamedType !
  - ListType !

GraphQL 中描述了查询变量 query variable想要的数据类型。input type可以是其他input type的list列表，或者任意其他input type的非空variant。

GraphQL describes the types of data expected by query variables. Input types
may be lists of another input type, or a non-null variant of any other
input type.

**Semantics**

Type : Name

  * 将 {name} 作为{Name}字符串值。Let {name} be the string value of {Name}
  * 将 {type} 作为在Schema定义中名称为{name}的类型。Let {type} be the type defined in the Schema named {name}
  * {type} 不能为 {type} 。{type} must not be {null}
  * 返回 {type}。Return {type}

Type : [ Type ]

  * 将 {itemType}作为评估{Type}的结果。Let {itemType} be the result of evaluating {Type}
  * 将{type}作为一个List type，其中包含 {itemType}。Let {type} be a List type where {itemType} is the contained type.
  * 返回 {type}。Return {type}

Type : Type !

  * 将 {nullableType}作为评估{Type}的结果。Let {nullableType} be the result of evaluating {Type}
  * Let {type} be a Non-Null type where {nullableType} is the contained type.
  * Return {type}


### Directives

Directives : Directive+

Directive : @ Name Arguments?

Directives 提供了一种在GraphQL 文档中描述其他运行时执行和类型校验行为的方式。

Directives provide a way to describe alternate runtime execution and type
validation behavior in a GraphQL document.

在一些情况下，你需要在field argument不足的时候改变GraphQL运行行为的选项，比如根据条件纳入或忽略某个field。通过为执行器描述额外信息来提供此类Directive。

In some cases, you need to provide options to alter GraphQL's execution
behavior in ways field arguments will not suffice, such as conditionally
including or skipping a field. Directives provide this by describing additional information to the executor.

Directives有名称和可接受任意input type值的列表。

Directives have a name along with a list of arguments which may accept values
of any input type.

Directive可以为field、fragment和operation描述额外信息。

Directives can be used to describe additional information for fields, fragments,
and operations.

随着GraphQL的后续版本应用新的可配置的执行功能，可能会通过directive来暴露。

As future versions of GraphQL adopts new configurable execution capabilities,
they may be exposed via directives.

#### Fragment Directives

Fragment可能会包含directive来改变自身的行为。在运行时，fragment中包含的directive会取代描述在定义中的directive。

Fragments may include directives to alter their behavior. At runtime, the directives provided on a fragment spread override those described on the
definition.

比如，以下查询：

For example, the following query:

```graphql
query hasConditionalFragment($condition: Boolean) {
  ...maybeFragment @include(if: $condition)
}

fragment maybeFragment on Query {
  me {
    name
  }
}
```


和如下的运行时行为是一模一样的

Will have identical runtime behavior as

```graphql
query hasConditionalFragment($condition: Boolean) {
  ...maybeFragment
}

fragment maybeFragment on Query @include(if: $condition) {
  me {
    name
  }
}
```

FragmentSpreadDirectives(fragmentSpread) :
  * Let {directives} be the set of directives on {fragmentSpread}
  * Let {fragmentDefinition} be the FragmentDefinition in the document named {fragmentSpread} refers to.
  * For each {directive} in directives on {fragmentDefinition}
    * If {directives} does not contain a directive named {directive}.
    * Add {directive} into {directives}
  * Return {directives}