RFC: GraphQL Defer and Stream Directives
-------

*Working Draft - January 2020*

**Introduction**

While the definition for "fast" and "slow" varies across applications, a universal concept they share is the existence of critical elements. These are parts of an application that should be immediately available to the end-user. Prioritizing these critical elements often involves deprioritizing their non-critical counterparts. This solution usually entails splitting out non-critical fragments and fields into separate queries, which incur the cost of optimizing critical elements while worsening non-critical ones. This document proposes directives `@defer` and `@stream` that introduce the ability to within a query selectively fetch fragments and items in a list, respectively, without impacting the response time of the query or of the deferred fields.

**Background**

A weakness of GraphQL is that individual queries are only as fast as their slowest field. The workaround is to —- when feasible -— extract non-performant fields from one query to another and delay its execution until the original query completes. This solution presents significant inefficiencies. Clients are forced to ask for data and build queries based on field performance instead of need. In addition, while the serialization of the execution of these queries improves the initial query, it further degrades the performance of the subsequent query.

Over the past few years, the open-source GraphQL community has collectively rallied around the introduction of `@defer` and `@stream` directives to solve this problem[1][2][3]; however, the GraphQL spec does not recognize these directives and in turn there are no open-source GraphQL servers that support its implementation.

A `@defer` directive would allow clients to annotate fragments that are non-critical or non-performant, optimizing the performance of the query without impacting the performance of the deferred fragments, and keeping the query structure intact. Similarly, a `@stream` directive would allow clients to annotate list fields in order to prioritize the first items of a list. Clients can return to building queries according to exactly the data they need, fully taking advantage of the flexibility GraphQL offers—one of its greatest strengths.

- [1] [Lee Byron on idea of @defer and @stream](https://www.youtube.com/watch?v=ViXL0YQnioU&feature=youtu.be&t=9m4s)
- [2] [[Proposal] Introducing @defer in Apollo Server](https://blog.apollographql.com/introducing-defer-in-apollo-server-f6797c4e9d6e)
- [3] [Active development on @defer and @stream in Relay at Facebook](https://github.com/graphql/graphql-wg/issues/329)