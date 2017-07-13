# 概述Overview

GraphQL 是为了在构建客户端程序时所设计的查询语言，能够提供一种灵活的语法和体系来描述客户端的数据需求和交互。

GraphQL is a query language designed to build client applications by providing
an intuitive and flexible syntax and system for describing their data
requirements and interactions.

比如，如下的GraphQL请求能够从 Facebook 的 GraphQL 实现中拿到 id 为4的 user 的 name 值，

For example, this GraphQL request will receive the name of the user with id 4
from the Facebook implementation of GraphQL.

```graphql
{
  user(id: 4) {
    name
  }
}
```

得到的(JSON格式)数据为：
Which produces the resulting data (in JSON):

```js
{
  "user": {
    "name": "Mark Zuckerberg"
  }
}
```

GraphQL 并不是能够完成各种计算的编程语言，相反的，是一种用来查询实现了该标准中所定义功能的应用服务器的语言。
GraphQL 并不强制要求实现应用服务器时使用某种编程语言或存储系统。相反，应用服务器利用自身的功能，将其映射到一种统一的语言(GraphQL)，类型体系，序列化的哲学(方式)。
这样就提供了一种对软件开发友好的统一接口和构建工具的强大平台。

GraphQL is not a programming language capable of arbitrary computation, but is
instead a language used to query application servers that have
capabilities defined in this specification. GraphQL does not mandate a
particular programming language or storage system for application servers that
implement it. Instead, application servers take their capabilities and map them
to a uniform language, type system, and philosophy that GraphQL encodes.
This provides a unified interface friendly to product development and a powerful
platform for tool-building.

GraphQL 拥有如下诸多设计原则：

* **层次化**: 
现如今大多数产品开发都涉及到视图层次的构建和组织。为了与这些系统的结构达成一致，GraphQL 查询本身也是层次化结构。查询的格式与返回
数据的格式很类似。这是一种很自然的客户端用来描述数据需求的方式。

* **以产品为核心**: 
毫无疑问，GraphQL 是受视图的需求和编写视图的前端工程师所影响的。GraphQL 从一开始就按照前端工程师思考的方式和前端工程师的需求入手，
来构建 GraphQL 语言和实现它所需要的一些运行时工具。   

* **强类型**: 
每一个 GraphQL 服务器都定义了一种针对某个系统的类型体系，在这种类型体系之下执行查询。对于某个查询，在执行之前，
可以使用工具来确保该查询在该类型体系之下语法上是正确的，有效地，比如，在开发阶段，服务器可以对响应的形式和本身做一些约定。

* **客户端规定的查询**: 
通过服务器端的类型体系，GraphQL 服务器发布一些供客户端使用的功能。客户端负责确定如何来使用这些已经发布的功能。这些查询的粒度是在字段层面的。大多数
没有使用 GraphQL 所开发的CS架构的系统，是由服务器来决定各种 endpoint 返回的数据格式。而另一方面, GraphQL 会严格按照客户端要求返回数据。

* **Introspective**: 
GraphQL is introspective. GraphQL 服务器的类型体系必须能够使用该文档中所描述 GraphQL 语言本身来查询。GraphQL introspection 可以作为构建通用工具和客户端软件库的强力平台。

GraphQL has a number of design principles:

 * **Hierarchical**: Most product development today involves the creation and
   manipulation of view hierarchies. To achieve congruence with the structure
   of these applications, a GraphQL query itself is structured hierarchically.
   The query is shaped just like the data it returns. It is a natural
   way for clients to describe data requirements.

 * **Product-centric**: GraphQL is unapologetically driven by the requirements
   of views and the front-end engineers that write them. GraphQL starts with
   their way of thinking and requirements and build the language and runtime
   necessary to enable that.

 * **Strong-typing**: Every GraphQL server defines an application-specific
   type system. Queries are executed within the context of that type system.
   Given a query, tools can ensure that the query is both syntactically
   correct and valid within the GraphQL type system before execution, i.e. at
   development time, and the server can make certain guarantees about the shape
   and nature of the response.

 * **Client-specified queries**: Through its type system, a GraphQL server
   publishes the capabilities that its clients are allowed to consume. It is
   the client that is responsible for specifying exactly how it will consume
   those published capabilities. These queries are specified at field-level
   granularity. In the majority of client-server applications written
   without GraphQL, the server determines the data returned in its various
   scripted endpoints. A GraphQL query, on the other hand, returns exactly what
   a client asks for and no more.

 * **Introspective**: GraphQL is introspective. A GraphQL server's type system
   must be queryable by the GraphQL language itself, as will be described in this
   specification. GraphQL introspection serves as a powerful platform for
   building common tools and client software libraries.

由于有了以上的设计原则，GraphQL 成为一种构建客户端系统/应用的强大和高效的环境。利用已经在运行的  GraphQL 服务器来构建系统的软件开发人员和设计人员，在工具帮助下，无需阅读大量的文档，
只需少量或非正式培训即可快速成为生产力。要实现这样的效果，必须要有人构建这类服务器和工具。

Because of these principles, GraphQL is a powerful and productive environment
for building client applications. Product developers and designers building
applications against working GraphQL servers -- supported with quality tools --
can quickly become productive without reading extensive documentation and with
little or no formal training. To enable that experience, there must be those
that build those servers and tools.

对于这些构建服务器和工具的开发人员，下面的标准正文可以作为参考。其中描述了语言和语言的语法、类型体系、用于查询的 introspection system 和利用算法来实现 GraphQL 的执行和校验引擎。
该标准的目的在于为 GraphQL 工具，客户端库、跨平台跨机构的服务器端实现的生态体系提供一个基础和框架。我们期望能够和社区一起实现这样的目标。

The following formal specification serves as a reference for those builders.
It describes the language and its grammar; the type system and the
introspection system used to query it; and the execution and validation engines
with the algorithms to power them. The goal of this specification is to provide
a foundation and framework for an ecosystem of GraphQL tools, client libraries,
and server implementations -- spanning both organizations and platforms -- that
has yet to be built. We look forward to working with the community
in order to do that.


