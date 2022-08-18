# Execution

A GraphQL service generates a response from a request via execution.

:: A _request_ for execution consists of a few pieces of information:

- The schema to use, typically solely provided by the GraphQL service.
- A {Document} which must contain GraphQL {OperationDefinition} and may contain
  {FragmentDefinition}.
- Optionally: The name of the Operation in the Document to execute.
- Optionally: Values for any Variables defined by the Operation.
- An initial value corresponding to the root type being executed. Conceptually,
  an initial value represents the "universe" of data available via a GraphQL
  Service. It is common for a GraphQL Service to always use the same initial
  value for every request.

Given this information, the result of {ExecuteRequest()} produces the response,
to be formatted according to the Response section below.

Note: GraphQL requests do not require any specific serialization format or
transport mechanism. Message serialization and transport mechanisms should be
chosen by the implementing service.

## Executing Requests

To execute a request, the executor must have a parsed {Document} and a selected
operation name to run if the document defines multiple operations, otherwise the
document is expected to only contain a single operation. The result of the
request is determined by the result of executing this operation according to the
"Executing Operations” section below.

ExecuteRequest(schema, document, operationName, variableValues, initialValue):

Note: the execution assumes implementing language supports coroutines.
Alternatively, the socket can provide a write buffer pointer to allow
{ExecuteRequest()} to directly write payloads into the buffer.

- Let {operation} be the result of {GetOperation(document, operationName)}.
- Let {coercedVariableValues} be the result of {CoerceVariableValues(schema,
  operation, variableValues)}.
- If {operation} is a query operation:
  - Return {ExecuteQuery(operation, schema, coercedVariableValues,
    initialValue)}.
- Otherwise if {operation} is a mutation operation:
  - Return {ExecuteMutation(operation, schema, coercedVariableValues,
    initialValue)}.
- Otherwise if {operation} is a subscription operation:
  - Return {Subscribe(operation, schema, coercedVariableValues, initialValue)}.

GetOperation(document, operationName):

- If {operationName} is {null}:
  - If {document} contains exactly one operation.
    - Return the Operation contained in the {document}.
  - Otherwise raise a _request error_ requiring {operationName}.
- Otherwise:
  - Let {operation} be the Operation named {operationName} in {document}.
  - If {operation} was not found, raise a _request error_.
  - Return {operation}.

### Validating Requests

As explained in the Validation section, only requests which pass all validation
rules should be executed. If validation errors are known, they should be
reported in the list of "errors" in the response and the request must fail
without execution.

Typically validation is performed in the context of a request immediately before
execution, however a GraphQL service may execute a request without immediately
validating it if that exact same request is known to have been validated before.
A GraphQL service should only execute requests which _at some point_ were known
to be free of any validation errors, and have since not changed.

For example: the request may be validated during development, provided it does
not later change, or a service may validate a request once and memoize the
result to avoid validating the same request again in the future.

### Coercing Variable Values

If the operation has defined any variables, then the values for those variables
need to be coerced using the input coercion rules of variable's declared type.
If a _request error_ is encountered during input coercion of variable values,
then the operation fails without execution.

CoerceVariableValues(schema, operation, variableValues):

- Let {coercedValues} be an empty unordered Map.
- Let {variablesDefinition} be the variables defined by {operation}.
- For each {variableDefinition} in {variablesDefinition}:
  - Let {variableName} be the name of {variableDefinition}.
  - Let {variableType} be the expected type of {variableDefinition}.
  - Assert: {IsInputType(variableType)} must be {true}.
  - Let {defaultValue} be the default value for {variableDefinition}.
  - Let {hasValue} be {true} if {variableValues} provides a value for the name
    {variableName}.
  - Let {value} be the value provided in {variableValues} for the name
    {variableName}.
  - If {hasValue} is not {true} and {defaultValue} exists (including {null}):
    - Add an entry to {coercedValues} named {variableName} with the value
      {defaultValue}.
  - Otherwise if {variableType} is a Non-Nullable type, and either {hasValue} is
    not {true} or {value} is {null}, raise a _request error_.
  - Otherwise if {hasValue} is true:
    - If {value} is {null}:
      - Add an entry to {coercedValues} named {variableName} with the value
        {null}.
    - Otherwise:
      - If {value} cannot be coerced according to the input coercion rules of
        {variableType}, raise a _request error_.
      - Let {coercedValue} be the result of coercing {value} according to the
        input coercion rules of {variableType}.
      - Add an entry to {coercedValues} named {variableName} with the value
        {coercedValue}.
- Return {coercedValues}.

Note: This algorithm is very similar to {CoerceArgumentValues()}.

## Executing Operations

The type system, as described in the "Type System" section of the spec, must
provide a query root operation type. If mutations or subscriptions are
supported, it must also provide a mutation or subscription root operation type,
respectively.

### Query

If the operation is a query, the result of the operation is the result of
executing the operation’s top level selection set with the query root operation
type.

An initial value may be provided when executing a query operation.

ExecuteQuery(query, schema, variableValues, initialValue):

- Let {queryType} be the root Query type in {schema}.
- Assert: {queryType} is an Object type.
- Let {selectionSet} be the top level Selection Set in {query}.
- Return {ExecuteRootSelectionSet(variableValues, initialValue, queryType,
  selectionSet)}.

### Mutation

If the operation is a mutation, the result of the operation is the result of
executing the operation’s top level selection set on the mutation root object
type. This selection set should be executed serially.

It is expected that the top level fields in a mutation operation perform
side-effects on the underlying data system. Serial execution of the provided
mutations ensures against race conditions during these side-effects.

ExecuteMutation(mutation, schema, variableValues, initialValue):

- Let {mutationType} be the root Mutation type in {schema}.
- Assert: {mutationType} is an Object type.
- Let {selectionSet} be the top level Selection Set in {mutation}.
- Return {ExecuteRootSelectionSet(variableValues, initialValue, mutationType,
  selectionSet, true)}.

### Subscription

If the operation is a subscription, the result is an event stream called the
"Response Stream" where each event in the event stream is the result of
executing the operation for each new event on an underlying "Source Stream".

Executing a subscription operation creates a persistent function on the service
that maps an underlying Source Stream to a returned Response Stream.

Subscribe(subscription, schema, variableValues, initialValue):

- Let {sourceStream} be the result of running
  {CreateSourceEventStream(subscription, schema, variableValues, initialValue)}.
- Let {responseStream} be the result of running
  {MapSourceToResponseEvent(sourceStream, subscription, schema, variableValues)}
- Return {responseStream}.

Note: In a large-scale subscription system, the {Subscribe()} and
{ExecuteSubscriptionEvent()} algorithms may be run on separate services to
maintain predictable scaling properties. See the section below on Supporting
Subscriptions at Scale.

As an example, consider a chat application. To subscribe to new messages posted
to the chat room, the client sends a request like so:

```graphql example
subscription NewMessages {
  newMessage(roomId: 123) {
    sender
    text
  }
}
```

While the client is subscribed, whenever new messages are posted to chat room
with ID "123", the selection for "sender" and "text" will be evaluated and
published to the client, for example:

```json example
{
  "data": {
    "newMessage": {
      "sender": "Hagrid",
      "text": "You're a wizard!"
    }
  }
}
```

The "new message posted to chat room" could use a "Pub-Sub" system where the
chat room ID is the "topic" and each "publish" contains the sender and text.

**Event Streams**

An event stream represents a sequence of discrete events over time which can be
observed. As an example, a "Pub-Sub" system may produce an event stream when
"subscribing to a topic", with an event occurring on that event stream for each
"publish" to that topic. Event streams may produce an infinite sequence of
events or may complete at any point. Event streams may complete in response to
an error or simply because no more events will occur. An observer may at any
point decide to stop observing an event stream by cancelling it, after which it
must receive no more events from that event stream.

**Supporting Subscriptions at Scale**

Supporting subscriptions is a significant change for any GraphQL service. Query
and mutation operations are stateless, allowing scaling via cloning of GraphQL
service instances. Subscriptions, by contrast, are stateful and require
maintaining the GraphQL document, variables, and other context over the lifetime
of the subscription.

Consider the behavior of your system when state is lost due to the failure of a
single machine in a service. Durability and availability may be improved by
having separate dedicated services for managing subscription state and client
connectivity.

**Delivery Agnostic**

GraphQL subscriptions do not require any specific serialization format or
transport mechanism. GraphQL specifies algorithms for the creation of the
response stream, the content of each payload on that stream, and the closing of
that stream. There are intentionally no specifications for message
acknowledgement, buffering, resend requests, or any other quality of service
(QoS) details. Message serialization, transport mechanisms, and quality of
service details should be chosen by the implementing service.

#### Source Stream

A Source Stream represents the sequence of events, each of which will trigger a
GraphQL execution corresponding to that event. Like field value resolution, the
logic to create a Source Stream is application-specific.

CreateSourceEventStream(subscription, schema, variableValues, initialValue):

- Let {subscriptionType} be the root Subscription type in {schema}.
- Assert: {subscriptionType} is an Object type.
- Let {selectionSet} be the top level Selection Set in {subscription}.
- Let {groupedFieldSet} be the result of {CollectFields(subscriptionType,
  selectionSet, variableValues)}.
- If {groupedFieldSet} does not have exactly one entry, raise a _request error_.
- Let {fields} be the value of the first entry in {groupedFieldSet}.
- Let {fieldName} be the name of the first entry in {fields}. Note: This value
  is unaffected if an alias is used.
- Let {field} be the first entry in {fields}.
- Let {argumentValues} be the result of {CoerceArgumentValues(subscriptionType,
  field, variableValues)}
- Let {fieldStream} be the result of running
  {ResolveFieldEventStream(subscriptionType, initialValue, fieldName,
  argumentValues)}.
- Return {fieldStream}.

ResolveFieldEventStream(subscriptionType, rootValue, fieldName, argumentValues):

- Let {resolver} be the internal function provided by {subscriptionType} for
  determining the resolved event stream of a subscription field named
  {fieldName}.
- Return the result of calling {resolver}, providing {rootValue} and
  {argumentValues}.

Note: This {ResolveFieldEventStream()} algorithm is intentionally similar to
{ResolveFieldValue()} to enable consistency when defining resolvers on any
operation type.

#### Response Stream

Each event in the underlying Source Stream triggers execution of the
subscription selection set using that event as a root value.

MapSourceToResponseEvent(sourceStream, subscription, schema, variableValues):

- Return a new event stream {responseStream} which yields events as follows:
- For each {event} on {sourceStream}:
  - Let {response} be the result of running
    {ExecuteSubscriptionEvent(subscription, schema, variableValues, event)}.
  - Yield an event containing {response}.
- When {responseStream} completes: complete this event stream.

ExecuteSubscriptionEvent(subscription, schema, variableValues, initialValue):

- Let {subscriptionType} be the root Subscription type in {schema}.
- Assert: {subscriptionType} is an Object type.
- Let {selectionSet} be the top level Selection Set in {subscription}.
- Return {ExecuteRootSelectionSet(variableValues, initialValue,
  subscriptionType, selectionSet)}.

Note: The {ExecuteSubscriptionEvent()} algorithm is intentionally similar to
{ExecuteQuery()} since this is how each event result is produced. Incremental
delivery, however, is not supported within {ExecuteSubscriptionEvent()} and will
result in a _field error_.

#### Unsubscribe

Unsubscribe cancels the Response Stream when a client no longer wishes to
receive payloads for a subscription. This may in turn also cancel the Source
Stream. This is also a good opportunity to clean up any other resources used by
the subscription.

Unsubscribe(responseStream):

- Cancel {responseStream}

## Executing the Root Selection Set

To execute the root selection set, the object value being evaluated and the
object type need to be known, as well as whether it must be executed serially,
or may be executed in parallel.

Executing the root selection set works similarly for queries (parallel),
mutations (serial), and subscriptions (where it is executed for each event in
the underlying Source Stream).

First, the selection set is turned into a grouped field set; then, we execute
this grouped field set and return the resulting {data} and {errors}.

If an operation contains `@stream` directives, execution may also result in an
Subsequent Result stream in addition to the initial response. The procedure for
yielding subsequent results is specified by the {YieldSubsequentResults()}
algorithm.

ExecuteRootSelectionSet(variableValues, initialValue, objectType, selectionSet,
serial):

- If {serial} is not provided, initialize it to {false}.
- Let {groupedFieldSet} be the result of {CollectFields(objectType,
  selectionSet, variableValues)}.
- Let {data} and {incrementalDigests} be the result of
  {ExecuteGroupedFieldSet(groupedFieldSet, queryType, initialValue,
  variableValues)} _serially_ if {serial} is {true}, _normally_ (allowing
  parallelization) otherwise.
- Let {errors} be the list of all _field error_ raised while executing the
  {groupedFieldSet}.
- Let {newPendingResults} and {futures} be the results of
  {ProcessIncrementalDigests(incrementalDigests)}.
- Let {ids} and {initialPayload} be the result of
  {GetIncrementalPayload(newPendingResults)}.
- If {ids} is empty, return an empty unordered map consisting of {data} and
  {errors}.
- Set the corresponding entries on {initialPayload} to {data} and {errors}.
- Let {subsequentResults} be the result of {YieldSubsequentResults(ids,
  futures)}.
- Return {initialPayload} and {subsequentResults}.

### Field Collection

Before execution, the selection set is converted to a grouped field set by
calling {CollectFields()}. Each entry in the grouped field set is a list of
fields that share a response key (the alias if defined, otherwise the field
name). This ensures all fields with the same response key (including those in
referenced fragments) are executed at the same time.

As an example, collecting the fields of this selection set would collect two
instances of the field `a` and one of field `b`:

```graphql example
{
  a {
    subfield1
  }
  ...ExampleFragment
}

fragment ExampleFragment on Query {
  a {
    subfield2
  }
  b
}
```

The depth-first-search order of the field groups produced by {CollectFields()}
is maintained through execution, ensuring that fields appear in the executed
response in a stable and predictable order.

CollectFields(objectType, selectionSet, variableValues, visitedFragments):

- If {visitedFragments} is not provided, initialize it to the empty set.
- Initialize {groupedFields} to an empty ordered map of lists.
- For each {selection} in {selectionSet}:
  - If {selection} provides the directive `@skip`, let {skipDirective} be that
    directive.
    - If {skipDirective}'s {if} argument is {true} or is a variable in
      {variableValues} with the value {true}, continue with the next {selection}
      in {selectionSet}.
  - If {selection} provides the directive `@include`, let {includeDirective} be
    that directive.
    - If {includeDirective}'s {if} argument is not {true} and is not a variable
      in {variableValues} with the value {true}, continue with the next
      {selection} in {selectionSet}.
  - If {selection} is a {Field}:
    - Let {responseKey} be the response key of {selection} (the alias if
      defined, otherwise the field name).
    - Let {groupForResponseKey} be the list in {groupedFields} for
      {responseKey}; if no such list exists, create it as an empty list.
    - Append {selection} to the {groupForResponseKey}.
  - If {selection} is a {FragmentSpread}:
    - Let {fragmentSpreadName} be the name of {selection}.
    - If {fragmentSpreadName} is in {visitedFragments}, continue with the next
      {selection} in {selectionSet}.
    - Add {fragmentSpreadName} to {visitedFragments}.
    - Let {fragment} be the Fragment in the current Document whose name is
      {fragmentSpreadName}.
    - If no such {fragment} exists, continue with the next {selection} in
      {selectionSet}.
    - Let {fragmentType} be the type condition on {fragment}.
    - If {DoesFragmentTypeApply(objectType, fragmentType)} is false, continue
      with the next {selection} in {selectionSet}.
    - Let {fragmentSelectionSet} be the top-level selection set of {fragment}.
    - Let {fragmentGroupedFieldSet} be the result of calling
      {CollectFields(objectType, fragmentSelectionSet, variableValues,
      visitedFragments)}.
    - For each {fragmentGroup} in {fragmentGroupedFieldSet}:
      - Let {responseKey} be the response key shared by all fields in
        {fragmentGroup}.
      - Let {groupForResponseKey} be the list in {groupedFields} for
        {responseKey}; if no such list exists, create it as an empty list.
      - Append all items in {fragmentGroup} to {groupForResponseKey}.
  - If {selection} is an {InlineFragment}:
    - Let {fragmentType} be the type condition on {selection}.
    - If {fragmentType} is not {null} and {DoesFragmentTypeApply(objectType,
      fragmentType)} is false, continue with the next {selection} in
      {selectionSet}.
    - Let {fragmentSelectionSet} be the top-level selection set of {selection}.
    - Let {fragmentGroupedFieldSet} be the result of calling
      {CollectFields(objectType, fragmentSelectionSet, variableValues,
      visitedFragments)}.
    - For each {fragmentGroup} in {fragmentGroupedFieldSet}:
      - Let {responseKey} be the response key shared by all fields in
        {fragmentGroup}.
      - Let {groupForResponseKey} be the list in {groupedFields} for
        {responseKey}; if no such list exists, create it as an empty list.
      - Append all items in {fragmentGroup} to {groupForResponseKey}.
- Return {groupedFields}.

DoesFragmentTypeApply(objectType, fragmentType):

- If {fragmentType} is an Object Type:
  - if {objectType} and {fragmentType} are the same type, return {true},
    otherwise return {false}.
- If {fragmentType} is an Interface Type:
  - if {objectType} is an implementation of {fragmentType}, return {true}
    otherwise return {false}.
- If {fragmentType} is a Union:
  - if {objectType} is a possible type of {fragmentType}, return {true}
    otherwise return {false}.

Note: The steps in {CollectFields()} evaluating the `@skip` and `@include`
directives may be applied in either order since they apply commutatively.

### Processing Incremental Digests

An Incremental Digest is a structure containing:

- {newPendingResults}: a list of new pending results to publish.
- {futures}: a list of future executions whose results will complete pending
  results. The results of these future execution may immediately complete the
  pending results, or may incrementally complete the pending results, and
  contain additional Incremental Digests that will immediately or eventually
  complete those results.

ProcessIncrementalDigests(incrementalDigests):

- Let {newPendingResults} and {futures} be lists containing all of the items
  from the corresponding lists within each item of {incrementalDigests}.
- Return {newPendingResults} and {futures}.

### Yielding Subsequent Results

The procedure for yielding subsequent results is specified by the
{YieldSubsequentResults()} algorithm. First, any initiated future executions are
initiated. Then, any completed future executions are processed to determine the
payload to be yielded. Finally, if any pending results remain, the procedure is
repeated recursively.

YieldSubsequentResults(originalIds, newFutures, initiatedFutures):

- Initialize {futures} to a list containing all items in {initiatedFutures}.
- For each {future} in {newFutures}:
  - If {future} has not been initiated, initiate it.
  - Append {future} to {futures}.
- Wait for any future execution contained in {futures} to complete.
- Let {updates}, {newPendingResults}, {newestFutures}, and {remainingFutures} be
  the result of {ProcessCompletedFutures(futures)}.
- Let {ids} and {payload} be the result of
  {GetIncrementalPayload(newPendingResults, originalIds, updates)}.
- Yield {payload}.
- If {hasNext} on {payload} is {false}:
  - Complete this subsequent result stream and return.
- Yield the results of {YieldSubsequentResults(ids, newestFutures,
  remainingFutures)}.

GetIncrementalPayload(newPendingResults, originalIds, updates):

- Let {ids} be a new unordered map containing all of the entries in
  {originalIds}.
- Initialize {pending}, {incremental}, and {completed} to empty lists.
- For each {newPendingResult} in {newPendingResults}:
  - Let {path} and {label} be the corresponding entries on {newPendingResult}.
  - Let {id} be a unique identifier for this {newPendingResult}.
  - Set the entry for {newPendingResult} in {ids} to {id}.
  - Let {pendingEntry} be an unordered map containing {path}, {label}, and {id}.
  - Append {pendingEntry} to {pending}.
- For each {update} of {updates}:
  - Let {completed}, {errors}, and {incremental} be the corresponding entries on
    {update}.
  - For each {completedResult} in {completed}:
    - Let {id} be the entry for {completedResult} on {ids}.
    - If {id} is not defined, continue to the next {completedResult} in
      {completed}.
    - Remove the entry on {ids} for {completedResult}.
    - Let {completedEntry} be an unordered map containing {id}.
    - If {errors} is defined, set the corresponding entry on {completedEntry} to
      {errors}.
    - Append {completedEntry} to {completed}.
  - For each {incrementalResult} in {incremental}:
    - Let {stream} be the corresponding entry on {incrementalResult}.
    - Let {id} be the corresponding entry on {ids} for {stream}.
    - If {id} is not defined, continue to the next {incrementalResult} in
      {incremental}.
    - Let {items} and {errors} be the corresponding entries on
      {incrementalResult}.
    - Let {incrementalEntry} be an unordered map containing {id}, {items}, and
      {errors}.
- Let {hasNext} be {false} if {ids} is empty, otherwise {true}.
- Let {payload} be an unordered map containing {hasNext}.
- If {pending} is not empty:
  - Set the corresponding entry on {payload} to {pending}.
- If {incremental} is not empty:
  - Set the corresponding entry on {payload} to {incremental}.
- If {completed} is not empty:
  - Set the corresponding entry on {payload} to {completed}.
- Return {ids} and {payload}.

### Processing Completed Futures

As future executions are completed, the {ProcessCompletedFutures()} algorithm
describes how the results of these executions impact the incremental state.
Results from completed futures are processed individually, with each result
possibly:

- Completing existing pending results.
- Contributing data for the next payload.
- Containing additional Incremental Digests.

When encountering additional Incremental Digests, {ProcessCompletedFutures()}
calls itself recursively, processing the new Incremental Digests and checking
for any completed futures, as long as the new Incremental Digests do not contain
any new pending results. If they do, first a new payload is yielded, notifying
the client that new pending results have been encountered.

ProcessCompletedFutures(maybeCompletedFutures, updates, pending,
incrementalDigests, remainingFutures):

- If {updates}, {pending}, {incrementalDigests}, or {remainingFutures} are not
  provided, initialize them to empty lists.
- Let {completedFutures} be a list containing all completed futures from
  {maybeCompletedFutures}; append the remaining futures to {remainingFutures}.
- Initialize {supplementalIncrementalDigests} to an empty list.
- For each {completedFuture} in {completedFutures}:
  - Let {result} be the result of {completedFuture}.
  - Let {update} and {resultIncrementalDigests} be the result of calling
    {GetUpdatesForStreamItems(result)}.
  - Append {update} to {updates}.
  - For each {resultIncrementalDigest} in {resultIncrementalDigests}:
    - If {resultIncrementalDigest} contains a {newPendingResults} entry:
      - Append {resultIncrementalDigest} to {incrementalDigests}.
    - Otherwise:
      - Append {resultIncrementalDigest} to {supplementalIncrementalDigests}.
- If {supplementalIncrementalDigests} is empty:
  - Let {newPendingResults} and {futures} be the result of
    {ProcessIncrementalDigests(incrementalDigests)}.
  - Append all items in {newPendingResults} to {pending}.
  - Return {updates}, {pending}, {newFutures}, and {remainingFutures}.
- Let {newPendingResults} and {futures} be the result of
  {ProcessIncrementalDigests(supplementalIncrementalDigests)}.
- Append all items in {newPendingResults} to {pending}.
- Return the result of {ProcessCompletedFutures(futures, updates, pending,
  incrementalDigests, remainingFutures)}.

GetUpdatesForStreamItems(streamItems):

- Let {stream}, {items}, and {errors} be the corresponding entries on
  {streamItems}.
- If {items} is not defined, the stream has asynchronously ended:
  - Let {completed} be a list containing {stream}.
  - Let {update} be an unordered map containing {completed}.
- Otherwise, if {items} is {null}:
  - Let {completed} be a list containing {stream}.
  - Let {errors} be the corresponding entry on {streamItems}.
  - Let {update} be an unordered map containing {completed} and {errors}.
- Otherwise:
  - Let {incremental} be a list containing {streamItems}.
  - Let {update} be an unordered map containing {incremental}.
  - Let {incrementalDigests} be the corresponding entry on {streamItems}.
- Let {updates} be a list containing {update}.
- Return {updates} and {incrementalDigests}.

## Executing a Grouped Field Set

To execute a grouped field set, the object value being evaluated and the object
type need to be known, as well as whether it must be executed serially, or may
be executed in parallel.

Each represented field in the grouped field set produces an entry into a
response map.

ExecuteGroupedFieldSet(groupedFieldSet, objectType, objectValue, variableValues,
path):

- If {path} is not provided, initialize it to an empty list.
- Initialize {resultMap} to an empty ordered map.
- Initialize {incrementalDigests} to an empty list.
- For each {groupedFieldSet} as {responseKey} and {fields}:
  - Let {fieldName} be the name of the first entry in {fields}. Note: This value
    is unaffected if an alias is used.
  - Let {fieldType} be the return type defined for the field {fieldName} of
    {objectType}.
  - If {fieldType} is defined:
    - Let {responseValue} and {fieldIncrementalDigests} be the result of
      {ExecuteField(objectType, objectValue, fieldType, fields, variableValues,
      path)}.
    - Set {responseValue} as the value for {responseKey} in {resultMap}.
    - Append all Incremental Digests in {fieldIncrementalDigests} to
      {incrementalDigests}.
- Return {resultMap} and {incrementalDigests}.

Note: {resultMap} is ordered by which fields appear first in the operation. This
is explained in greater detail in the Field Collection section above.

**Errors and Non-Null Fields**

If during {ExecuteGroupedFieldSet()} a field with a non-null {fieldType} raises
a _field error_ then that error must propagate to this entire selection set,
either resolving to {null} if allowed or further propagated to a parent field.

If this occurs, any sibling fields which have not yet executed or have not yet
yielded a value may be cancelled to avoid unnecessary work.

Additionally, Subsequent Result records must not be yielded if their path points
to a location that has resolved to {null} due to propagation of a field error.
If these subsequent results have not yet executed or have not yet yielded a
value they may also be cancelled to avoid unnecessary work.

For example, assume the field `alwaysThrows` is a list of `Non-Null` type where
completion of the list item always raises a field error:

```graphql example
{
  myObject(initialCount: 1) @stream {
    alwaysThrows
  }
}
```

In this case, only one response should be sent. Subsequent items from the stream
should be ignored and their completion, if initiated, may be cancelled.

```json example
{
  "data": { "myObject": null }
}
```

Note: See [Handling Field Errors](#sec-Handling-Field-Errors) for more about
this behavior.

### Normal and Serial Execution

Normally the executor can execute the entries in a grouped field set in whatever
order it chooses (normally in parallel). Because the resolution of fields other
than top-level mutation fields must always be side effect-free and idempotent,
the execution order must not affect the result, and hence the service has the
freedom to execute the field entries in whatever order it deems optimal.

For example, given the following grouped field set to be executed normally:

```graphql example
{
  birthday {
    month
  }
  address {
    street
  }
}
```

A valid GraphQL executor can resolve the four fields in whatever order it chose
(however of course `birthday` must be resolved before `month`, and `address`
before `street`).

When executing a mutation, the selections in the top most selection set will be
executed in serial order, starting with the first appearing field textually.

When executing a grouped field set serially, the executor must consider each
entry from the grouped field set in the order provided in the grouped field set.
It must determine the corresponding entry in the result map for each item to
completion before it continues on to the next item in the grouped field set:

For example, given the following selection set to be executed serially:

```graphql example
{
  changeBirthday(birthday: $newBirthday) {
    month
  }
  changeAddress(address: $newAddress) {
    street
  }
}
```

The executor must, in serial:

- Run {ExecuteField()} for `changeBirthday`, which during {CompleteValue()} will
  execute the `{ month }` sub-selection set normally.
- Run {ExecuteField()} for `changeAddress`, which during {CompleteValue()} will
  execute the `{ street }` sub-selection set normally.

As an illustrative example, let's assume we have a mutation field
`changeTheNumber` that returns an object containing one field, `theNumber`. If
we execute the following selection set serially:

```graphql example
{
  first: changeTheNumber(newNumber: 1) {
    theNumber
  }
  second: changeTheNumber(newNumber: 3) {
    theNumber
  }
  third: changeTheNumber(newNumber: 2) {
    theNumber
  }
}
```

The executor will execute the following serially:

- Resolve the `changeTheNumber(newNumber: 1)` field
- Execute the `{ theNumber }` sub-selection set of `first` normally
- Resolve the `changeTheNumber(newNumber: 3)` field
- Execute the `{ theNumber }` sub-selection set of `second` normally
- Resolve the `changeTheNumber(newNumber: 2)` field
- Execute the `{ theNumber }` sub-selection set of `third` normally

A correct executor must generate the following result for that selection set:

```json example
{
  "first": {
    "theNumber": 1
  },
  "second": {
    "theNumber": 3
  },
  "third": {
    "theNumber": 2
  }
}
```

When subsections contain a `@stream` directive, these subsections are no longer
required to execute serially. Execution of the streamed sections of the
subsection may be executed in parallel, as defined in {ExecuteStreamField}.

## Executing Fields

Each field requested in the grouped field set that is defined on the selected
objectType will result in an entry in the response map. Field execution first
coerces any provided argument values, then resolves a value for the field, and
finally completes that value either by recursively executing another selection
set or coercing a scalar value.

ExecuteField(objectType, objectValue, fieldType, fields, variableValues, path):

- Let {field} be the first entry in {fields}.
- Let {fieldName} be the field name of {field}.
- Append {fieldName} to {path}.
- Let {argumentValues} be the result of {CoerceArgumentValues(objectType, field,
  variableValues)}
- Let {resolvedValue} be {ResolveFieldValue(objectType, objectValue, fieldName,
  argumentValues)}.
- Return the result of {CompleteValue(fieldType, fields, resolvedValue,
  variableValues, path)}.

### Coercing Field Arguments

Fields may include arguments which are provided to the underlying runtime in
order to correctly produce a value. These arguments are defined by the field in
the type system to have a specific input type.

At each argument position in an operation may be a literal {Value}, or a
{Variable} to be provided at runtime.

CoerceArgumentValues(objectType, field, variableValues):

- Let {coercedValues} be an empty unordered Map.
- Let {argumentValues} be the argument values provided in {field}.
- Let {fieldName} be the name of {field}.
- Let {argumentDefinitions} be the arguments defined by {objectType} for the
  field named {fieldName}.
- For each {argumentDefinition} in {argumentDefinitions}:
  - Let {argumentName} be the name of {argumentDefinition}.
  - Let {argumentType} be the expected type of {argumentDefinition}.
  - Let {defaultValue} be the default value for {argumentDefinition}.
  - Let {hasValue} be {true} if {argumentValues} provides a value for the name
    {argumentName}.
  - Let {argumentValue} be the value provided in {argumentValues} for the name
    {argumentName}.
  - If {argumentValue} is a {Variable}:
    - Let {variableName} be the name of {argumentValue}.
    - Let {hasValue} be {true} if {variableValues} provides a value for the name
      {variableName}.
    - Let {value} be the value provided in {variableValues} for the name
      {variableName}.
  - Otherwise, let {value} be {argumentValue}.
  - If {hasValue} is not {true} and {defaultValue} exists (including {null}):
    - Add an entry to {coercedValues} named {argumentName} with the value
      {defaultValue}.
  - Otherwise if {argumentType} is a Non-Nullable type, and either {hasValue} is
    not {true} or {value} is {null}, raise a _field error_.
  - Otherwise if {hasValue} is true:
    - If {value} is {null}:
      - Add an entry to {coercedValues} named {argumentName} with the value
        {null}.
    - Otherwise, if {argumentValue} is a {Variable}:
      - Add an entry to {coercedValues} named {argumentName} with the value
        {value}.
    - Otherwise:
      - If {value} cannot be coerced according to the input coercion rules of
        {argumentType}, raise a _field error_.
      - Let {coercedValue} be the result of coercing {value} according to the
        input coercion rules of {argumentType}.
      - Add an entry to {coercedValues} named {argumentName} with the value
        {coercedValue}.
- Return {coercedValues}.

Note: Variable values are not coerced because they are expected to be coerced
before executing the operation in {CoerceVariableValues()}, and valid operations
must only allow usage of variables of appropriate types.

### Value Resolution

While nearly all of GraphQL execution can be described generically, ultimately
the internal system exposing the GraphQL interface must provide values. This is
exposed via {ResolveFieldValue}, which produces a value for a given field on a
type for a real value.

As an example, this might accept the {objectType} `Person`, the {field}
{"soulMate"}, and the {objectValue} representing John Lennon. It would be
expected to yield the value representing Yoko Ono.

List values are resolved similarly. For example, {ResolveFieldValue} might also
accept the {objectType} `MusicBand`, the {field} {"members"}, and the
{objectValue} representing the Beatles. It would be expected to yield a
collection of values representing John Lennon, Paul McCartney, Ringo Starr and
George Harrison.

ResolveFieldValue(objectType, objectValue, fieldName, argumentValues):

- Let {resolver} be the internal function provided by {objectType} for
  determining the resolved value of a field named {fieldName}.
- Return the result of calling {resolver}, providing {objectValue} and
  {argumentValues}.

Note: It is common for {resolver} to be asynchronous due to relying on reading
an underlying database or networked service to produce a value. This
necessitates the rest of a GraphQL executor to handle an asynchronous execution
flow. In addition, an implementation for collections may leverage asynchronous
iterators or asynchronous generators provided by many programming languages.
This may be particularly helpful when used in conjunction with the `@stream`
directive.

### Value Completion

After resolving the value for a field, it is completed by ensuring it adheres to
the expected return type. If the return type is another Object type, then the
field execution process continues recursively. If the return type is a List
type, each member of the resolved collection is completed using the same value
completion process. In the case where `@stream` is specified on a field of list
type, value completion iterates over the collection until the number of items
yielded items satisfies `initialCount` specified on the `@stream` directive.

CompleteValue(fieldType, fields, result, variableValues, path):

- If the {fieldType} is a Non-Null type:
  - Let {innerType} be the inner type of {fieldType}.
  - Let {completedResult} and {incrementalDigests} be the result of calling
    {CompleteValue(innerType, fields, result, variableValues, path)}.
  - If {completedResult} is {null}, raise a _field error_.
  - Return {completedResult} and {incrementalDigests}.
- If {result} is {null} (or another internal value similar to {null} such as
  {undefined}), return {null}.
- If {fieldType} is a List type:
  - Initialize {incrementalDigests} to an empty list.
  - If {result} is not a collection of values, raise a _field error_.
  - Let {field} be the first entry in {fields}.
  - Let {innerType} be the inner type of {fieldType}.
  - If {field} provides the directive `@stream` and its {if} argument is not
    {false} and is not a variable in {variableValues} with the value {false} and
    {innerType} is the outermost return type of the list type defined for
    {field}:
    - Let {streamDirective} be that directive.
    - If this execution is for a subscription operation, raise a _field error_.
    - Let {initialCount} be the value or variable provided to
      {streamDirective}'s {initialCount} argument.
    - If {initialCount} is less than zero, raise a _field error_.
    - Let {label} be the value or variable provided to {streamDirective}'s
      {label} argument.
  - Let {iterator} be an iterator for {result}.
  - Let {items} be an empty list.
  - Let {index} be zero.
  - While {result} is not closed:
    - If {streamDirective} is defined and {index} is greater than or equal to
      {initialCount}:
      - Let {stream} be an unordered map containing {path} and {label}.
      - Let {future} represent the future execution of
        {ExecuteStreamField(stream, iterator, streamFieldDetailsList, index,
        innerType, variableValues)}.
      - If early execution of streamed fields is desired:
        - Following any implementation specific deferral of further execution,
          initiate {future}.
      - Let {incrementalDigest} be a new Incremental Digest created from
        {stream} and {future}.
      - Append {incrementalDigest} to {incrementalDigests}.
      - Return {items} and {incrementalDigests}.
    - Otherwise:
      - Wait for the next item from {result} via the {iterator}.
      - If an item is not retrieved because of an error, raise a _field error_.
      - Let {item} be the item retrieved from {result}.
      - Let {itemPath} be {path} with {index} appended.
      - Let {completedItem} and {itemIncrementalDigests} be the result of
        calling {CompleteValue(innerType, fields, item, variableValues,
        itemPath)}.
      - Append {completedItem} to {items}.
      - Append all Incremental Digests in {itemIncrementalDigests} to
        {incrementalDigests}.
  - Return {items} and {incrementalDigests}.
- If {fieldType} is a Scalar or Enum type:
  - Return the result of {CoerceResult(fieldType, result)}.
- If {fieldType} is an Object, Interface, or Union type:
  - If {fieldType} is an Object type.
    - Let {objectType} be {fieldType}.
  - Otherwise if {fieldType} is an Interface or Union type.
    - Let {objectType} be {ResolveAbstractType(fieldType, result)}.
  - Let {groupedFieldSet} be the result of calling {CollectSubfields(objectType,
    fields, variableValues)}.
  - Return the result of evaluating {ExecuteGroupedFieldSet(groupedFieldSet,
    objectType, result, variableValues)} _normally_ (allowing for
    parallelization).

#### Execute Stream Field

ExecuteStreamField(stream, iterator, fields, index, innerType, variableValues):

- Let {path} be the corresponding entry on {stream}.
- Let {itemPath} be {path} with {index} appended.
- Wait for the next item from {iterator}.
- If {iterator} is closed, return.
- Let {item} be the next item retrieved via {iterator}.
- Let {nextIndex} be {index} plus one.
- Let {completedItem} and {itemIncrementalDigests} be the result of
  {CompleteValue(innerType, fields, item, variableValues, itemPath)}.
- Initialize {items} to an empty list.
- Append {completedItem} to {items}.
- Let {errors} be the list of all _field error_ raised while completing the
  item.
- Let {future} represent the future execution of {ExecuteStreamField(stream,
  path, iterator, fields, nextIndex, innerType, variableValues)}.
- If early execution of streamed fields is desired:
  - Following any implementation specific deferral of further execution,
    initiate {future}.
- Let {incrementalDigest} be a new Incremental Digest created from {future}.
- Initialize {incrementalDigests} to a list containing {incrementalDigest}.
- Append all Incremental Digests in {itemIncrementalDigests} to
  {incrementalDigests}.
- Let {streamedItems} be an unordered map containing {stream}, {items} {errors},
  and {incrementalDigests}.
- Return {streamedItem}.

**Coercing Results**

The primary purpose of value completion is to ensure that the values returned by
field resolvers are valid according to the GraphQL type system and a service's
schema. This "dynamic type checking" allows GraphQL to provide consistent
guarantees about returned types atop any service's internal runtime.

See the Scalars
[Result Coercion and Serialization](#sec-Scalars.Result-Coercion-and-Serialization)
sub-section for more detailed information about how GraphQL's built-in scalars
coerce result values.

CoerceResult(leafType, value):

- Assert {value} is not {null}.
- Return the result of calling the internal method provided by the type system
  for determining the "result coercion" of {leafType} given the value {value}.
  This internal method must return a valid value for the type and not {null}.
  Otherwise raise a _field error_.

Note: If a field resolver returns {null} then it is handled within
{CompleteValue()} before {CoerceResult()} is called. Therefore both the input
and output of {CoerceResult()} must not be {null}.

**Resolving Abstract Types**

When completing a field with an abstract return type, that is an Interface or
Union return type, first the abstract type must be resolved to a relevant Object
type. This determination is made by the internal system using whatever means
appropriate.

Note: A common method of determining the Object type for an {objectValue} in
object-oriented environments, such as Java or C#, is to use the class name of
the {objectValue}.

ResolveAbstractType(abstractType, objectValue):

- Return the result of calling the internal method provided by the type system
  for determining the Object type of {abstractType} given the value
  {objectValue}.

**Merging Selection Sets**

When more than one field of the same name is executed in parallel, during value
completion their selection sets are collected together to produce a single
grouped field set in order to continue execution of the sub-selection sets.

An example operation illustrating parallel fields with the same name with
sub-selections.

```graphql example
{
  me {
    firstName
  }
  me {
    lastName
  }
}
```

After resolving the value for `me`, the selection sets are merged together so
`firstName` and `lastName` can be resolved for one value.

CollectSubfields(objectType, fields, variableValues):

- Let {groupedFieldSet} be an empty map.
- For each {field} in {fields}:
  - Let {fieldSelectionSet} be the selection set of {field}.
  - If {fieldSelectionSet} is null or empty, continue to the next field.
  - Let {subGroupedFieldSet} be the result of {CollectFields(objectType,
    fieldSelectionSet, variableValues)}.
  - For each {subGroupedFieldSet} as {responseKey} and {subfields}:
    - Let {groupForResponseKey} be the list in {groupedFieldSet} for
      {responseKey}; if no such list exists, create it as an empty list.
    - Append all fields in {subfields} to {groupForResponseKey}.
- Return {groupedFieldSet}.

### Handling Field Errors

A _field error_ is an error raised from a particular field during value
resolution or coercion. While these errors should be reported in the response,
they are "handled" by producing a partial response.

Note: This is distinct from a _request error_ which results in a response with
no data.

If a field error is raised while resolving a field, it is handled as though the
field returned {null}, and the error must be added to the {"errors"} list in the
response.

If the result of resolving a field is {null} (either because the function to
resolve the field returned {null} or because a field error was raised), and that
field is of a `Non-Null` type, then a field error is raised. The error must be
added to the {"errors"} list in the response.

If the field returns {null} because of a field error which has already been
added to the {"errors"} list in the response, the {"errors"} list must not be
further affected. That is, only one error should be added to the errors list per
field.

Since `Non-Null` type fields cannot be {null}, field errors are propagated to be
handled by the parent field. If the parent field may be {null} then it resolves
to {null}, otherwise if it is a `Non-Null` type, the field error is further
propagated to its parent field.

If a `List` type wraps a `Non-Null` type, and one of the elements of that list
resolves to {null}, then the entire list must resolve to {null}. If the `List`
type is also wrapped in a `Non-Null`, the field error continues to propagate
upwards.

When a field error is raised inside `ExecuteStreamField`, the stream payloads
act as error boundaries. That is, the null resulting from a `Non-Null` type
cannot propagate outside of the boundary of the stream payload.

If the `stream` directive is present on a list field with a Non-Nullable inner
type, and a field error has caused a {null} to propagate to the list item, the
{null} similarly should not be sent to the client, as this will overwrite
existing data. In this case, the associated Stream's `completed` entry must
include the causative errors, whose presence indicated the failure of the stream
to complete successfully. For example, assume the `films` field is a `List` type
with an `Non-Null` inner type. In this case, the second list item raises a field
error:

```graphql example
{
  films @stream(initialCount: 1)
}
```

Response 1, the initial response is sent:

```json example
{
  "data": { "films": ["A New Hope"] },
  "pending": [{ "path": ["films"] }],
  "hasNext": true
}
```

Response 2, the stream is completed with errors. Incremental data cannot be
sent, as this would overwrite previously sent values.

```json example
{
  "completed": [
    {
      "path": ["films"],
      "errors": [...],
    }
  ],
  "hasNext": false
}
```

In this alternative example, assume the `films` field is a `List` type without a
`Non-Null` inner type. In this case, the second list item also raises a field
error:

```graphql example
{
  films @stream(initialCount: 1)
}
```

Response 1, the initial response is sent:

```json example
{
  "data": { "films": ["A New Hope"] },
  "hasNext": true
}
```

Response 2, the first stream payload is sent; the stream is not completed. The
{items} entry has been set to a list containing {null}, as this {null} has only
propagated as high as the list item.

```json example
{
  "incremental": [
    {
      "path": ["films", 1],
      "items": [null],
      "errors": [...],
    }
  ],
  "hasNext": true
}
```

If all fields from the root of the request to the source of the field error
return `Non-Null` types, then the {"data"} entry in the response should be
{null}.
