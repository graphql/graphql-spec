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

## Potential concerns, challenges, and drawbacks

### Client re-renders

With incremental delivery, where multiple responses are delivered in one request, client code could re-render its UI multiple times in a short period of time. This could degrade performance of the application, negating the performance gains from using `@defer` or `@stream`. There are a few approaches that could be taken to mitigate this. Each of these approaches are orthogonal to one another, i.e. the working group could decide that more than one of these should be included in the spec or be labeled as best practices.

These solutions require the GraphQL client to efficiently process multiple responses at the same time. (Relay support added here: https://github.com/facebook/relay/commit/b4c92a23ae061943ea7a2ddb5e2f7686d3af8c0e)

1. __Client relies on transport to receive multiple responses.__ If the incremental responses are being sent over HTTP connection with chunked encoding, the client may receive multiple responses in a single read of HTTP stream and process them at the same time. This is only likely to happen when the responses are small and sent very close together. This would not work for all possible transport types, e.g. web sockets where each frame is received separately.

For example, the client might receive several responses at once:
```

---
Content-Type: application/json
Content-Length: 125

{
    "path": ["viewer","itemSearch","edges",5],
    "data": {
        "node": {
            "item": {
                "attribute": "Vintage 1950s Swedish Scandinavian Modern"
            }
        }
    }
}

---
Content-Type: application/json
Content-Length: 126

{
    "path": ["viewer","itemSearch","edges",6],
    "data": {
        "node": {
            "item": {
                "attribute": "Mid-20th Century Italian Hollywood Regency"
            }
        }
    }
}

---
Content-Type: application/json
Content-Length: 124

{
    "path": ["viewer","itemSearch","edges",7],
    "data": {
        "node": {
            "item": {
                "attribute": "Vintage 1950s Italian Mid-Century Modern"
            }
        }
    }
}
```

It could then process each of these before triggering a re-render.

2. __Client side debounce.__ GraphQL clients can debounce the processing of responses before triggering a re-render. For a query that contains `@defer` or `@stream`, the client will wait a predetermined amount of time starting from when a response is received. If any additional responses are received in that time, it can process the results in one batch. This has the downside of adding latency; if no additional responses are receiving in the timeout period, the processing of the initial response is delayed by the length of the debounce timeout. There is also significant complexity in determining the most optimal amount of time for debouncing. Even if this "magic number" is determined by analzing historical performance data, it is not constant and must be re-evaluated as queries and server implementation changes over time.

3. __Server sends batched responses.__ This approach changes the spec to allow GraphQL to return either the current GraphQL Response map, or a list of GraphQL Response maps. This gives the server the flexibility to determine when it is beneficial to group incremental responses together. If several responses are ready at the same time, the server can deliver them together. The server may also have knowledge of how long resolvers will take to resolve and could choose to debounce. It is also worth noting that a naive debouncing algorithm on the server could also result in degraded performance by introducing latency.

An example batched response:

```json
---
[
    {
        "path": ["viewer","itemSearch","edges",5],
        "data": {
            "node": {
                "item": {
                    "attribute": "Vintage 1950s Swedish Scandinavian Modern"
                }
            }
        }
    },
    {
        "path": ["viewer","itemSearch","edges",6],
        "data": {
            "node": {
                "item": {
                    "attribute": "Mid-20th Century Italian Hollywood Regency"
                }
            }
        }
    },
    {
        "path": ["viewer","itemSearch","edges",7],
        "data": {
            "node": {
                "item": {
                    "attribute": "Vintage 1950s Italian Mid-Century Modern"
                }
            }
        }
    }
]
```



1. __Server can ignore `@defer`/`@stream`.__ This approach allows the GraphQL server to treat `@defer` and `@stream` as hints. The server can ignore these directives and include the deferred data in previous responses. This requires clients to be written with the expectation that deferred data could arrive in either its own incrementally delivered response or part of a previously delivered response. This solution does not require the client to be able to process multiple responses at the same time.
