# 语言 Language

客户端利用 GraphQL 查询语言向 GraphQL 服务发送请求，我们把这些请求源称之为 document(文档)。
一份 document(文档)可能会包含若干 operations(操作)(queries, mutations, and subscriptions)和 fragment(片段)(可以在查询中复用的通用组件)。

Clients use the GraphQL query language to make requests to a GraphQL service.
We refer to these request sources as documents. A document may contain
operations (queries, mutations, and subscriptions) as well as fragments, a
common unit of composition allowing for query reuse.

一份 GraphQL 的 document(文档)语法结构定义中终结符是 token(不可再分割的词汇单元)。这些 token 定义的词汇语法能够匹配源字符的模式(使用双冒号来定义"::")

A GraphQL document is defined as a syntactic grammar where terminal symbols are
tokens (indivisible lexical units). These tokens are defined in a lexical
grammar which matches patterns of source characters (defined by a
double-colon `::`).


## Source Text

SourceCharacter :: /[\u0009\u000A\u000D\u0020-\uFFFF]/

GraphQL document(文档)可以用[Unicode](http://unicode.org/standard/standard.html)的序列开表示。但除了很少的例外情况，大多数 GraphQL 只是使用传统的 ASCII 范围来表示，这样子尽可能多地兼容众多已经存在的工具、语言和序列化格式，避免文本编辑器和 source control 中出现显示错误。


GraphQL documents are expressed as a sequence of
[Unicode](http://unicode.org/standard/standard.html) characters. However, with
few exceptions, most of GraphQL is expressed only in the original ASCII range
so as to be as widely compatible with as many existing tools, languages, and
serialization formats as possible and avoid display issues in text editors and source control.






### Unicode

UnicodeBOM :: "Byte Order Mark (U+FEFF)"


除了comment里面会出现之外，非-ASCII Unicode字符只存在于{StringValue}中。

Non-ASCII Unicode characters may freely appear within {StringValue} and
{Comment} portions of GraphQL.

"Byte Order Mark" (字节顺序标记) 是一种特殊的 Unicode 字符，可能会出现在包含了 Unicode 的文件开头，供应用程序来决定文本流是 Unicode 编码的，文笨流采用何种字节顺序，采用何种 Unicode encodings 来解读。

The "Byte Order Mark" is a special Unicode character which
may appear at the beginning of a file containing Unicode which programs may use
to determine the fact that the text stream is Unicode, what endianness the text
stream is in, and which of several Unicode encodings to interpret.

### 空格 White Space

WhiteSpace ::
  - "Horizontal Tab (U+0009)"
  - "Space (U+0020)"

空格用于提高 source text的可读性，可以用作 token 间的分隔符，在任意 token 的前后可能会存在任意个空格。对于 GraphQL query document(查询文档)的语义，token 之间的空格并不重要，但{String} or {Comment} 类型的 token 中也可能会存在空格。

White space is used to improve legibility of source text and act as separation
between tokens, and any amount of white space may appear before or after any
token. White space between tokens is not significant to the semantic meaning of
a GraphQL query document, however white space characters may appear within a
{String} or {Comment} token.


注意：GraphQL 并不会将 Unicode "Zs" 类型的字符当做空格，是为了避免文本编辑器和source control 工具产生误解。

Note: GraphQL intentionally does not consider Unicode "Zs" category characters
as white-space, avoiding misinterpretation by text editors and source
control tools.




### 行终止符 Line Terminators


LineTerminator ::
  - "New Line (U+000A)"
  - "Carriage Return (U+000D)" [ lookahead ! "New Line (U+000A)" ]
  - "Carriage Return (U+000D)" "New Line (U+000A)"


和空格一样，行尾字符用于提高 source text 的可读性，在任意 token 的前后可能会存在任意个行终止符。对于 GraphQL query document(查询文档)的语义，token 之间的行终止符并不重要。任何其他 token之内是不存在行终止符的。

Like white space, line terminators are used to improve the legibility of source
text, any amount may appear before or after any other token and have no
significance to the semantic meaning of a GraphQL query document. Line
terminators are not found within any other token.


注意：在任何错误上报需要提供出错语法的 source 所在行号时，都应当使用 {LineTerminator}前面的值来作为行号。

Note: Any error reporting which provide the line number in the source of the
offending syntax should use the preceding amount of {LineTerminator} to produce
the line number.


### 注释 Comments

Comment :: `#` CommentChar*

CommentChar :: SourceCharacter but not LineTerminator


GraphQL source document 可能会包含单行的注释，行首是{`#`}。

GraphQL source documents may contain single-line comments, starting with the
{`#`} marker.

一段注释可以包括除了 {LineTerminator} 之外的任意 Unicode code point，所以一段注释往往由以{`#`}开头的除 line terminator(行终止符) 之外的所有code point构成。

A comment can contain any Unicode code point except {LineTerminator} so a
comment always consists of all code points starting with the {`#`} character up
to but not including the line terminator.

注释和空格一样，可能会出现在 token 的后面，或者行终止符的前面，但是对于GraphQL query document(查询文档)的语义并不重要。

Comments behave like white space and may appear after any token, or before a
line terminator, and have no significance to the semantic meaning of a GraphQL
query document.


### Insignificant Commas

Comma :: ,



与空格、行终止符一样，逗号({`,`}) 用于提高 source text 的可读性，用作lexical tokens 的分隔符，但不同的是，在 GraphQL query document(查询文档)中，语法上和语义上都是毫无意义的。

Similar to white space and line terminators, commas ({`,`}) are used to improve
the legibility of source text and separate lexical tokens but are otherwise
syntactically and semantically insignificant within GraphQL query documents.

无意义的逗号字符保证了逗号的存在与否都不会从语义上改变对文档的语法解析，这种用户错误在其他语言中是很常见的。同时，也允许将 trailing commas 或line-terminators(行终止符)用于
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


一份 GraphQL document(文档)由多种不可分割的 lexical token 组成。这里通过 source Unicode 字符的不同模式以 lexical 语法定义了lexical token。

A GraphQL document is comprised of several kinds of indivisible lexical tokens
defined here in a lexical grammar by patterns of source Unicode characters.

Token 在后续的 GraphQL 查询文档 syntactic grammars 中用作 terminal symbols。

Tokens are later used as terminal symbols in a GraphQL query document syntactic
grammars.

### 可忽略的token Ignored Tokens

Ignored ::
  - UnicodeBOM
  - WhiteSpace
  - LineTerminator
  - Comment
  - Comma

在每个 lexical token 的前后可能会有任意数量的可忽略的 ignored token，其中包括了 {WhiteSpace} and {Comment}。一份文档的不可忽略部分都是不重要的，
但可忽略的 source character 可能会存在于 lexical token 内，并且是有意义的，比如 {String} 可能包含空格字符。

Before and after every lexical token may be any amount of ignored tokens
including {WhiteSpace} and {Comment}. No ignored regions of a source
document are significant, however ignored source characters may appear within
a lexical token in a significant way, for example a {String} may contain white
space characters.

在解析任意某个 token 时，不会忽略任何字符，打个比方，在定义一个 {FloatValue}时，字符中间是不允许存在空格的。

No characters are ignored while parsing a given token, as an example no
white space characters are permitted between the characters defining a
{FloatValue}.


### 标点符号 Punctuators

Punctuator :: one of ! $ ( ) ... : = @ [ ] { | }


GraphQL 文档包含标点符号是为了描述结构。GraphQL 是一种数据描述语言而非编程语言，因此没有表示数学表达式的运算符。

GraphQL documents include punctuation in order to describe structure. GraphQL
is a data description language and not a programming language, therefore GraphQL
lacks the punctionation often used to describe mathematical expressions.


### 名称 Names

Name :: /[_A-Za-z][_0-9A-Za-z]*/


GraphQL 查询文档中全是可命名的内容：operations(操作), fields(字段), arguments(参数),
directives(命令), fragments()和variables(变量)。所有名称都必须遵循同样的语法格式。

GraphQL query documents are full of named things: operations, fields, arguments,
directives, fragments, and variables. All names must follow the same
grammatical form.

GraphQL 中的名称是大小写敏感的。也就是说 `name`, `Name`, and `NAME`指的都是不同的名称。下划线也是有意义的，意味着`other_name` and `othername`是两个不同的名称。

Names in GraphQL are case-sensitive. That is to say `name`, `Name`, and `NAME`
all refer to different names. Underscores are significant, which means
`other_name` and `othername` are two different names.

GraphQL 名称中的字符仅限于<acronym>ASCII</acronym>的子集，是为了支持与尽可能多的系统互联互通。

Names in GraphQL are limited to this <acronym>ASCII</acronym> subset of possible
characters to support interoperation with as many other systems as possible.


## Query Document

Document : Definition+

Definition :
  - OperationDefinition
  - FragmentDefinition

GraphQL query document(查询文档)描述了 GraphQL 服务所接收的整个文件或请求串。一份文档包含了多个 Operation(操作)和Fragment()的定义。只有当文档中包含operation操作时,服务器才会执行一份
GraphQL query document(查询文档)。然而，不包含 operation 的文档仍然可以被解析和校验，这样，客户端就能够通过多个文档来表示单个请求。

A GraphQL query document describes a complete file or request string received by
a GraphQL service. A document contains multiple definitions of Operations and
Fragments. GraphQL query documents are only executable by a server if they
contain an operation. However documents which do not contain operations may
still be parsed and validated to allow client to represent a single request
across many documents.

如果查询文档只包含一个 operation，该 operation 可能会没有名称，或者是用 shorthand 模式表示的，也就是说其中省略了 operation 的名称和查询的关键词。否则，如果一份查询文档包含多个 operation，每个 operation 必须有名称。当提交一份包含多个 operation 的查询文档到一个 GraphQL 服务时，必须提供你想要执行的那个 operation 的名称。

If a query document contains only one query operation, that operation may be
represented in the shorthand form, which omits the query keyword and
operation name. Otherwise, if a GraphQL query document contains multiple
operations, each operation must be named. When submitting a query document with
multiple operations to a GraphQL service, the name of the desired operation to
be executed must also be provided.


### 操作 Operations

OperationDefinition :
  - OperationType Name VariableDefinitions? Directives? SelectionSet
  - SelectionSet

OperationType : one of `query` `mutation` `subscription`

GraphQL 中有2类 operation：

There are three  types of operations that GraphQL models:

  * query - 只读的获取操作 a read-only fetch.
  * mutation - 获取之后的写操作 a write followed by a fetch.

每个 operation 都是用一个 operation 名称和 selection set来表示的。

Each operation is represented by an operation name and a selection set.


比如，该 mutation operation 会对某个 story 点赞，并返回赞的总数：

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

如果文档中仅包含一个 query operation，query 没有定义任何 variable(变量)，也没有 directive()，该 operation 就是用 shorthand 的形式来表示，也就是省略了 query(查询) 的 keyword(关键词)和name(名称)。

If a document contains only one query operation, and that query defines no
variables and contains no directives, that operation may be represented in a
short-hand form which omits the query keyword and query name.

比如，shorthand形式的没有名称的query operation：

For example, this unnamed query operation is written via query shorthand.

```graphql
{
  field
}
```

注意：下面的很多例子会采用 shorthand 语法形式的 query。

Note: many examples below will use the query short-hand syntax.


### Selection Sets

SelectionSet : { Selection+ }

Selection :
  - Field
  - FragmentSpread
  - InlineFragment

一个 operation 会选择一些它所需要的信息集合selection set，仅且只能接收这些信息，避免数据的过度获取和欠缺。

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

在该 query(查询)中，`id`, `firstName`, and `lastName` 构成了一个 selection set。selection set 也可以包含 frament reference。

In this query, the `id`, `firstName`, and `lastName` fields form a selection
set. Selection sets may also contain fragment references.

### 字段 Fields

Field : Alias? Name Arguments? Directives? SelectionSet?

selections set 主要是由 filed 字段组成。字段指的是在 selections set 中请求可访问的具体的信息片段。

A selection set is primarily composed of fields. A field describes one discrete
piece of information available to request within a selection set.

一些 filed(字段)描述的是与其他数据的关系或复杂的数据。对于多层嵌套的请求而言，为了进一步表达此类数据，一个 filed 本身也可包含一个selection set。
所有 GraphQL operation 必须规定 selections 到返回 scalar values的 field(字段)层面来保证响应格式的无歧义。

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

operation 的最高层级 selection set 中的 filed 通常表示一些系统全局层面可访问的信息和当前的 viewer 信息。
顶层 filed 的例子包括对当前已登录 viewer 的引用，或者是访问某个唯一标识符所引用的特定类型的数据。

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


### 参数 Arguments

Arguments : ( Argument+ )

Argument : Name : Value

field(字段) 是概念上的function函数/功能，能够返回值，偶尔会接收能够改变它们行为的 argument(参数)。
这些 Argument(参数) 常常可以直接对应到 GraphQL 服务器实现中的函数 argument 上去。

Fields are conceptually functions which return values, and occasionally accept
arguments which alter their behavior. These arguments often map directly to
function arguments within a GraphQL server's implementation.

在该例中，我们想查询某个 user(通过id 参数)以及特殊`大小` 的用户头像。

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

一个 filed 可以有多个参数：

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

** 参数是无序的 Arguments are unordered**

Argument 可以以任意的次序出现，并且语义是一样的。

Arguments may be provided in any syntactic order and maintain identical
semantic meaning.

从语义上，以下2个 query 是一致的：

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


### 字段别名 Field Alias

Alias : Name :


默认地，response object(响应对象)中的 key 将会使用查询中的 field 字段名称。然而，你可以通过指定 alias 的方式定义另一个名称。

By default, the key in the response object will use the field name
queried. However, you can define a different name by specifying an alias.

在该例中，我们获取2份不同大小的用户头像，保证2个结果的 key 不会重复：

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

鉴于 query 的根元素也是一个 field，也可以给它一个别名：

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

如果 为某个字段定义了别名，则该字段返回值的 key 是别名，否则是字段名称。

A field's response key is its alias if an alias is provided, and it is
otherwise the field's name.


### 片段 Fragments

FragmentSpread : ... FragmentName Directives?

FragmentDefinition : fragment FragmentName on TypeCondition Directives? SelectionSet

FragmentName : Name but not `on`

Fragments 是 GraphQL 中主要的composition单位。

Fragments are the primary unit of composition in GraphQL.

Fragments 能够复用通用的可重复的字段的 selection，减少文档中文本的重复。当查询某个接口或 union时，
可以直接在 selection 中使用内嵌式 fragment 来按照 type condition 进行 condition。

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

重复的字段 field 可以被整合成一个 fragment，包含在一个父 fragment 或 query 当中。

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

利用(`...`)操作符可以来使用Fragment。当调用 fragment 时，fragment 选择的所有  field 都会被添加到 query field selection同一层级。

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

Fragment 必须规定它所应用的类型。该例中，`friendFields`可以用在查询`User`.

Fragments must specify the type they apply to. In this example, `friendFields`
can be used in the context of querying a `User`.

Fragment 不能用在规定任何输入值中(scalar, enumeration, or input
object)

Fragments cannot be specified on any input value (scalar, enumeration, or input
object).

Fragment 可以用在对象类型、接口和集合当中。

Fragments can be specified on object types, interfaces, and unions.

fragment 中的 selection 只有在它所操作的对象的具体类型与fragment的类型匹配时才能返回值。

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

`profiles` 根字段返回的列表中每个元素可以是`Page` 或`User`。如果`profiles`中返回的对象是`User`,会存在`friends`，`likers` 则不会。相反，如果返回的对象是
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

#### 内嵌的Fragment Inline Fragments

InlineFragment : ... on TypeCondition Directives? SelectionSet

在一个 selection set 中，可以定义内嵌Fragment。这样子做，就可以按照情况，根据运行时的类型来包含字段。在`query FragmentTyping`的例子中演示了
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


也可以用 内嵌的fragment 在一组字段中应用某个 directive。如果省略了 TypeCondition，内嵌的fragment的类型与  enclosing context 的类型一样。

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



### 输入值 Input Values

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

Field 和directive argument 的输入值可以是多种基本数据类型：scalars、枚举值、列表和对象。

Field and directive arguments accept input values of various literal primitives;
input values can be scalars, enumeration values, lists, or input objects.

如果没有定义成 constant(比方说，在{DefaultValue}中)，输入值可以指定成 variable。List和输入对象也可以包含variable(除非定义成 constant)

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
  - \u EscapedUnicode
  - \ EscapedCharacter


EscapedUnicode :: u /[0-9A-Fa-f]{4}/

EscapedCharacter :: one of `"` \ `/` b f n r t

String(字符串)就是用`"`引起来的字符的列表(ex.`"Hello World"`)。在字符串值中，空格和其他otherwise-ignored字符都是很重要的。

Strings are lists of characters wrapped in double-quotes `"`. (ex.
`"Hello World"`). White space and other otherwise-ignored characters are
significant within a string value.


注意：允许在 String value  literal 中使用 Unicode字符，但 GraphQL source 不允许包含一些特殊的 ASCII 控制字符，因此如果需要表示这些字符，要进行转义。


Note: Unicode characters are allowed within String value literals, however
GraphQL source must not contain some ASCII control characters so escape
sequences must be used to represent these characters.

**语义 Semantics**

StringValue :: `""`

  * Return an empty Unicode character sequence.

StringValue :: `"` StringCharacter+ `"`

  * Return the Unicode character sequence of all {StringCharacter}
    Unicode character values.

StringCharacter :: SourceCharacter but not `"` or \ or LineTerminator

  * Return the character value of {SourceCharacter}.

StringCharacter :: \u EscapedUnicode

  * Return the character whose code unit value in the Unicode Basic Multilingual Plane is the 16-bit hexadecimal value {EscapedUnicode}.

StringCharacter :: \ EscapedCharacter

  * Return the character value of {EscapedCharacter} according to the table below.


| Escaped Character | Code Unit Value | Character Name |
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



#### Enum Value

EnumValue : Name but not `true`, `false` or `null`

Enum 值是用没有引号的 name 来表示的 (ex. `MOBILE_WEB`)。建议枚举值 Enum 值全部大写。只有当具体的枚举类型明确的时候才能使用枚举值。因此，在 literal 中
提供枚举类型名称是没有必要的。

Enum values are represented as unquoted names (ex. `MOBILE_WEB`). It is
recommended that Enum values be "all caps". Enum values are only used in
contexts where the precise enumeration type is known. Therefore it's not
necessary to supply an enumeration type name in the literal.



#### List Value

ListValue[Const] :
  - [ ]
  - [ Value[?Const]+ ]

List是用`[ ]`包起来的值的有序序列。List literal 字面值可能是任意的 literal 或 variable (ex. `[1, 2, 3]`).

Lists are ordered sequences of values wrapped in square-brackets `[ ]`. The
values of a List literal may be any value literal or variable (ex. `[1, 2, 3]`).

所有 GraphQL 中都可以选择使用逗号，因此是允许在末尾使用逗号的，重复的逗号并不表示缺失值。

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

input object literal values 是用花括号`{ }`包起来的带键的输入值的无序列表。对象字面值可以是任何 input value literal 或者 variable(ex. `{ name: "Hello world", score: 1.0 }`)。我们把 input object 的 literal representation 称之为 "object literals."

Input object literal values are unordered lists of keyed input values wrapped in
curly-braces `{ }`.  The values of an object literal may be any input value
literal or variable (ex. `{ name: "Hello world", score: 1.0 }`). We refer to
literal representation of input objects as "object literals."


** 输入对象的字段是无序的 Input object fields are unordered**


输入对象字段可以是任意的语法顺序，但语义都是一样的。

Input object fields may be provided in any syntactic order and maintain
identical semantic meaning.

下面这2个查询语义是一样的：

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

GraphQL query 可以使用 variable 来参数化，最大化对 query 的复用，避免客户端在运行时构建 string 所带来的成本。

A GraphQL query can be parameterized with variables, maximizing query reuse,
and avoiding costly string building in clients at runtime.

如果并不是定义成常量 constant(比如，在{DefaultValue})中，)，{Variable} 可以作为任意的 input value 输入值。

If not defined as constant (for example, in {DefaultValue}), a {Variable} can be
supplied for an input value.

Variable 必须在 operation 的最高层级进行定义，操作执行的整个范围。

Variables must be defined at the top of an operation and are in scope
throughout the execution of that operation.

在该例中，我们想要根据特定设备的大小来获取对应大小的用户头像：

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

在请求中把变量值提供给 GraphQL 服务，这样子在执行请求时就可以替换。如果变量值是 json，我们就能够运行该 query，请求大小为`60` width 的 profilePic：

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

查询变量也可以用在 fragment 中。查询变量属于某个操作的全局范围，因此在 fragment 中用到的变量必须在操作的任意顶级进行声明来传递到 使用该变量的fragment 中。
如果是在 fragment 中引用 variable，而且该 operation 并没有定义该变量，则该operation无法执行。

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

GraphQL 中描述了查询变量 query variable 想要的数据类型。input type 可以是其他 input type 的list列表，或者任意其他 input type 的非空variant。

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

Directives 提供了一种在 GraphQL 文档中描述其他运行时改变执行时和类型校验行为的方式。

Directives provide a way to describe alternate runtime execution and type
validation behavior in a GraphQL document.

在一些情况下，你需要在 field argument 不足的时候改变 GraphQL 运行行为的选项，比如根据条件纳入或忽略某个 field。通过为执行器描述额外信息来提供此类 Directive。

In some cases, you need to provide options to alter GraphQL's execution
behavior in ways field arguments will not suffice, such as conditionally
including or skipping a field. Directives provide this by describing additional information to the executor.

Directives是有名称的以及可接受任意input type值的参数列表。

Directives have a name along with a list of arguments which may accept values
of any input type.

Directive 可以为types、

 field、fragment 和 operation 描述额外信息。

Directives can be used to describe additional information for types, fields, fragments
and operations.

随着 GraphQL 的后续版本应用新的可配置的执行功能，可能会通过 directive 来暴露。

As future versions of GraphQL adopts new configurable execution capabilities,
they may be exposed via directives.



FragmentSpreadDirectives(fragmentSpread) :
  * Let {directives} be the set of directives on {fragmentSpread}
  * Let {fragmentDefinition} be the FragmentDefinition in the document named {fragmentSpread} refers to.
  * For each {directive} in directives on {fragmentDefinition}
    * If {directives} does not contain a directive named {directive}.
    * Add {directive} into {directives}
  * Return {directives}