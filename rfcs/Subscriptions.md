RFC: GraphQL Subscriptions
-------

*Working Draft - February 2017*

**Introduction**

Modern applications increasingly include scenarios where users receive immediate feedback when something interesting happens. When these applications outgrow simple polling solutions, they turn to stateful, bi-directional solutions that push data from server to client. There are many ways to extend GraphQL to support push-based solutions. By standardizing these concepts and solutions, we can keep the community cohesive, and ensure sustainable future improvements.

**Background**

Using the standard request/response GraphQL model, apps can support realtime scenarios by repeatedly issuing the same GraphQL query. However, this solution is inefficient and large scale apps may turn prefer push-based solutions. Compared to polling, push-based solutions trade off statelessness and simplicity for efficiency while raising new questions and challenges. For example: how is an “interesting event” detected and propagated? How does the GraphQL language express these semantics? How does this affect the client-side GraphQL API?

There are multiple valid answers to these questions, several of which have been proposed by the open-source community already [1][2][3]. At Facebook, we have been using “GraphQL Subscriptions” [4] at scale since 2015. Following our open-source philosophy, we now believe we have demonstrated that this system is useful and generalizable. We would like to contribute our ideas to the conversation.

One of GraphQL's superpowers is allowing clients to specify exactly the data they need, sidestepping a problem we call “over/under-fetching”. With push-based GraphQL solutions, we have a similar problem: “over/under pushing.” Under-pushing means we didn't send enough data, and the client now needs to make a follow-up network request. Over-pushing means we sent the client too much data; in the best case this data is irrelevant and doesn't waste anybody's mobile data plan, in the worst case, this data contains sensitive information that the client should not see.

**Possible Solutions**

We broadly categorize realtime API solutions into three types:

 * **Polling**- the client periodically issues a request to check on the state of the data it cares about. Polling solutions are simple, stateless, and work with existing GraphQL applications with little extra code. However, polling is difficult to tune. When updates are infrequent/unpredictable, polling is wasteful. When updates are frequent, polling introduces additional latency. If apps outgrow polling-based solutions, they should evaluate Subscriptions and Live Queries.

 * **Event-based Subscriptions**- the client tells the server that it cares about one or more events. Whenever those events trigger, the server notifies the client via a bi-directional transport. This model requires the server to identify a well-known set of events, and how to raise/propagate them, ahead of time. Subscriptions require server-side state, such as which subscriptions are alive, what events they are listening to, and the mapping of client connections to subscriptions. Among event-based subscriptions, we see a few sub-classes:

  * **Fixed-payload Subscriptions**- clients only tell the server about the event(s) they're interested in and are then pushed fixed payloads. That is, the payload contents are determined by the server. For example, a flight tracker broadcasts “Flight 123 is delayed by 30 minutes” to all subscribers. This type of solution works for cases where all clients should receive the same payload. For cases where the payload is more complex or differs between users, fixed-payloads potentially send data that the client doesn't need, resulting in “over-pushing” (the push-based equivalent of over-fetching).

  * **Zero-payload Subscriptions**- this type of subscription sends empty events to the client where it triggers a data fetch or client-side state invalidation. Essentially, this style always “under-pushes”. This style is simple, but carries some tradeoffs. The client is now responsible for interpreting and reacting events coming from the server. This technique also has higher latency since the client must issue a network request in response to any event.

  * **Data-transform pipelines**- for cases where data payloads differ between subscribers, there is a class of systems that use dynamically configurable data streams. These systems require a more sophisticated event layer capable of dynamically specifying per-subscriber data-transform logic. This way, the output payload from the event layer is already subscriber-specific. The drawback of these systems is high complexity and distributed business logic. Our proposal (GraphQL Subscriptions) builds on this type of solution.

 * **Live Queries**- the client issues a standard query to the server but annotates all or part of the query to be “live”. Whenever the answer to the query changes, the server pushes the new data to the client via a persistent, bi-directional transport. The key difference between Live Queries and Subscriptions is that Live Queries do not depend on the notion of events. The data itself is live and includes mechanisms to communicate changes. Note that many subscription use cases can be transformed into live queries and vice versa. Live Queries rely on clever ways to detect when underlying data has changed. Live Queries require reactive data layers, polling, or a combination of both [5].

In the case of subscriptions and live queries, the addition of server-side state means production-grade systems will need to consider scalability, high-availability, throttling, buffering, and event/delivery rate mismatches in their designs.

**Proposed Solution: GraphQL Subscriptions**

Clients send the server a GraphQL query and query variables. The server maps these inputs to a set events, and executes the query when the events trigger. This model avoids over-pushing/under-pushing but requires a GraphQL backend. GraphQL Subscriptions provides an abstraction over individual events and exposes an API where the client subscribes to a query. Compared with existing data-transform pipeline techniques, GraphQL Subscriptions produces privacy-aware, right-sized payloads without add duplicate business logic to the event/messaging layer.

At Facebook, we believe GraphQL Subscriptions exhibits a set of useful tradeoffs and warrants definition and inclusion in the GraphQL specification. By specifying GraphQL Subscriptions, we hope to achieve the following goals:

* Make GraphQL Subscriptions a great API choice for building realtime applications.

* Enable interoperability between GraphQL Subscription clients and servers without restricting implementation.

* Enable a strong tooling ecosystem (like GraphiQL).

* Provide concrete guidance to anyone currently building/operating systems to support GraphQL Subscriptions.

* Provide clarity to teams evaluating GraphQL Subscriptions.

We'll try to define the irreducible components of a GraphQL Subscriptions system below:

* **Subscriptions System-** a component that manages the lifetime of Subscription objects. Each individual subscription executes a query in response to one or more events. Subscriptions are created by specifying a query and optional query variables. These inputs are then mapped to a set of events. Whenever one of these events fires, the subscription executes the query, variables, and event payload and invokes the specified callback function with the response.

* **Events**: any “interesting thing” the system cares about. Events contain optional data to describe what happened. For example, a “new email” event might define a payload that contains the ID of the new email. The combination of query, query variables, and payload is executed to create a GraphQL response in the shape that the client expects.

Reference-style:
![blockdiagram]

[blockdiagram]: https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png



# [Overview](Section 1 -- Overview.md)

# [Language](Section 2 -- Language.md)

# [Type System](Section 3 -- Type System.md)

# [Introspection](Section 4 -- Introspection.md)

# [Validation](Section 5 -- Validation.md)

# [Execution](Section 6 -- Execution.md)

# [Response](Section 7 -- Response.md)

# [Appendix: Notation Conventions](Appendix A -- Notation Conventions.md)

# [Appendix: Grammar Summary](Appendix B -- Grammar Summary.md)
