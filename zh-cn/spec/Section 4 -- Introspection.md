# Introspection

GraphQL 服务器通过schema来实现 introspection。该schema可以使用 GraphQL 来进行查询，构成了构建其他工具的强力平台。

A GraphQL server supports introspection over its schema. This schema is queried
using GraphQL itself, creating a powerful platform for tool-building.

举个普通app查询的例子，其中有一个User 数据类型，包含了：id，user，birthday三个字段。

Take an example query for a trivial app. In this case there is a User type with
three fields: id, name, and birthday.

比如，服务器中存在如下type定义：

For example, given a server with the following type definition:

```
type User {
  id: String
  name: String
  birthday: Date
}
```

The query

```graphql
{
  __type(name: "User") {
    name
    fields {
      name
      type {
        name
      }
    }
  }
}
```

would return

```js
{
  "__type": {
    "name" : "User",
    "fields": [
      {
        "name": "id",
        "type": { "name": "String" }
      },
      {
        "name": "name",
        "type": { "name": "String" }
      },
      {
        "name": "birthday",
        "type": { "name": "Date" }
      },
    ]
  }
}
```

## 通用原则 General Principles

### 命名规范 Naming conventions

GraphQL introspection system 所要求的 Type 和field和用户自定义的type和field使用场景相同，但是多个两个下划线的前缀。这是为了避免与自定义的 graphql
type的命名冲突。相反地，GraphQL type system 作者必须不能定义任何type，field，argument，或其他任何有2个下划线的type system artifact。

Types and fields required by the GraphQL introspection system that are used in
the same context as user-defined types and fields are prefixed with {"__"} two underscores. This in order to avoid naming collisions with user-defined GraphQL
types. Conversely, GraphQL type system authors must not define any types, fields, arguments, or any other type system artifact with two leading
underscores.

### 文档 Documentation

在 introspection system 中的所有type 提供了一个 type 是‘String’叫‘description’的字段，type的设计人员可以发布一些除了功能之外的文档。GraphQL 
服务器在返回的‘description’字段值中可能会使用 Markdown 语法(as specified by [CommonMark](http://commonmark.org/)).因此推荐任何想要展示description信息的工具使用 CommonMark-compliant 的 Markdown 渲染器。

All types in the introspection system provide a `description` field of type
`String` to allow type designers to publish documentation in addition to
capabilities. A GraphQL server may return the `description` field using Markdown
syntax (as specified by [CommonMark](http://commonmark.org/)). Therefore it is
recommended that any tool that displays `description` use a CommonMark-compliant
Markdown renderer.
### Deprecation

为了支持对向后兼容性的管理，GraphQL 字段和enum 值可以表示它们是否已废弃(`isDeprecated: Boolean`)，以及为何被废弃的原因描述 (`deprecationReason: String`).

To support the management of backwards compatibility, GraphQL fields and enum
values can indicate whether or not they are deprecated (`isDeprecated: Boolean`)
and a description of why it is deprecated (`deprecationReason: String`).

使用 GraphQL introspection来构建的工具应使用信息隐藏或针对开发人员的警告信息来避免使用标记成deprecated的信息。

Tools built using GraphQL introspection should respect deprecation by
discouraging deprecated use through information hiding or developer-facing
warnings.

### Type Name Introspection

在查询任意Object、Interface、Union 的时候，通过meta field `__typename: String!`，GraphQL 可以为查询中的任何节点支持type name introspection。
它将返回正在被查询的object type的名称。

GraphQL supports type name introspection at any point within a query by the
meta field `__typename: String!` when querying against any Object, Interface,
or Union. It returns the name of the object type currently being queried.

在查询Interface或Union type来确定可能会返回的数据类型中真正的数据类型的时候是很常用的。

This is most often used when querying against Interface or Union types to
identify which actual type of the possible types has been returned.

该字段是隐式的，并不会出现在任何定义好的type的field list之中。

This field is implicit and does not appear in the fields list in any defined type.

## Schema Introspection

在 query operation 根节点类型上访问meta-fields `__schema`
and `__type`可以得到schema introspection system。

The schema introspection system is accessible from the meta-fields `__schema`
and `__type` which are accessible from the type of the root of a query
operation.

```
__schema : __Schema!
__type(name: String!) : __Type
```

该字段是隐式的，并不会出现在 query operation根类型的field list之中。

These fields are implicit and do not appear in the fields list in the root type
of the query operation.

The schema of the GraphQL schema introspection system:

```
type __Schema {
  types: [__Type!]!
  queryType: __Type!
  mutationType: __Type
  directives: [__Directive!]!
}

type __Type {
  kind: __TypeKind!
  name: String
  description: String

  # OBJECT and INTERFACE only
  fields(includeDeprecated: Boolean = false): [__Field!]

  # OBJECT only
  interfaces: [__Type!]

  # INTERFACE and UNION only
  possibleTypes: [__Type!]

  # ENUM only
  enumValues(includeDeprecated: Boolean = false): [__EnumValue!]

  # INPUT_OBJECT only
  inputFields: [__InputValue!]

  # NON_NULL and LIST only
  ofType: __Type
}

type __Field {
  name: String!
  description: String
  args: [__InputValue!]!
  type: __Type!
  isDeprecated: Boolean!
  deprecationReason: String
}

type __InputValue {
  name: String!
  description: String
  type: __Type!
  defaultValue: String
}

type __EnumValue {
  name: String!
  description: String
  isDeprecated: Boolean!
  deprecationReason: String
}

enum __TypeKind {
  SCALAR
  OBJECT
  INTERFACE
  UNION
  ENUM
  INPUT_OBJECT
  LIST
  NON_NULL
}

type __Directive {
  name: String!
  description: String
  args: [__InputValue!]!
<<<<<<< HEAD:zh-cn/spec/Section 4 -- Introspection.md
  onOperation: Boolean!
  onFragment: Boolean!
  onField: Boolean!
=======
}

enum __DirectiveLocation {
  QUERY
  MUTATION
  FIELD
  FRAGMENT_DEFINITION
  FRAGMENT_SPREAD
  INLINE_FRAGMENT
>>>>>>> 6097d7b32c464552bccf116201cf310adb82835c:spec/Section 4 -- Introspection.md
}
```


### The "__Type" Type

`__Type`  是 type introspection system的核心，它表示system 中的scalar、interface、object type、union和enum。

`__Type` is at the core of the type introspection system.
It represents scalars, interfaces, object types, unions, enums in the system.

`__Type` 也能表示用于修改它所指向的type (`ofType: __Type`)的type modifier。这也是我们如何来表示list、non-nullable type和combination。

`__Type` also represents type modifiers, which are used to modify a type
that it refers to (`ofType: __Type`). This is how we represent lists,
non-nullable types, and the combinations thereof.

### Type Kinds

有很多种不同类型的type。每一种中，不同的field实际上是有效的。这些类别罗列在 `__TypeKind` enumeration之中。

There are several different kinds of type. In each kind, different fields are
actually valid. These kinds are listed in the `__TypeKind` enumeration.

#### Scalar

表示诸如 Int, String, and Boolean的scalar type。scalar 不能有field。

Represents scalar types such as Int, String, and Boolean. Scalars cannot have fields.

GraphQL type设计人员应该在任意scalar的description字段中描述数据格式和scalar coercion的规则。

A GraphQL type designer should describe the data format and scalar coercion
rules in the description field of any scalar.

Fields

* `kind` must return `__TypeKind.SCALAR`.
* `name` must return a String.
* `description` may return a String or {null}.
* All other fields must return {null}.

#### Object

Object types表示字段集合具体的实例化。introspection type(e.g. `__Type`, `__Field`, etc)是object的例子。

Object types represent concrete instantiations of sets of fields. The
introspection types (e.g. `__Type`, `__Field`, etc) are examples of objects.

Fields

* `kind` must return `__TypeKind.OBJECT`.
* `name` must return a String.
* `description` may return a String or {null}.
* `fields`: The set of fields query-able on this type.
  * Accepts the argument `includeDeprecated` which defaults to {false}. If
    {true}, deprecated fields are also returned.
* `interfaces`: The set of interfaces that an object implements.
* All other fields must return {null}.

#### Union

Union是没有声明任何常用字段的抽象数据类型。一个union可能的type明确的罗列在 `possibleTypes`之中.
在不对type进行修改的情况下，type就可以是union的一部分。

Unions are an abstract types where no common fields are declared. The possible
types of a union are explicitly listed out in `possibleTypes`. Types can be
made parts of unions without modification of that type.

Fields

* `kind` must return `__TypeKind.UNION`.
* `name` must return a String.
* `description` may return a String or {null}.
* `possibleTypes` returns the list of types that can be represented within this
  union. They must be object types.
* All other fields must return {null}.

#### Interface

interface 是声明了常用字段的抽象类型。任何实现了某个interface的type必须定义所有名称、类型都完全一致的字段。
interface的实现明确罗列在`possibleTypes`之中。

Interfaces is an abstract type where there are common fields declared. Any type
that implements an interface must define all the fields with names and types
exactly matching. The implementations of this interface are explicitly listed
out in `possibleTypes`.

Fields

* `kind` must return `__TypeKind.INTERFACE`.
* `name` must return a String.
* `description` may return a String or {null}.
* `fields`: The set of fields required by this interface.
  * Accepts the argument `includeDeprecated` which defaults to {false}. If
    {true}, deprecated fields are also returned.
* `possibleTypes` returns the list of types that implement this interface.
  They must be object types.
* All other fields must return {null}.

#### Enum

Enum是只能有定义好的某些值集的特殊scalar。

Enums are special scalars that can only have a defined set of values.

Fields

* `kind` must return `__TypeKind.ENUM`.
* `name` must return a String.
* `description` may return a String or {null}.
* `enumValues`: The list of `EnumValue`. There must be at least one and they
  must have unique names.
  * Accepts the argument `includeDeprecated` which defaults to {false}. If
    {true}, deprecated enum values are also returned.
* All other fields must return {null}.

#### Input Object

Input objects 是复合数据类型，用作查询的输入，使用有名称的input value列表来定义。

Input objects are composite types used as inputs into queries defined as a list
of named input values.

比如 input object ‘Point’可以按如下定义：

For example the input object `Point` could be defined as:

```
input Point {
  x: Int
  y: Int
}
```

Fields

* `kind` must return `__TypeKind.INPUT_OBJECT`.
* `name` must return a String.
* `description` may return a String or {null}.
* `inputFields`: a list of `InputValue`.
* All other fields must return {null}.

#### List

在GraphQL 中 list表示一组值。List type 是一个type modifier：也就是说它将其他type instance 封装在 ‘ofType’字段中，其中定义了list中每个项的具体数据类型。

Lists represent sequences of values in GraphQL. A List type is a type modifier:
it wraps another type instance in the `ofType` field, which defines the type of
each item in the list.

Fields

* `kind` must return `__TypeKind.LIST`.
* `ofType`: Any type.
* All other fields must return {null}.

#### Non-null

GraphQL types是可为空的。{null} 是一个有效的字段类型的响应值。

GraphQL types are nullable. The value {null} is a valid response for field type.

Non-null type是一个type modifier：它封装了其他type instance在 ‘ofType’字段中。Non-null type 不允许在response 中使用{null}，and indicate
required inputs for arguments and input object fields.

A Non-null type is a type modifier: it wraps another type instance in the
`ofType` field. Non-null types do not allow {null} as a response, and indicate
required inputs for arguments and input object fields.

* `kind` must return `__TypeKind.NON_NULL`.
* `ofType`: Any type except Non-null.
* All other fields must return {null}.

#### Combining List and Non-Null

List 和Non-Null 可以组合起来，表达更加复杂的数据类型。

List and Non-Null can compose, representing more complex types.

如果list的modified type 是Non-Null，那么List不可能包含{null}项。

If the modified type of a List is Non-Null, then that List may not contain any
{null} items.

如果 Non-Null 的modified type是List，那么不能使用{null}，但能够使用一个空list。

If the modified type of a Non-Null is List, then {null} is not accepted,
however an empty list is accepted.

如果List的modified type是List，then each item in the first List is
another List of the second List's type.

If the modified type of a List is a List, then each item in the first List is
another List of the second List's type.

一个Non-Null 类型不能够修饰另外一个 Non-Null 类型。

A Non-Null type cannot modify another Non-Null type.


### The __Field Type

The `__Field` type represents each field in an Object or Interface type.

Fields

* `name` must return a String
* `description` may return a String or {null}
* `args` returns a List of `__InputValue` representing the arguments this
  field accepts.
* `type` must return a `__Type` that represents the type of value returned by
  this field.
* `isDeprecated` returns {true} if this field should no longer be used,
  otherwise {false}.
* `deprecationReason` optionally provides a reason why this field is deprecated.


### The __InputValue Type

The `__InputValue` type represents field and directive arguments as well as the
`inputFields` of an input object.

Fields

* `name` must return a String
* `description` may return a String or {null}
* `type` must return a `__Type` that represents the type this input
  value expects.
* `defaultValue` may return a String encoding (using the GraphQL language) of the
  default value used by this input value in the condition a value is not
  provided at runtime. If this input value has no default value, returns {null}.

### The __EnumValue Type

The `__EnumValue` type represents one of possible values of an enum.

Fields

* `name` must return a String
* `description` may return a String or {null}
* `isDeprecated` returns {true} if this field should no longer be used,
  otherwise {false}.
* `deprecationReason` optionally provides a reason why this field is deprecated.

### The __Directive Type

The `__Directive` type represents a Directive that a server supports.

Fields

* `name` must return a String
* `description` may return a String or {null}
* `locations` returns a List of `__DirectiveLocation` representing the valid
  locations this directive may be placed.
* `args` returns a List of `__InputValue` representing the arguments this
  directive accepts.

