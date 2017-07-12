# 类型体系 Type System

GraphQL Type system 描述了 GraphQL 服务器的功能，用于决定一个 query 是否有效，同时还描述了查询变量的输入类型，用于在运行时判断参数值是否有效。

The GraphQL Type system describes the capabilities of a GraphQL server and is
used to determine if a query is valid. The type system also describes the
input types of query variables to determine if values provided at runtime
are valid.

GraphQL 服务器功能被称作服务器的“schema”。schema 是通过它所支持的 type 和 directive 来定义的。

A GraphQL server's capabilities are referred to as that server's "schema".
A schema is defined in terms of the types and directives it supports.

某个指定的 GraphQL schema 自身必须是有效。该章节描述了后续会用到的校验流程规则。

A given GraphQL schema must itself be internally valid. This section describes
the rules for this validation process where relevant.

GraphQL schema  是使用针对每一种operation:query和mutation的root类型来表示的，这也确定了类型系统type system中 operation开始的地方。

A GraphQL schema is represented by a root type for each kind of operation:
query, mutation, and subscription; this determines the place in the type system where those
operations begin.

GraphQL schema 中的所有类型都必须拥有唯一的名称。不可能有2个类型名称一样。没有一个类型的名称会与任意内置类型的名称冲突(
    包括 Scalar 和 Introspection 类型)

All types within a GraphQL schema must have unique names. No two provided types
may have the same name. No provided type may have a name which conflicts with
any built in types (including Scalar and Introspection types).

GraphQL schema 中的所有 directive 都必须有唯一的名称。由于一个 directive 和一个 type 之间不存在歧义，故可能是同一个名称。
to-do

All types and directives defined within a schema must not have a name which
begins with {"__"} (two underscores), as this is used exclusively by GraphQL's
introspection system.


## Types

GraphQL schema 最基本的单元是 type(类型)。在 GraphQL 中有8种 type(类型)。

The fundamental unit of any GraphQL Schema is the type. There are eight kinds
of types in GraphQL.

最基本的 type(类型)是‘Scalar’。一个 scalar 表示一个基本数据类型值，比如字符串或整数，通常，一个 scalar 类型字段的响应值是枚举型。在这种情况下，
GraphQL提供了一种‘Enum’类型，其中规定了允许值/有效值的范围。

The most basic type is a `Scalar`. A scalar represents a primitive value, like
a string or an integer. Oftentimes, the possible responses for a scalar field
are enumerable. GraphQL offers an `Enum` type in those cases, where the type
specifies the space of valid responses.

Scalar 和 Enum 构成了 response 的两片'树叶'；中间层是‘Object’类型，它定义了一些字段，每个字段可以是类型体系中的任意类型，允许任意类型层次的定义。

Scalars and Enums form the leaves in response trees; the intermediate levels are
`Object` types, which define a set of fields, where each field is another
type in the system, allowing the definition of arbitrary type hierarchies.

GraphQL 支持2类抽象类型：interfaces and unions。

GraphQL supports two abstract types: interfaces and unions.

`Interface` 定义了包含多个字段的一个列表，实现该 interface 的`Object` 类型保证会实现这些字段。每当类型体系声称会返回一个 interface 时，总会返回一个有效的
实现类型。

An `Interface` defines a list of fields; `Object` types that implement that
interface are guaranteed to implement those fields. Whenever the type system
claims it will return an interface, it will return a valid implementing type.

`Union`  定义了包含多个可能的类型的一个列表；与 interface 类似，每当类型体系声称会返回一个 union 时，将返回某个可能的类型。

A `Union` defines a list of possible types; similar to interfaces, whenever the
type system claims a union will be returned, one of the possible types will be
returned.

截止到目前的所有类型都是 nullable 和 singular 的：比方说，scalar 字符串要么返回null，要么返回一个 singular 字符串。类型体系可能会定义返回
一个其他类型的 List；'List'类型就是为此存在的，对其他类型进行封装。类似的，’Non-Null’类型封装了另一个类型，表示结果不可能为空。这两个类型被称
之为“wrapping type”；非wrapping-type被称之为“base type 基本类型”。每个 wrapping type 都有一个基本的 base type，found by
continually unwrapping the type until a base type is found.

All of the types so far are assumed to be both nullable and singular: e.g. a scalar
string returns either null or a singular string. The type system might want to
define that it returns a list of other types; the `List` type is provided for
this reason, and wraps another type. Similarly, the `Non-Null` type wraps
another type, and denotes that the result will never be null. These two types
are referred to as "wrapping types"; non-wrapping types are referred to as
"base types". A wrapping type has an underlying "base type", found by
continually unwrapping the type until a base type is found.

最后，在 GraphQL query 中提供复杂结构作为输入，常常是很有用的。‘Input Object’ 类型使得 schema 可以定义在这些查询中，客户端到底
想要什么样的数据。

Finally, oftentimes it is useful to provide complex structs as inputs to
GraphQL queries; the `Input Object` type allows the schema to define exactly
what data is expected from the client in these queries.

### Scalars

跟名称所预期的一样，scalar表示GraphQL中的一个primitive value 原始值/简单类型值。GraphQL response的格式是层次化 的树状结构，
树状结构的leave都是 scalar。

As expected by the name, a scalar represents a primitive value in GraphQL.
GraphQL responses take the form of a hierarchical tree; the leaves on these trees
are GraphQL scalars.

尽管取决于所使用的response 格式，所有的 GraphQL scalar都可以用string来表示，对于某个scalar 类型，可能有更适合的简单类型，服务器应该在
恰当的时候使用这些简单primitive类型。

All GraphQL scalars are representable as strings, though depending on the
response format being used, there may be a more appropriate primitive for the
given scalar type, and server should use those types when appropriate.

GraphQL 提供了大量的内置scalar类型，但是type system 类型体系中可以新增额外的带有语义的scalar。比如，GraphQL system可以定义一个叫‘Time’的
scalar，可以序列化成string，格式必须遵循ISO-8601. 当查询一个类型是‘Time’的字段时，你可以使用ISO-8601 解析器来解析结果，
针对time使用针对客户端的primitive。另外一个可能有用的自定义scalar是‘Url’，可以序列化成string，但服务器要保证是一个有效的URL。

GraphQL provides a number of built-in scalars, but type systems can add
additional scalars with semantic meaning. For example, a GraphQL system could
define a scalar called `Time` which, while serialized as a string, promises to
conform to ISO-8601. When querying a field of type `Time`, you can then rely on
the ability to parse the result with an ISO-8601 parser and use a
client-specific primitive for time. Another example of a potentially useful
custom scalar is `Url`, which serializes as a string, but is guaranteed by
the server to be a valid URL.

to-do 

A server may omit any of the built-in scalars from its schema, for example if a
schema does not refer to a floating-point number, then it will not include the
`Float` type. However, if a schema includes a type with the name of one of the
types described here, it must adhere to the behavior described. As an example,
a server must not include a type called `Int` and use it to represent
128-bit numbers, or internationalization information.

**Result Coercion**

GraphQL 服务器在‘准备’处理某个scalar类型的字段时，必须坚持scalar类型所描述的规则，要么强制转换值，要么生成一个错误信息。

A GraphQL server, when preparing a field of a given scalar type, must uphold the
contract the scalar type describes, either by coercing the value or
producing an error.

比如，GraphQL 服务器准备处理一个‘Int’的scalar类型的字段，却遇到一个浮点类型的数字。由于服务器必须坚持产生整数的规则，服务器should 宜截断该值，只保留整数值。如果服务器遇
的是布尔型，true的话转化成1。如果碰到的是字符串，服务器可能需要将其转化成10进制的数字。如果服务器遇到了不能转换成‘Int’的一些值，则必须抛出字段错误信息。

For example, a GraphQL server could be preparing a field with the scalar type
`Int` and encounter a floating-point number. Since the server must not break the
contract by yielding a non-integer, the server should truncate the fractional
value and only yield the integer value. If the server encountered a boolean
`true` value, it should return `1`. If the server encountered a string, it may
attempt to parse the string for a base-10 integer value. If the server
encounters some value that cannot be reasonably coerced to an `Int`, then it
must raise a field error.

鉴于强制转换行为对于客户端而言是不可见的，具体的强制转换规则由具体的实现来决定。唯一的要求是服务器必须产生满足规定的scalar类型的值。

Since this coercion behavior is not observable to clients of the GraphQL server,
the precise rules of coercion are left to the implementation. The only
requirement is that the server must yield values which adhere to the expected
Scalar type.

**Input Coercion**

如果 GraphQL 服务器想要将 scalar 类型作为参数的值，就需要进行coercion并且定义好规则。如果输入值不满足coercion的规则，必须抛出一个查询错误。


If a GraphQL server expects a scalar type as input to an argument, coercion
is observable and the rules must be well defined. If an input value does not
match a coercion rule, a query error must be raised.

GraphQL 中存在多种固定 literal 来表示 整数和浮点型输入值，coercion规则必须根据输入值的具体数据类型来分别对待。可以使用query variable来
变量化GraphQL，通常使用HTTP等来传输时这些值都是序列化好了的。由于一些常用的序列化技术如JSON并不能区分整数和浮点值，如果不存在fractional part则会当做整数来处理，否则才当做浮点值来处理

GraphQL has different constant literals to represent integer and floating-point
input values, and coercion rules may apply differently depending on which type
of input value is encountered. GraphQL may be parameterized by query variables,
the values of which are often serialized when sent over a transport like HTTP. Since
some common serializations (ex. JSON) do not discriminate between integer
and floating-point values, they are interpreted as an integer input value if
they have an empty fractional part (ex. `1.0`) and otherwise as floating-point
input value.




For all types below, with the exception of Non-Null, if the explicit value
{null} is provided, then  the result of input coercion is {null}.

#### 内置的scalar类型 Built-in Scalars

GraphQL 中有一些已经定义好的基本 Scalar 类型。一个 GraphQL 服务器 应该支持所有这些数据类型，并提供和下述数据类型名称相符的功能。

GraphQL provides a basic set of well-defined Scalar types. A GraphQL server
should support all of these types, and a GraphQL server which provide a type by
these names must adhere to the behavior described below.

##### Int

Int   scalar 类型表示 有符号的32位的非小数值。返回值格式是32位integer或number数据类型都应该使用这种scalar类型。

The Int scalar type represents a signed 32-bit numeric non-fractional values.
Response formats that support a 32-bit integer or a number type should use
that type to represent this scalar.

**Result Coercion**

GraphQL 服务器应在需要时将非整型的原始值转换成Int类型，否则必须抛出字段错误。比如，对于浮点值'1.0'返回'1',字符串‘“2”’则返回‘2’

GraphQL servers should coerce non-int raw values to Int when possible
otherwise they must raise a field error. Examples of this may include returning
`1` for the floating-point number `1.0`, or `2` for the string `"2"`.

**Input Coercion**

当作为输入值的数据类型时，只能接受integer类型的输入值。所有其他类型的输入值，包括带数字的字符串，都必须抛出数据类型不正确的查询异常。如果integer输入值表
示的值小于-2<sup>31</sup> 或大于等于 2<sup>31</sup>，必须抛出查询异常。

When expected as an input type, only integer input values are accepted. All
other input values, including strings with numeric content, must raise a query
error indicating an incorrect type. If the integer input value represents a
value less than -2<sup>31</sup> or greater than or equal to 2<sup>31</sup>, a
query error should be raised.

注意：由于不是所有平台、传输协议都支持对大于32位的整数值进行编码，大于32位的Numeric integer值要么应使用String，要么使用自定义的 Scalar 类型。

Note: Numeric integer values larger than 32-bit should either use String or a
custom-defined Scalar type, as not all platforms and transports support
encoding integer numbers larger than 32-bit.

##### Float

Float scalar类型表示[IEEE 754](http://en.wikipedia.org/wiki/IEEE_floating_point)中规定的有符号的双精度fractional values小数值。
支持双精度数字类型的返回格式应使用这种类型来表示这种scalar。

The Float scalar type represents signed double-precision fractional values
as specified by [IEEE 754](http://en.wikipedia.org/wiki/IEEE_floating_point).
Response formats that support an appropriate double-precision number type
should use that type to represent this scalar.

**Result Coercion**

GraphQL服务器 应在需要时将非浮点型原始值转换成浮点值，其他情况必须抛出字段异常。例如整数值'1'返回'1.0'，字符串'"2"'返回‘2.0’。

GraphQL servers should coerce non-floating-point raw values to Float when
possible otherwise they must raise a field error. Examples of this may include
returning `1.0` for the integer number `1`, or `2.0` for the string `"2"`.

**Input Coercion**

如果是作为输入值类型，可以使用integer和float两种输入值类型。integer 类型输入值被强制添加一个空的fractional part转换成float类型，比如
对于整数值‘1’，转换成‘1.0’，其他所有输入值，包括带数字部分的字符串，必须抛出数据类型不正确的查询异常。如果整型输入值表示一个IEEE 754中无法表示的值，抛出一个查询异常。


When expected as an input type, both integer and float input values are
accepted. Integer input values are coerced to Float by adding an empty
fractional part, for example `1.0` for the integer input value `1`. All
other input values, including strings with numeric content, must raise a query
error indicating an incorrect type. If the integer input value represents a
value not representable by IEEE 754, a query error should be raised.

##### String

String scalar type 表示文本数据，可以用 UTF-8 编码的 character sequence来表示。
String类型是GraphQL中使用最多的表示人可读的自由文本的数据类型。所有response format必须支持string representation，而且必须在这里使用这种表示方式。

The String scalar type represents textual data, represented as UTF-8 character
sequences. The String type is most often used by GraphQL to represent free-form
human-readable text. All response formats must support string representations,
and that representation must be used here.

**Result Coercion**

GraphQL服务器应在需要时将非字符串型原始值转换成String，其他情况必须抛出字段异常错误。例如，对于布尔型true返回字符串‘“true”’，对于整型值‘1’返回
字符串‘“1”’。

GraphQL servers should coerce non-string raw values to String when possible
otherwise they must raise a field error. Examples of this may include returning
the string `"true"` for a boolean true value, or the string `"1"` for the
integer `1`.

**Input Coercion**

当作为输入值的数据类型时，只可以使用UTF-8编码的有效字符串。所有其他输入值都必须抛出数据类型不正确的查询异常。

When expected as an input type, only valid UTF-8 string input values are
accepted. All other input values must raise a query error indicating an
incorrect type.

##### Boolean

Boolean scalar 类型表示 `true` or `false`.如果支持的话，response format 应使用内置的boolean类型，否则应使用整数‘1’和‘0’来表示。

The Boolean scalar type represents `true` or `false`. Response formats should
use a built-in boolean type if supported; otherwise, they should use their
representation of the integers `1` and `0`.

**Result Coercion**

GraphQL 服务器应在需要时将非布尔型原始值转换成Boolean，否则必须抛出字段异常。例如所有非零数字返回‘true’。

GraphQL servers should coerce non-boolean raw values to Boolean when possible
otherwise they must raise a field error. Examples of this may include returning
`true` for any non-zero number.

**Input Coercion**

当作为输入值的数据类型时，只可以使用boolean 输入值。所有其他输入值都必须抛出数据类型不正确的查询异常。

When expected as an input type, only boolean input values are accepted. All
other input values must raise a query error indicating an incorrect type.

##### ID

ID scalar 类型表示一个唯一标识符，通常用来再次获取一个对象或作为缓存的key值。ID 数据类型和 'String'的序列化方式系统，但不具有人可读的特性。
尽管它常常是数值，应总是序列化成‘String’

The ID scalar type represents a unique identifier, often used to refetch an
object or as key for a cache. The ID type is serialized in the same way as
a `String`; however, it is not intended to be human-readable. While it is
often numeric, it should always serialize as a `String`.

**Result Coercion**

GraphQL 对于 ID的格式是不作要求的，序列化成string是为了保证众多不同格式的ID之间的一致性，从很小的自增数字到很大的128位的随机数，到base64编码的值，或
者是诸如[GUID](http://en.wikipedia.org/wiki/Globally_unique_identifier)的字符串值.

GraphQL is agnostic to ID format, and serializes to string to ensure consistency
across many formats ID could represent, from small auto-increment numbers, to
large 128-bit random numbers, to base64 encoded values, or string values of a
format like [GUID](http://en.wikipedia.org/wiki/Globally_unique_identifier).

GraphQL 服务器应按照想要的ID 格式进行强制转换，无法进行转换的则必须抛出字段异常。

GraphQL servers should coerce as appropriate given the ID formats they expect,
when coercion is not possible they must raise a field error.

**Input Coercion**

当作为输入值的数据类型时，任意string如‘“4”‘’或integer比如’4’类型的输入值应强制转换成 GraphQL 服务器所期望的ID格式。
所有其他输入值，包括浮点型输入值如‘4.0’，都必须抛出数据类型不正确的查询异常。

When expected as an input type, any string (such as `"4"`) or integer (such
as `4`) input value should be coerced to ID as appropriate for the ID formats
a given GraphQL server expects. Any other input value, including float input
values (such as `4.0`), must raise a query error indicating an incorrect type.


### Objects

GraphQL query 是有层次的，可组合的，描述的是树状信息。scalar 类型描述的是这些层次化查询的叶子的值，Object 则描述的是intermediate。

GraphQL queries are hierarchical and composed, describing a tree of information.
While Scalar types describe the leaf values of these hierarchical queries, Objects
describe the intermediate levels.

GraphQL Object 表示的是一些有名称的字段列表，每个字段值都有一个规定的数据类型。Object 值序列化成无序的map，而相应的查询中的字段名称就是key值，字段评估的结果就是字段值。

GraphQL Objects represent a list of named fields, each of which yield a value of
a specific type. Object values are serialized as unordered maps, where the
queried field names (or aliases) are the keys and the result of evaluating
the field is the value.

to-do
All fields defined within an Object type must not have a name which begins with
{"__"} (two underscores), as this is used exclusively by GraphQL's
introspection system.

For example, a type `Person` could be described as:

比如，‘Person’可以这样来描述：

```
type Person {
  name: String
  age: Int
  picture: Url
}
```

字段‘name’的值是‘String’类型，字段‘age’的值是‘Int’类型，‘picture’的值是‘Url’类型。

Where `name` is a field that will yield a `String` value, and `age` is a field
that will yield an `Int` value, and `picture` a field that will yield a
`Url` value.

object 值的查询必须选择至少一个字段。所选择的这些字段构成一个无序的map，其中只包含所查询对象的子集。
只有在object类型中声明了的字段才能够被查询。

A query of an object value must select at least one field. This selection of
fields will yield an unordered map containing exactly the subset of the object
queried. Only fields that are declared on the object type may validly be queried
on that object.

For example, selecting all the fields of `Person`:

比如，选择‘Person’的所有字段：


```graphql
{
  name
  age
  picture
}
```

会得到一个object：

Would yield the object:

```js
{
  "name": "Mark Zuckerberg",
  "age": 30,
  "picture": "http://some.cdn/picture.jpg"
}
```

While selecting a subset of fields:

当选择其中一些字段时：

```graphql
{
  name
  age
}
```

Must only yield exactly that subset:
必须只得到字段子集所对应的对象：


```js
{
  "name": "Mark Zuckerberg",
  "age": 30
}
```

Object 类型的字段可以是scalar 类型、Enum、其他object 类型、Interface或是Union类型。另外，它也可以是使用上述五个之一作为基本类型的
任意wrapping类型。

A field of an Object type may be a Scalar, Enum, another Object type,
an Interface, or a Union. Additionally, it may be any wrapping type whose
underlying base type is one of those five.

比如，`Person`可能会包含 `relationship`:

For example, the `Person` type might include a `relationship`:

```
type Person {
  name: String
  age: Int
  picture: Url
  relationship: Person
}
```

对于返回某个对象的字段，提供一个嵌套的字段集合才是有效的查询。如下的查询是无效的：

Valid queries must supply a nested field set for a field that returns
an object, so this query is not valid:

```!graphql
{
  name
  relationship
}
```

However, this example is valid:

但下面这个查询是有效的

```graphql
{
  name
  relationship {
    name
  }
}
```

也能够得到所查询的object类型的子集：

And will yield the subset of each object type queried:

```js
{
  "name": "Mark Zuckerberg",
  "relationship": {
    "name": "Priscilla Chan"
  }
}
```

**Result Coercion**

确定Object 强制转换的结果是 GraphQL处理器的核心，所以这部分内容放在那个章节。

Determining the result of coercing an object is the heart of the GraphQL
executor, so this is covered in that section of the spec.

**Input Coercion**

Object 类型不可能是有效的输入值类型。

Objects are never valid inputs.

#### Object Field Arguments

Object field 是能够产生值的概念上的function 函数。偶尔，object field 可以使用argument来进一步规定返回值。Object field argument 是用所有可能的argument名称及其
所期望的输入值类型的列表来定义的。

Object fields are conceptually functions which yield values. Occasionally object
fields can accept arguments to further specify the return value. Object field
arguments are defined as a list of all possible argument names and their
expected input types.



to-do
All arguments defined within a field must not have a name which begins with
{"__"} (two underscores), as this is used exclusively by GraphQL's
introspection system.


比如，`Person` 有一个`picture` 字段，该字段可以接受一个argument来确定所要返回的图片的尺寸。

For example, a `Person` type with a `picture` field could accept an argument to
determine what size of an image to return.

```
type Person {
  name: String
  picture(size: Int): Url
}
```

GraphQL 查询在使用argument时是可以规定字段的参数值的。

GraphQL queries can optionally specify arguments to their fields to provide
these arguments.

This example query:
例如：

```graphql
{
  name
  picture(size: 600)
}
```

所得到的结果：

May yield the result:

```js
{
  "name": "Mark Zuckerberg",
  "picture": "http://some.cdn/picture_600.jpg"
}
```

object field argument 对象字段参数的数据类型可以是任意的输入值数据类型。

The type of an object field argument can be any Input type.

#### Object Field deprecation

必要时系统可以将object 中的field 标记成deprecated。对这些字段的查询仍然是合法的(以确保变更不会破坏已有的系统)，
但是在文档和工具中应该妥善处理这些字段。

Fields in an object may be marked as deprecated as deemed necessary by the
application. It is still legal to query for these fields (to ensure existing
clients are not broken by the change), but the fields should be appropriately
treated in documentation and tooling.

#### Object type validation

如果定义不妥当，Object数据类型有可能是无效的。GraphQL schema 中每一个 object 类型都必须遵循如下的规则：

1. 在Object type 的内部，字段必须拥有唯一的名称，不能存在两个相同名称的字段

2. object type必须是它所实现的所有interface的超集，
   1. object type必须包含interface中定义的每个字段，名称必须一致。
      1. object field必须包含每个interface field中所定义的argument，名称必须一致
         1. object field argument和interface field argument的数据类型必须一致
      2. object field必须和 interface field的数据类型必须是等同的equal


Object types have the potential to be invalid if incorrectly defined. This set
of rules must be adhered to by every Object type in a GraphQL schema.

<<<<<<< HEAD:zh-cn/spec/Section 3 -- Type System.md

1. The fields of an Object type must have unique names within that Object type;
=======
1. An Object type must define one or more fields.
2. The fields of an Object type must have unique names within that Object type;
>>>>>>> 6097d7b32c464552bccf116201cf310adb82835c:spec/Section 3 -- Type System.md
   no two fields may share the same name.
3. Each field of an Object type must not have a name which begins with the
   characters {"__"} (two underscores).
4. An object type may declare that it implements one or more unique interfaces.
5. An object type must be a super-set of all interfaces it implements:
   1. The object type must include a field of the same name for every field
      defined in an interface.
      1. The object field must include an argument of the same name for every
         argument defined by the interface field.
         1. The object field argument must accept the same type (invariant) as
            the interface field argument.
      2. The object field must be of a type which is equal to
         the interface field.


### Interfaces

GraphQL Interfaces表示有名称的field 和它们的argument的列表。GraphQL Object 保证包含规定的field，就可以实现一个 interface。

GraphQL Interfaces represent a list of named fields and their arguments. GraphQL
object can then implement an interface, which guarantees that they will
contain the specified fields.

 GraphQL interface 和 GraphQL object 字段的规则一致；它们的数据类型可以是scalar 类型、Enum、其他object 类型、Interface或是Union类型。另外，它也可以是使用上述五个之一作为基本类型的
 任意wrapping类型。

Fields on a GraphQL interface have the same rules as fields on a GraphQL object;
their type can be Scalar, Object, Enum, Interface, or Union, or any wrapping
type whose base type is one of those five.

例如，一个interface 可能会描述一个必须存在的field和数据类型，`Person` or `Business`可能会实现这个接口。

For example, an interface may describe a required field and types such as
`Person` or `Business` may then implement this interface.

```
interface NamedEntity {
  name: String
}

type Person : NamedEntity {
  name: String
  age: Int
}

type Business : NamedEntity {
  name: String
  employeeCount: Int
}
```

当期望得到很多object 数据类型之一的时候，能够产生interface的field就很作用，但必须保证一些field出现。

Fields which yield an interface are useful when one of many Object types are
expected, but some fields should be guaranteed.

接着上面的老子，`Contact`可能引用 `NamedEntity`.

To continue the example, a `Contact` might refer to `NamedEntity`.

```
type Contact {
  entity: NamedEntity
  phoneNumber: String
  address: String
}
```

这样，我们就可以对 `Contact` 写一个选择通用field 的查询：

This allows us to write a query for a `Contact` that can select the
common fields.

```graphql
{
  entity {
    name
  }
  phoneNumber
}
```

当对interface 类型的field进行查询时，只有那些interface 中声明了的field 才可以被查询。上面的例子中，`entity`返回值 的类型是`NamedEntity`
`NamedEntity`中定义了`name`字段，所以该查询是有效的。然而，下面这个查询是无效的：

When querying for fields on an interface type, only those fields declared on
the interface may be queried. In the above example, `entity` returns a
`NamedEntity`, and `name` is defined on `NamedEntity`, so it is valid. However,
the following would not be a valid query:

```!graphql
{
  entity {
    name
    age
  }
  phoneNumber
}
```

由于`entity`引用了 `NamedEntity`,`NamedEntity` interface 中并没有定义 `age`。只有当 `entity`的结果是`Person`时，对`age` 的查询才是有效的，
这时候查询可以使用fragment或内嵌的fragment来表达：

because `entity` refers to a `NamedEntity`, and `age` is not defined on that
interface. Querying for `age` is only valid when the result of `entity` is a
`Person`; the query can express this using a fragment or an inline fragment:

```graphql
{
  entity {
    name
    ... on Person {
      age
    }
  },
  phoneNumber
}
```

**Result Coercion**

interface 数据类型应存在某种能够确定特定结果所对应的object的方法。一旦实现这个功能，interface 强制转换的结果就和object 一模一样了。

The interface type should have some way of determining which object a given
result corresponds to. Once it has done so, the result coercion of the interface
is the same as the result coercion of the object.

**Input Coercion**

interface 不可能是合法的输入值类型。

Interfaces are never valid inputs.

#### Interface type validation

如果定义不当，interface 数据类型可能是无效的。

1. 在Interface数据类型内部，field名称必须是唯一的，不能存在两个同样名称的field。


Interface types have the potential to be invalid if incorrectly defined.

1. An Interface type must define one or more fields.
2. The fields of an Interface type must have unique names within that Interface
   type; no two fields may share the same name.
3. Each field of an Interface type must not have a name which begins with the
   characters {"__"} (two underscores).

### Unions

GraphQL Unions 表示的是一个object，这个object 可以是一些 GraphQL Object数据类型中的一个，但不对这些数据类型中的field做保证。
同时也与声明实现了那种interface的object type中的那些interface不同，不知道哪些union中会存在这些数据类型。(什么意思  表达不清)

GraphQL Unions represent an object that could be one of a list of GraphQL
Object types, but provides for no guaranteed fields between those types.
They also differ from interfaces in that Object types declare what interfaces
they implement, but are not aware of what unions contain them.

有了interface 和object ，只有这些类型中定义的field才能被直接查询；要查询interface上的其他field，必须使用typed fragment。union中也是一样，
只不过union中并不会定义任何field，因此在查询这个数据类型时，每个字段都必须使用typed fragment。

With interfaces and objects, only those fields defined on the type can be
queried directly; to query other fields on an interface, typed fragments
must be used. This is the same as for unions, but unions do not define any
fields, so **no** fields may be queried on this type without the use of
typed fragments.

例如，我们的类型系统可能如下：

For example, we might have the following type system:

```
union SearchResult = Photo | Person

type Person {
  name: String
  age: Int
}

type Photo {
  height: Int
  width: Int
}

type SearchQuery {
  firstSearchResult: SearchResult
}
```

当查询类型是`SearchQuery`的 `firstSearchResult` 字段时，查询会查找fragment内部所有符合该数据类型的字段。如果查询的是Person，query想要name的值，
查询的是photo，query想要的height，则如下的查询是无效的，是因为union本身并没有定义任何字段。

When querying the `firstSearchResult` field of type `SearchQuery`, the
query would ask for all fields inside of a fragment indicating the appropriate
type. If the query wanted the name if the result was a Person, and the height if
it was a photo, the following query is invalid, because the union itself
defines no fields:

```!graphql
{
  firstSearchResult {
    name
    height
  }
}
```

相反，可以这样查询：

Instead, the query would be:

```graphql
{
  firstSearchResult {
    ... on Person {
      name
    }
    ... on Photo {
      height
    }
  }
}
```

**Result Coercion**

union 数据类型应存在某种能够确定特定结果所对应的object的方法。一旦实现这个功能， union 强制转换的结果就和object 一模一样了。

The union type should have some way of determining which object a given result
corresponds to. Once it has done so, the result coercion of the union is the
same as the result coercion of the object.

**Input Coercion**

union 不可能是有效的输入值类型。

Unions are never valid inputs.

#### Union type validation

如果定义不当， Union 数据类型可能是无效的。

1. Union数据类型的成员数据类型必须是任何一种基于Object的数据类型； Scalar, Interface and Union types， wrapping types 可能不是成员数据类型
2. Union类型必须定义两个或两个以上的成员数据类型

Union types have the potential to be invalid if incorrectly defined.

1. The member types of an Union type must all be Object base types;
   Scalar, Interface and Union types may not be member types of a Union.
   Similarly, wrapping types may not be member types of a Union.
2. A Union type must define one or more unique member types.

### Enums

GraphQL Enums 是 Scalar 数据类型的变种，表示允许值的有限集合中的其中之一。

GraphQL Enums are a variant on the Scalar type, which represents one of a
finite set of possible values.

GraphQL Enums 并不是对某个数值型的引用，数值自身就是独立存在的唯一值。它们可以序列化成string：所表达值的名称。

GraphQL Enums are not references for a numeric value, but are unique values in
their own right. They serialize as a string: the name of the represented value.

**Result Coercion**

GraphQL服务器必须返回定义好的允许值集合中的其中一个，如果不能进行合理的强制转换则必须抛出字段异常。

GraphQL servers must return one of the defined set of possible values, if a
reasonable coercion is not possible they must raise a field error.

**Input Coercion**

GraphQL 有一个constant literal 来表示 enum的输入值。 不能使用string
literals 作为 enum 输入值，这样做会抛出查询错误/异常。

.


GraphQL has a constant literal torepresent enum input values. GraphQL string
literals must not be accepted as an enum input and instead raise a query error.

对于非字符串的符号值有不同的表示方法，比如[EDN](https://github.com/edn-format/edn)的Query variable 传输序列化而言，应只将此类值当做enum 输入值。
否则，大多数不是这样处理的传输序列化而言，string 可能被理解成拥有同样名称的enum 输入值

Query variable transport serializations which have a different representation
for non-string symbolic values (for example, [EDN](https://github.com/edn-format/edn))
should only allow such values as enum input values. Otherwise, for most
transport serializations that do not, strings may be interpreted as the enum
input value with the same name.


### Input Objects

Field中可以定义客户端传递给query的argument来配置对应的给你。这类输入值可以是String 或者 Enum，但有时候，可能会比这些更复杂。

Fields can define arguments that the client passes up with the query,
to configure their behavior. These inputs can be Strings or Enums, but
they sometimes need to be more complex than this.

由于‘Object’能够包含表示循环引用或对interface、union引用的字段，这些都不能作为input argument来使用，所以
在这里复用前面定义的'Object'数据类型是不合适的。鉴于此，input object 就成为了一个独立的数据类型。

The `Object` type defined above is inappropriate for re-use here, because
`Object`s can contain fields that express circular references or references
to interfaces and unions, neither of which is appropriate for use as an
input argument.  For this reason, input objects have a separate type in the
system.

`Input Object` 中定义了 input field 的集合；这些 input field 要么是 scalar、enum 或其他 input object。这样子 argument 就可以使用任意的复杂结构。

An `Input Object` defines a set of input fields; the input fields are either
scalars, enums, or other input objects. This allows arguments to accept
arbitrarily complex structs.

**Result Coercion**

`Input Object` 不可能是有效的 result。

An input object is never a valid result.

**Input Coercion**

todo

The value for an input object should be an input object literal or an unordered
map, otherwise an error should be thrown. This unordered map should not contain
any entries with names not defined by a field of this input object type,
otherwise an error should be thrown.

If any non-nullable fields defined by the input object do not have corresponding
entries in the original value, were provided a variable for which a value was
not provided, or for which the value {null} was provided, an error should
be thrown.

The result of coercion is an environment-specific unordered map defining slots
for each field both defined by the input object type and provided by the
original value.

For each field of the input object type, if the original value has an entry with
the same name, and the value at that entry is a literal value or a variable
which was provided a runtime value, an entry is added to the result with the
name of the field.

The value of that entry in the result is the outcome of input coercing the
original entry value according to the input coercion rules of the
type declared by the input field.    

Following are examples of Input Object coercion for the type:

```graphql
input ExampleInputObject {
  a: String
  b: Int!
}
```

Original Value          | Variables       | Coerced Value
----------------------- | --------------- | -----------------------------------
`{ a: "abc", b: 123 }`  | {null}          | `{ a: "abc", b: 123 }`
`{ a: 123, b: "123" }`  | {null}          | `{ a: "123", b: 123 }`
`{ a: "abc" }`          | {null}          | Error: Missing required field {b}
`{ a: "abc", b: null }` | {null}          | Error: {b} must be non-null.
`{ a: null, b: 1 }`     | {null}          | `{ a: null, b: 1 }`
`{ b: $var }`           | `{ var: 123 }`  | `{ b: 123 }`    
`{ b: $var }`           | `{}`            | Error: Missing required field {b}. 
`{ b: $var }`           | `{ var: null }` | Error: {b} must be non-null.
`{ a: $var, b: 1 }`     | `{ var: null }` | `{ a: null, b: 1 }`
`{ a: $var, b: 1 }`     | `{}`            | `{ b: 1 }`


Note: there is a semantic difference between the input value
explicitly declaring an input field's value as the value {null} vs having not
declared the input field at all.

#### Input Object type validation

1. An Input Object type must define one or more fields.
2. The fields of an Input Object type must have unique names within that
   Input Object type; no two fields may share the same name.
3. The return types of each defined field must be an Input type.


### Lists

GraphQL list是一个特殊的集合类型，其中声明了列表中每个项目的数据类型(被称作list中的*item type*)，List value 列表值序列化成有序列表，列表中的每个项item
按照item type来序列化。为了区分一个field 使用的是List数据类型，item type使用方括号来括起来，如 `pets: [Pet]`.

A GraphQL list is a special collection type which declares the type of each
item in the List (referred to as the *item type* of the list). List values are
serialized as ordered lists, where each item in the list is serialized as per
the item type. To denote that a field uses a List type the item type is wrapped
in square brackets like this: `pets: [Pet]`.

**Result Coercion**

对于list type的结果，GraphQL 必须返回一个有序list。list中的每个item项都必须是对应item 数据类型强制转换的结果。
如果不能进行合理的强制转换则必须抛出异常。特别是，当返回一个non-list时，强制转换应该失败，因为这意味着type system和
具体实现中存在不一致的情况。


GraphQL servers must return an ordered list as the result of a list type. Each
item in the list must be the result of a result coercion of the item type. If a
reasonable coercion is not possible they must raise a field error. In
particular, if a non-list is returned, the coercion should fail, as this
indicates a mismatch in expectations between the type system and the
implementation.

**Input Coercion**


当作为输入值的数据类型时，只有List中每个item符合List的item type时才接受list value。

When expected as an input, list values are accepted only when each item in the
list can be accepted by the list's item type.

如果传输给List type的输入值不是list，应该被当做大小是1的list的输入值，也就是说这个值是list中的唯一项；如果传输的只有一个argument，客户端只需传递该值即可，
无需构建list。

If the value passed as an input to a list type is *not* as list, it should be
coerced as though the input was a list of size one, where the value passed is
the only item in the list. This is to allow inputs that accept a "var args"
to declare their input type as a list; if only one argument is passed (a common
case), the client can just pass that value rather than constructing the list.

to-do  
Note that when a {null} value is provided via a runtime variable value for a list type, the value is interpreted as no list being provided, and not a list of size one with the value {null}.

### Non-Null

默认地，GraphQL 中的所有数据类型都是可为空的； {null} 是上述所有数据类型的一个有效返回值。要声明一个数据类型不允许空值，就要用到 GraphQL
Non-Null数据类型。该类型声明的是一种underlying基础数据类型，该数据类型和underlying type的作用等同，除了对于wrapping type而言 null不是有效返回值。
感叹号用来表示字段使用 Non-Null 非空数据类型，比如`name: String!`.

By default, all types in GraphQL are nullable; the {null} value is a valid
response for all of the above types. To declare a type that disallows null,
the GraphQL Non-Null type can be used. This type declares an underlying type,
and this type acts identically to that underlying type, with the exception
that {null}  is not a valid response for the wrapping type. A trailing
exclamation mark is used to denote a field that uses a Non-Null type like this:
`name: String!`.    


+**Nullable vs. Optional**
+
+Fields are *always* optional within the context of a query, a field may be
+omitted and the query is still valid. However fields that return Non-Null types
+will never return the value {null} if queried.
+
+Inputs (such as field arguments), are always optional by default. However a
+non-null input type is required. In addition to not accepting the value {null},
+it also does not accept omission. For the sake of simplicity nullable types
+are always optional and non-null types are always required.

**Result Coercion**

<<<<<<< HEAD:zh-cn/spec/Section 3 -- Type System.md
在上述所有对结果的强制转换中，`null`都是一个有效值。要想强制转换Non Null typ非空数据类型的结果，应该执行/完成underlying type的强制转换。
如果结果不是‘null’，那么对Non Null type 强制转换的结果就是结果本身。如果结果是‘null’，应该抛出错误。
=======
In all of the above result coercion, {null} was considered a valid value.
To coerce the result of a Non-Null type, the coercion of the wrapped type
should be performed. If that result was not {null}, then the result of coercing
the Non-Null type is that result. If that result was {null}, then a field error
must be raised.
>>>>>>> 6097d7b32c464552bccf116201cf310adb82835c:spec/Section 3 -- Type System.md


<<<<<<< HEAD:zh-cn/spec/Section 3 -- Type System.md
In all of the above result coercion, `null` was considered a valid value.
To coerce the result of a Non Null type, the result coercion of the
underlying type should be performed. If that result was not `null`, then the
result of coercing the Non Null type is that result. If that result was `null`,
then an error should be raised.

**Input Coercion**

注意在GraphQL中 ‘null’并不是一个值，因此查询不能这样写：
=======

If an argument or input-object field of a Non-Null type is not provided, is
provided with the literal value {null}, or is provided with a variable that was
either not provided a value at runtime, or was provided the value {null}, then
a query error must be raised.


If the value provided to the Non-Null type is provided with a literal value
other than {null}, or a Non-Null variable value, it is coerced using the input coercion for the wrapped type.


Example: A non-null argument cannot be omitted.   

```!graphql
{
  fieldWithNonNullArg
}
```

要表示argument 是空null，只有该argument不存在时才会被当做是null：

Example: The value {null} cannot be provided to a non-null argument. :

```!graphql
{
  fieldWithNonNullArg(nonNullArg: null) 
}
```

或者可为空的数据类型传递了一个variable，在运行时没有value：

Example: A variable of a nullable type cannot be provided to a non-null argument:

```graphql
query withNullableVariable($var: String) {
  fieldWithNonNullArg(nonNullArg: $var) 
 }
```


Note: The Validation section defines providing a nullable variable type to
a non-null input type as invalid.


#### Non-Null type validation

1. A Non-Null type must not wrap another Non-Null type.

>>>>>>> 6097d7b32c464552bccf116201cf310adb82835c:spec/Section 3 -- Type System.md

## Directives

GraphQL schema 中包含了一些执行器所支持的directive。

A GraphQL schema includes a list of the directives the execution
engine supports.

GraphQL 实现中应该提供 `@skip` and `@include` 的directives 指令。

GraphQL implementations should provide the `@skip` and `@include` directives.

### @skip

可以为field 或 fragmeng提供 `@skip` directive 指令，能够在执行时根据if argument来跳过。

The `@skip` directive may be provided for fields or fragments, and allows
for conditional exclusion during execution as described by the if argument.

在这个例子里只有当`$someTest`  是`false`时才会查询`experimentalField`字段。

In this example `experimentalField` will be queried only if the `$someTest` is
provided a `false` value.

```graphql
query myQuery($someTest: Boolean) {
  experimentalField @skip(if: $someTest)
}
```

### @include

可以为field 或 fragmeng提供 `@include` directive 指令，能够在执行时根据if argument来跳过。

The `@include` directive may be provided for fields or fragments, and allows
for conditional inclusion during execution as described by the if argument.

在这个例子里只有当`$someTest`  是`false`时才会查询`experimentalField`字段。

In this example `experimentalField` will be queried only if the `$someTest` is
provided a `true` value.

```graphql
query myQuery($someTest: Boolean) {
  experimentalField @include(if: $someTest)
}
```

<<<<<<< HEAD:zh-cn/spec/Section 3 -- Type System.md
The `@skip` directive has precedence over the `@include` directive should both
be provided in the same context.

=======
Note: Neither `@skip` nor `@include` has precedence over the other. In the case
that both the `@skip` and `@include` directives are provided in on the same the
field or fragment, it *must* be queried only if the `@skip` condition is false
*and* the `@include` condition is true. Stated conversely, the field or fragment
must *not* be queried if either the `@skip` condition is true *or* the
`@include` condition is false.
>>>>>>> 6097d7b32c464552bccf116201cf310adb82835c:spec/Section 3 -- Type System.md

## Starting types

GraphQL schema 包含了数据类型，表示query和mutation操作从哪里开始。这也是整个type system的起始入口点。query type总是存在的，是一个Object
base type。mutation type是可选的，如果是null的话，意味着system 不支持mutation。如果存在的话，必须是object base type。

A GraphQL schema includes types, indicating where query, mutation, and subscription 
operations start. This provides the initial entry points into the
type system. The query type must always be provided, and is an Object
base type. The mutation type is optional; if it is null, that means
the system does not support mutations. If it is provided, it must
be an object base type. Similarly, the subscription type is optional; if it is
null, the system does not support subscriptions. If it is provided, it must be
an object base type

query type中的字段field表示一个 GraphQL query 的最高级存在哪些字段field。比如，一个基本的 GraphQL query 如下所示：

The fields on the query type indicate what fields are available at
the top level of a GraphQL query. For example, a basic GraphQL query
like this one:

```graphql
query getMe {
  me
}
```

当存在query 起始类型中有一个叫做"me"的字段时是有效的，类似地：

Is valid when the type provided for the query starting type has a field
named "me". Similarly

```graphql
subscription {
  newMessage {
    text
  }
}
```

Is valid when the type provided for the subscription starting type is not null,
and has a field named "newMessage" and only contains a single root field. 


当存在 mutation 起始类型不为空时是有效的，存在一个字段叫 "setName"，该字段有一个叫"name"的argument。

Is valid when the type provided for the mutation starting type is not null,
and has a field named "setName" with a string argument named "name".
