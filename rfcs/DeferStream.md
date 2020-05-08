RFC: GraphQL Defer and Stream Directives
-------

*Working Draft - January 2020*

# Introduction

One of the disadvantages of GraphQL’s request/response model is that applications which retrieve large datasets may suffer from latency. However not all requested data may be of equal importance, and in some use cases it may be possible for applications to act on a subset of the requested data.  

Today applications which seek to ensure that data of high importance can be retrieved quickly have a few options:

* Splitting queries
* Prefetching

However each of these solutions imposes some undesirable trade-offs on applications.

## Splitting queries

Given a query where some fields are expensive and non-essential, non-essential fields can be fetched in a separate query issued after an initial query. In the context of lists, this may mean fetching only the first few items in a list and issuing a follow-up pagination request for additional items. By separating the requests based on data priority, we have achieved a faster delivery time to essential data. However, query splitting imposes several **trade-offs** on applications:

**Increased latency for lower priority fields,** as now these fields have to wait for the original query to complete and have added network round trips
**Client resource contention.** Issuing multiple requests can increase contention on scarce resources like battery and antenna. 
**Increased cost.** Processing additional requests can increase server costs by putting pressure on both the middle tier and the data layer. For example a follow-up query may need to load a subset of the same data loaded by the initial query, putting additional pressure on data stores.

## Prefetching
This technique involves optimistically fetching data based on a prediction that a user will execute an action. Prefetching can be one of the most effective ways of reducing latency. However, a significant tradeoff with prefetching that a lot of applications cannot afford is **increased server cost due to incorrect predictions.** With an unsophisticated prefetch algorithm, applications can easily overfetch by a factor of 10 fold.

# Proposal: Incrementally deliver data with @defer and @stream

This proposal would introduce @stream and @defer directives which clients could use to communicate the relative priority of requested data to GraphQL implementations. Furthermore this proposal would enable GraphQL APIs to split requested data across multiple response payloads in order of priority. The goal of this proposal is to enable applications to reduce latency without increasing server cost or resource contention.

While both incremental delivery and GraphQL subscriptions send multiple payloads over time, **incremental delivery is _not_ intended to enable applications to respond to real-time changes.** Consequently streams opened for incremental delivery are expected to be short-lived. **Implementations are not required to reflect interleaving mutations which occur during incremental delivery.** Assuming there are no interleaving mutations, combining together the various payloads in an incrementally delivered response should produce the same output as if that response was not delivered incrementally.

Facebook has been using Incremental Delivery at scale since 2017, including on major surfaces such as news feed. This proposal captures the key concepts that we have found to be useful. 

GraphQL servers will not be required to implement `@defer` and/or `@stream`. If they are implemented, they will be required to follow the proposed specification. Servers that do not implement `@defer` and/or `@stream` should not expose these directives in their schema. Queries containing these directives that are sent to an unsupported server should fail validation.

## `@defer`
The @defer directive may be specified on a fragment spread to imply de-prioritization, that causes the fragment to be omitted in the initial response, and delivered as a subsequent response afterward. A query with @defer directive will cause the request to potentially return multiple responses, where non-deferred data is delivered in the initial response and data deferred delivered in a subsequent response. `@include` and `@skip` take presedence over `@defer`.

### `@defer` arguments
* `if: Boolean`
  * When `true` fragment may be deferred, if omitted defaults to `true`.
* `label: String`
  * A unique label across all `@defer` and `@stream` directives in an operation.
  * This `label` should be used by GraphQL clients to identify the data from patch responses and associate it with the correct fragment.
  * If provided, the GraphQL Server must add it to the payload.

## `@stream`

The `@stream` directive may be provided for a field of `List` type so that the backend can leverage technology such asynchronous iterators to provide a partial list in the initial response, and additional list items in subsequent responses. `@include` and `@skip` take presedence over `@stream`.

### `@stream `arguments
* `if: Boolean`
  * When `true` field may be streamed, if omitted defaults to `true`.
* `label: String`
  * A unique label across all `@defer` and `@stream` directives in an operation.
  * This `label` should be used by GraphQL clients to identify the data from patch responses and associate it with the correct fragments.
  * If provided, the GraphQL Server must add it to the payload.
* `initialCount: Int`
  * The number of list items the server should return as part of the initial response.

## Payload format

When an operation contains `@defer` or `@stream` directives, the GraphQL execution will return multiple payloads. The first payload is the same shape as a standard GraphQL response. Any fields that were only requested on a fragment that is deferred will not be present in this payload. Any list fields that are streamed will only contain the initial list items.

Each subsequent payload will be an object with the following properties
* `label`: The string that was passed to the label argument of the `@defer` or `@stream` directive that corresponds to this results.
* `data`: The data that is being delivered incrementally.
* `path`: a list of keys (with plural indexes) from the root of the response to the insertion point that informs the client how to patch a subsequent delta payload into the original payload.
* `isFinal`: A boolean that is present and `false` when there are more payloads that will be sent for this operation.
* `errors`: An array that will be present and contain any field errors that are produced while executing the deferred or streamed selection set.
* `extensions`: For implementors to extend the protocol

Note: The `label` field is not a unique identifier for payloads. There may be multiple payloads with the same label for either payloads for `@stream`, or payloads from a `@defer` fragment under a list field. The combination of `label` and `path` will be unique among all payloads.

## Server requirements for `@defer` and `@stream`

The ability to defer/stream parts of a response can have a potentially significant impact on application performance. Developers generally need clear, predictable control over their application's performance. It is highly recommended that the GraphQL server honor the @defer and @stream directives on each execution. However, the specification will allow advanced use-cases where the server can determine that it is more performant to not defer/stream. Therefore, GraphQL clients should be able to process a response that ignores the defer/stream directives.

This also applies to the `initialCount` argument on the `@stream` directive. Clients should be able to process a streamed response that contains a different number of initial list items than what was specified in the `initialCount` argument.

## Example Query with @defer and @stream

```
{
  viewer {
    id
    friends(first: 2) @stream(initialCount: 1, label: "friendStream") {
	  id
    }
  }
  ...GroupAdminFragment @defer(label: "groupAdminDefer")
}

fragment GroupAdminFragment {
   managed_groups {
      id
   }
}

// Response payloads

// payload 1
{
    data: {id: 1},
    isFinal: false
}

// payload 2
{
  label: "friendStream"
  path: [“viewer”, “friends”, 1],
  data: {id: 4},
  isFinal: false
}

// payload 3
{
  label: "friendStream"
  path: [“viewer”, “friends”, 2],
  data: {id: 5},
  isFinal: false
}

// payload 4
{
  label: "groupAdminDefer",
  path: [“viewer”],
  data: {managed_groups: [{id: 1, id: 2}]}
}
```

## Benefits of incremental delivery
* Make GraphQL a great choice for applications which demand responsiveness
* Enable interoperability between different GraphQL clients and servers without restricting implementation.
* Enable a strong tooling ecosystem (including GraphiQL).
* Provide concrete guidance to implementers
* Provide guidance to developers evaluating whether to adopt incremental delivery

## Use case guidance:
The goal of incremental delivery is to prioritize the delivery of essential data. Even though incremental delivery delivers data over time, the response describes the data at a particular point in time. Therefore, it is not necessary to reflect real time changes to the data model in incremental delivery. Implementers of @defer and @stream are not obligated to address interleaving mutations during the execution of @defer and @stream. 

GraphQL Subscription is an event-oriented approach to capture real time data changes. It intends to describe interesting events that happen over a period of time and delivers updated value that “invalidate” previous values.

## Implementation details of @stream and @defer

For GraphQL communications built on top of HTTP, a natural and compatible technology to leverage is HTTP chunked encoding to implement a stream of responses for incremental delivery.

## Caveats

### Type Generation
Supporting @defer can add complexity to type-generating clients. Separate types will need to be generated for the different deferred fragments. These clients will need to use the `label` field to determine which fragments have been fulfilled to ensure the application is using the correct types. 

### Object Consistency
The GraphQL spec does not currently support object identification or consistency. It is currently possible for the same object to be returned in multiple places in a query. If that object changes while the resolvers are running, the query could return inconsistent results. `@defer`/`@stream` does not increase the likelihood of this, as the server still attempts to resolve everything as fast as it can. The only difference is some results can be returned to the client sooner. This proposal does not attempt to address this issue.

### Can @defer/@stream increase risk of a denial of service attack?
This is currently a risk in GraphQL servers that do not implement any kind of query limiting as arbitrarily complex queries can be sent. Adding `@defer` may add some overhead as the server will now send parts of the query earlier than it would have without `@defer`, but it does not allow for any additional resolving that was not previously possible.


# Additional material
- [1] [Lee Byron on idea of @defer and @stream](https://www.youtube.com/watch?v=ViXL0YQnioU&feature=youtu.be&t=9m4s)
- [2] [[Proposal] Introducing @defer in Apollo Server](https://blog.apollographql.com/introducing-defer-in-apollo-server-f6797c4e9d6e)
- [3] [Active development on @defer and @stream in Relay at Facebook](https://github.com/graphql/graphql-wg/issues/329)
