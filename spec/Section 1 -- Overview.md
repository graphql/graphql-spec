# Overview

GraphQL is a query language designed to build client applications by providing
an intuitive and flexible syntax and system for describing their data
requirements and interactions.

For example, this GraphQL request will receive the name of the user with id 4
from the Facebook implementation of GraphQL.

```graphql example
{
  user(id: 4) {
    name
  }
}
```

Which produces the resulting data (in JSON):

```json example
{
  "user": {
    "name": "Mark Zuckerberg"
  }
}
```

GraphQL is not a programming language capable of arbitrary computation, but is
instead a language used to query application services that have
capabilities defined in this specification. GraphQL does not mandate a
particular programming language or storage system for application services that
implement it. Instead, application services take their capabilities and map them
to a uniform language, type system, and philosophy that GraphQL encodes.
This provides a unified interface friendly to product development and a powerful
platform for tool-building.

GraphQL has a number of design principles:

 * **Hierarchical**: Most product development today involves the creation and
   manipulation of view hierarchies. To achieve congruence with the structure
   of these applications, a GraphQL query itself is structured hierarchically.
   The query is shaped just like the data it returns. It is a natural
   way for clients to describe data requirements.

 * **Product-centric**: GraphQL is unapologetically driven by the requirements
   of views and the front-end engineers that write them. GraphQL starts with
   their way of thinking and requirements and builds the language and runtime
   necessary to enable that.

 * **Strong-typing**: Every GraphQL service defines an application-specific
   type system. Queries are executed within the context of that type system.
   Given a query, tools can ensure that the query is both syntactically
   correct and valid within the GraphQL type system before execution, i.e. at
   development time, and the service can make certain guarantees about the shape
   and nature of the response.

 * **Client-specified queries**: Through its type system, a GraphQL service
   publishes the capabilities that its clients are allowed to consume. It is
   the client that is responsible for specifying exactly how it will consume
   those published capabilities. These queries are specified at field-level
   granularity. In the majority of client-server applications written
   without GraphQL, the service determines the data returned in its various
   scripted endpoints. A GraphQL query, on the other hand, returns exactly what
   a client asks for and no more.

 * **Introspective**: GraphQL is introspective. A GraphQL service's type system
   must be queryable by the GraphQL language itself, as will be described in this
   specification. GraphQL introspection serves as a powerful platform for
   building common tools and client software libraries.

Because of these principles, GraphQL is a powerful and productive environment
for building client applications. Product developers and designers building
applications against working GraphQL services—supported with quality tools—can
quickly become productive without reading extensive documentation and with
little or no formal training. To enable that experience, there must be those
that build those services and tools.

The following formal specification serves as a reference for those builders.
It describes the language and its grammar, the type system and the
introspection system used to query it, and the execution and validation engines
with the algorithms to power them. The goal of this specification is to provide
a foundation and framework for an ecosystem of GraphQL tools, client libraries,
and service implementations—spanning both organizations and platforms—that
has yet to be built. We look forward to working with the community
in order to do that.
