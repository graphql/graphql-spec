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
- Return {ExecuteRootSelectionSet(variableValues, initialValue, queryType,
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

Query and mutation operations are stateless, allowing scaling via cloning of
GraphQL service instances. Subscriptions, by contrast, are stateful and require
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
- Let {fieldsByTarget} be the result of calling
  {AnalyzeSelectionSet(subscriptionType, selectionSet, variableValues)}.
- Let {groupedFieldSet} be the first entry in {fieldsByTarget}.
- If {groupedFieldSet} does not have exactly one entry, raise a _request error_.
- Let {fieldGroup} be the value of the first entry in {groupedFieldSet}.
- Let {fieldDetails} be the first entry in {fieldGroup}.
- Let {node} be the corresponding entry on {fieldDetails}.
- Let {fieldName} be the name of {node}. Note: This value is unaffected if an
  alias is used.
- Let {argumentValues} be the result of {CoerceArgumentValues(subscriptionType,
  node, variableValues)}
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
- Let {fieldsByTarget} be the result of calling
  {AnalyzeSelectionSet(subscriptionType, selectionSet, variableValues)}.
- Let {groupedFieldSet} be the first entry in {fieldsByTarget}.
- Let {data} be the result of running {ExecuteGroupedFieldSet(groupedFieldSet,
  subscriptionType, initialValue, variableValues)} _normally_ (allowing
  parallelization).
- Let {errors} be the list of all _field error_ raised while executing the
  {groupedFieldSet}.
- Return an unordered map containing {data} and {errors}.

Note: The {ExecuteSubscriptionEvent()} algorithm is intentionally similar to
{ExecuteQuery()} since this is how each event result is produced. Incremental
delivery, however, is not supported within ExecuteSubscriptionEvent.

#### Unsubscribe

Unsubscribe cancels the Response Stream when a client no longer wishes to
receive payloads for a subscription. This may in turn also cancel the Source
Stream. This is also a good opportunity to clean up any other resources used by
the subscription.

Unsubscribe(responseStream):

- Cancel {responseStream}

## Incremental Delivery

If an operation contains `@defer` or `@stream` directives, execution may also
result in an Subsequent Result stream in addition to the initial response. The
procedure for yielding subsequent results is specified by the
{YieldSubsequentPayloads()} algorithm.

## Executing the Root Selection Set

To execute the root selection set, the object value being evaluated and the
object type need to be known, as well as whether it must be executed serially,
or may be executed in parallel.

Executing the root selection set works similarly for queries (parallel),
mutations (serial), and subscriptions (where it is executed for each event in
the underlying Source Stream).

First, the selection set is turned into a grouped field set; then, we execute
this grouped field set and return the resulting {data} and {errors}.

ExecuteRootSelectionSet(variableValues, initialValue, objectType, selectionSet,
serial):

- Let {fieldsByTarget}, {targetsByKey}, and {newDeferUsages} be the result of
  calling {AnalyzeSelectionSet(objectType, selectionSet, variableValues)}.
- Let {groupedFieldSet} and {groupDetailsMap} be the result of calling
  {BuildGroupedFieldSets(fieldsByTarget, targetsByKey)}.
- Let {newDeferMap} and {newIncrementalResults} be the result of
  {GetNewDeferredFragments(newDeferUsages)}.
- Let {detailsList} be the result of
  {GetDeferredGroupedFieldSetDetails(groupDetailsMap, newDeferMap)}.
- Let {data}, {nestedNewIncrementalResults}, {nestedForDeferredFragments}, and
  {nestedFutures} be the result of running
  {ExecuteGroupedFieldSet(groupedFieldSet, queryType, initialValue,
  variableValues)} _serially_ if {serial} is {true}, _normally_ (allowing
  parallelization) otherwise.
- In parallel, let {futures} and {forDeferredFragments} be the result of
  {ExecuteDeferredGroupedFieldSets(queryType, initialValues, variableValues,
  detailsList, newDeferMap)}.
- Append all members of {nestedNewIncrementalResults} to
  {newIncrementalResults}.
- Append all members of {nestedForDeferredFragments} to {forDeferredFragments}.
- Append all members of {nestedFutures} to {futures}.
- Let {pendingMap} and {pending} be the result of
  {GetPending(newIncrementalResults, forDeferredFragments)}.
- Let {errors} be the list of all _field error_ raised while executing the
  {groupedFieldSet}.
- Initialize {initialResult} to an empty unordered map.
- If {errors} is not empty:
  - Set the corresponding entry on {initialResult} to {errors}.
- Set {data} on {initialResult} to {data}.
- If {pending} is empty, return {initialResult}.
- Let {hasNext} be {true}.
- Set the corresponding entries on {initialResult} to {pending} and {hasNext}.
- Let {subsequentResults} be the result of {YieldSubsequentPayloads(pendingMap,
  futures)}.
- Return {initialResult} and {subsequentResults}.

GetNewDeferredFragments(newDeferUsages, deferMap, path):

- Initialize {newDeferredFragments} to an empty list.
- If {newDeferUsages} is empty:
  - Let {newDeferMap} be {deferMap}.
- Otherwise:
  - Let {newDeferMap} be a new empty unordered map of Defer Usage records to
    Deferred Fragment records.
  - If {deferMap} is defined:
    - For each {deferUsage} and {deferredFragment} in {deferMap}.
      - Set the entry for {deferUsage} in {newDeferMap} to {deferredFragment}.
  - For each {deferUsage} in {newDeferUsages}:
    - Let {label} be the corresponding entry on {deferUsage}.
    - Let {newDeferredFragment} be an unordered map containing {label} and
      {path}.
    - Set the entry for {deferUsage} in {newDeferMap} to {newDeferredFragment}.
    - Append {newDeferredFragment} to {newIncrementalResults}.
- Return {newDeferMap} and {newDeferredFragments}.

GetDeferredGroupedFieldSetDetails(groupDetailsMap, deferMap, path):

- Initialize {detailsList} to an empty list.
- For each {deferUsageSet} and {details} in {groupDetailsMap}:
  - Let {groupedFieldSet} and {shouldInitiateDefer} be the corresponding entries
    on {details}.
  - Let {deferredFragments} be an empty list.
  - For each {deferUsage} in {deferUsageSet}:
    - Let {deferredFragment} be the entry for {deferUsage} in {deferMap}.
    - Append {deferredFragment} to {deferredFragments}.
  - Let {deferredGroupedFieldSetDetails} be an unordered map containing {path},
    {deferredFragments}, {groupedFieldSet}, and {shouldInitiateDefer}.
  - Append {deferredGroupedFieldSetDetails} to {detailsList}.
- Return {detailsList}.

GetPending(newIncrementalResults, forDeferredFragments, oldPendingMap):

- Initialize {newPendingMap} to an empty unordered map.
- If {oldPendingMap} is defined:
  - For each {incrementalResult} and {pendingInfo} of {oldPendingMap}:
    - Let {id} and {count} be the corresponding entries on {oldPendingInfo}.
    - Let {pendingInfo} be a new unordered map consisting of {id} and {count}.
    - Set the entry for {incrementalResult} in {newPendingMap} to {pendingInfo}.
- Initialize {pending} to an empty list.
- For each {newIncrementalResult} in {newIncrementalResults}:
  - Let {id} be a unique identifier for this execution.
  - If {newIncrementalResult} is a deferred fragment:
    - Let {count} be {0}.
    - Let {pendingInfo} be an unordered map consisting of {id} and {count}.
  - Otherwise:
    - Let {pendingInfo} be an unordered map consisting of {id}.
    - Let {path} and {label} be the corresponding entries on
      {newIncrementalResult}.
    - Let {pendingResult} be an unordered map containing {path}, {label}, and
      {id}.
    - Append {pendingResult} to {pending}.
  - Set the entry for {newIncrementalResult} in {newPendingMap} to {info}.
- For each {deferredFragment} in {forDeferredFragments}:
  - Let {pendingInfo} be the entry in {newPendingMap} for {deferredFragment}.
  - Let {count} be the corresponding entry on {pendingInfo}.
  - Increment {count}.
- For each {newIncrementalResult} in {newIncrementalResults}:
  - If {newIncrementalResult} is a deferred fragment:
    - Let {pendingInfo} be the entry in {newPendingMap} for
      {newIncrementalResult}.
    - Let {id} and {count} be the corresponding entries on {pendingInfo}.
    - If {count} is greater than {0}:
      - Let {path} and {label} be the corresponding entries on
        {newIncrementalResult}.
      - Let {pendingResult} be an unordered map containing {path}, {label}, and
        {id}.
      - Append {pendingResult} to {pending}.
    - Otherwise, remove the entry for {newIncrementalResult} on {newPendingMap}.
- Return {newPendingMap} and {pending}.

YieldSubsequentPayloads(oldPendingMap, maybeUninitiatedFutures, futures,
unsent):

- If {futures} is not defined, initialize it to the empty set.
- If {unsent} is not defined, initialize it to the empty set.
- For each {maybeUninitiatedFuture} in {maybeUninitiatedFutures}:
  - If {maybeUninitiatedFuture} has not been initiated, initiate it.
  - Add {maybeUninitiatedFuture} to {futures}.
- Wait for any future execution contained within {futures} to complete.
- Let {currentPendingMap} be {oldPendingMap}.
- Initialize {incrementalResults}, {completedResults},
  {currentNewIncrementalResults}, {currentForIncrementalResults}, and
  {currentFutures} to empty lists.
- For each {future} in {futures}:
  - If {future} has completed:
    - Remove {future} from {futures}.
    - Let {result} be the result of {future}.
    - If {result} represents the result of completion of stream items:
      - Let {currentPendingMap}, {incrementalResults}, {completedResults},
        {currentNewIncrementalResults}, {currentForIncrementalResults}, and
        {currentFutures} be the result of
        {UpdateIncrementalStateForStreamItems(result, currentPendingMap,
        incrementalResults, completedResults, currentNewIncrementalResults,
        currentForIncrementalResults, and currentFutures)}.
    - Otherwise, {result} represents the result of execution of a deferred
      grouped field set:
      - Let {currentPendingMap}, {incrementalResults}, {completedResults},
        {currentNewIncrementalResults}, {currentForIncrementalResults}, and
        {currentFutures} be the result of
        {UpdateIncrementalStateForDeferredGroupedFieldSet(result,
        currentPendingMap, incrementalResults, completedResults,
        currentNewIncrementalResults, currentForIncrementalResults, and
        currentFutures)}.
- If {completedResults} is empty:
  - Yield the results of {YieldSubsequentPayloads(currentPendingMap,
    currentFutures, futures, unsent)}.
- Otherwise:
  - Let {nextPendingMap} and {pending} be the result of {GetPending(
    newIncrementalResults, forDeferredFragments, currentPendingMap)}.
  - If {nextPendingMap} is empty, let {hasNext} be {false}; otherwise, let it be
    {true}.
  - Let {current} be an unordered map consisting of {completedResults} and
    {hasNext}.
  - If {pending} is not empty:
    - Set the entry for {pending} on {current} to {incrementalResults}.
  - If {incrementalResults} is not empty:
    - Set the entry for {incremental} on {current} to {incrementalResults}.
  - Yield {current}.
  - Yield the results of {YieldSubsequentPayloads(currentPendingMap,
    currentFutures, futures, unsent)}.

UpdateIncrementalStateForStreamItems(streamItems, pendingMap,
incrementalResults, completedResults, newIncrementalResults,
forIncrementalResults, futures):

- Let {nextPendingMap} be an empty unordered map.
- For each {incrementalResult} and {pendingInfo} in {pendingMap}:
  - Let {id}, {count}, and {completed} be the corresponding entries on
    {pendingInfo}.
  - Let {pendingInfo} be a new unordered map consisting of {id}, {count}, and
    {completed}, if defined.
  - Set the entry for {incrementalResult} in {nextPendingMap} to {pendingInfo}.
- Let {nextIncrementalResults}, {nextCompletedResults},
  {nextNewIncrementalResults}, {nextForIncrementalResults}, and {nextFutures} be
  new lists containing all of the members of {incrementalResults},
  {completedResults}, {newIncrementalResults}, {forIncrementalResults}, and
  {futures}, respectively.
- Let {stream}, {completedItems}, {errors}, {newIncrementalResults},
  {forIncrementalResults}, and {futures} be the corresponding entries on
  {streamItems}.
- If {completedItems} is not defined:
  - Let {pendingInfo} be the corresponding entry on {nextPendingMap} for
    {stream}.
  - Remove the entry for {stream} on {nextPendingMap}.
  - Let {id} be the corresponding entry on {pendingInfo}.
  - Let {completedResult} be an unordered map consisting of {id}.
  - Append {completedResult} to {nextCompletedResults}.
- If {completedItems} is {null}:
  - Let {pendingInfo} be the corresponding entry on {nextPendingMap} for
    {stream}.
  - Remove the entry for {stream} on {nextPendingMap}.
  - Let {id} be the corresponding entry on {pendingInfo}.
  - Let {completedResult} be an unordered map consisting of {id} and {errors}.
  - Append {completedResult} to {nextCompletedResults}.
- Otherwise:
  - Append all members of {newIncrementalResults} to
    {nextNewIncrementalResults}.
  - Append all members of {forIncrementalResults} to
    {nextForIncrementalResults}.
  - Append all members of {futures} to {nextFutures}.
  - Let {incrementalResult} be an unordered map consisting of {data}.
  - If {errors} is not empty, set the corresponding entry on {incrementalResult}
    to {errors}.
  - Append {incrementalResult} to {nextIncrementalResults}.
- Return {nextPendingMap}, {nextIncrementalResults}, {nextCompletedResults},
  {nextNewIncrementalResults}, {nextForIncrementalResults}, and {nextFutures}.

UpdateIncrementalStateForDeferredGroupedFieldSet(deferredGroupedFieldSet,
pendingMap, incrementalResults, completedResults, newIncrementalResults,
forIncrementalResults, futures):

- Let {nextPendingMap} be an empty unordered map.
- For each {incrementalResult} and {pendingInfo} in {pendingMap}:
  - Let {id}, {count}, and {completed} be the corresponding entries on
    {pendingInfo}.
  - Let {pendingInfo} be a new unordered map consisting of {id}, {count}, and
    {completed}, if defined.
  - Set the entry for {incrementalResult} in {nextPendingMap} to {pendingInfo}.
- Let {nextIncrementalResults}, {nextCompletedResults},
  {nextNewIncrementalResults}, {nextForIncrementalResults}, and {nextFutures} be
  new lists containing all of the members of {incrementalResults},
  {completedResults}, {newIncrementalResults}, {forIncrementalResults}, and
  {futures}, respectively.
- Let {deferredFragments}, {data}, and {errors} be the corresponding entries on
  {deferredGroupedFieldSet}.
- If {data} is {null}:
  - For each {deferredFragment} of {deferredFragments}:
    - Let {pendingInfo} be the corresponding entry on {nextPendingMap} for
      {deferredFragment}.
    - Remove the entry for {deferredFragment} on {nextPendingMap}.
    - Let {id} be the corresponding entry on {pendingInfo}.
    - Let {completedResult} be an unordered map consisting of {id} and {errors}.
    - Append {completedResult} to {completedResults}.
- Otherwise:
  - For each {deferredFragment} of {deferredFragments}:
    - Let {pendingInfo} be the corresponding entry on {nextPendingMap} for
      {deferredFragment}.
    - Let {id}, {count}, and {completed} be the corresponding entries on
      {pendingInfo}.
    - Decrement {count}.
    - If {completed} is not defined:
      - Initialize {completed} to an empty list.
      - Set the corresponding entry on {pendingInfo} to {completed}.
    - Append {result} to {completed}.
    - Add {result} to {unsent}.
    - If {count} is equal to {0}:
      - Let {completedResult} be an unordered map consisting of {id}.
      - Append {completedResult} to {completedResults}.
      - For each {deferredGroupedFieldSet} in {completed}:
        - If {unsent} contains {deferredGroupedFieldSet}:
          - Remove {deferredGroupedFieldSet} from {unsent}.
          - Let {data}, {errors}, {newIncrementalResults},
            {forIncrementalResults}, and {futures} be the corresponding entries
            on {deferredGroupedFieldSet}.
          - Append all members of {newIncrementalResults} to
            {nextNewIncrementalResults}.
          - Append all members of {forIncrementalResults} to
            {nextForIncrementalResults}.
          - Append all members of {futures} to {nextFutures}.
          - Let {idForDeferredGroupedFieldSet} and {subPath} be the results of
            {GetIdAndSubPath(deferredGroupedFieldSet)}.
          - Let {incrementalResult} be an unordered map consisting of {data}.
          - Set the entry for {id} on {incrementalResult} to
            {idForDeferredGroupedFieldSet}.
          - If {subPath} is defined, set the corresponding entry on
            {incrementalResult} to {subPath}.
          - If {errors} is not empty, set the corresponding entry on
            {incrementalResult} to {errors}.
          - Append {incrementalResult} to {nextIncrementalResults}.
- Return {nextPendingMap}, {nextIncrementalResults}, {nextCompletedResults},
  {nextNewIncrementalResults}, {nextForIncrementalResults}, and {nextFutures}.

GetIdAndSubPath(deferredGroupedFieldSet):

- Let {deferredFragments} be the corresponding entry on
  {deferredGroupedFieldSet}.
- Let {firstDeferredFragment} be the first member of {deferredFragments}.
- Let {currentId} and {currentPath} be the entries for {id} and {path} on
  {firstDeferredFragment}, respectively.
- Let {currentPathLength} be the length of {firstPath}.
- For each remaining {deferredFragment} within {deferredFragments}.
  - Let {fragmentPath} be the corresponding entry on {deferredFragment}.
  - Let {fragmentPathLength} be the length of {path}.
  - If {fragmentPathLength} is larger than {currentPathLength}:
    - Set {currentPathLength} to {pathLength}.
    - Set {currentId} to the entry for {id} on {deferredFragment}.
- Let {deferredGroupedFieldSetPath} be the entry for {path} on
  {deferredGroupedFieldSet}.
- Let {subPath} be the subset of {path}, omitting the first {currentPathLength}
  entries.
- Return {currentId} and {subPath}.

## Executing a Grouped Field Set

To execute a grouped field set, the object value being evaluated and the object
type need to be known, as well as whether it must be executed serially, or may
be executed in parallel.

ExecuteGroupedFieldSet(groupedFieldSet, objectType, objectValue, variableValues,
path, deferMap):

- If {path} is not provided, initialize it to an empty list.
- Initialize {resultMap} to an empty ordered map.
- Initialize {newIncrementalResults}, {forDeferredFragments}, and {futures} to
  empty lists.
- For each {groupedFieldSet} as {responseKey} and {fieldGroup}:
  - Let {fieldDetails} be the first entry in {fieldGroup}.
  - Let {node} be the corresponding entry on {fieldDetails}.
  - Let {fieldName} be the name of {node}. Note: This value is unaffected if an
    alias is used.
  - Let {fieldType} be the return type defined for the field {fieldName} of
    {objectType}.
  - If {fieldType} is defined:
    - Let {responseValue}, {fieldIncrementalResults}, {forDeferredFragments},
      and {fieldFutures} be the result of {ExecuteField(objectType, objectValue,
      fieldType, fieldGroup, variableValues, path)}.
    - Set {responseValue} as the value for {responseKey} in {resultMap}.
    - Append all members of {fieldIncrementalResults} to
      {newIncrementalResults}.
    - Append all members of {fieldForDeferredFragments} to
      {forDeferredFragments}.
    - Append all members of {fieldFutures} to {futures}.
- Return {resultMap}, {newIncrementalResults}, {forDeferredFragments}, and
  {futures}.

Note: {resultMap} is ordered by which fields appear first in the operation. This
is explained in greater detail in the Selection Set Analysis section below.

**Errors and Non-Null Fields**

If during {ExecuteGroupedFieldSet()} a field with a non-null {fieldType} raises
a _field error_ then that error must propagate to this entire grouped field set,
either resolving to {null} if allowed or further propagated to a parent field.

If this occurs, any sibling fields which have not yet executed or have not yet
yielded a value may be cancelled to avoid unnecessary work.

Additionally, Subsequent Result records must not be yielded if their path points
to a location that has resolved to {null} due to propagation of a field error.
If these subsequent results have not yet executed or have not yet yielded a
value they may also be cancelled to avoid unnecessary work.

For example, assume the field `alwaysThrows` is a `Non-Null` type that always
raises a field error:

```graphql example
{
  myObject {
    ... @defer {
      name
    }
    alwaysThrows
  }
}
```

In this case, only one response should be sent. The result of the fragment
tagged with the `@defer` directive should be ignored and its execution, if
initiated, may be cancelled.

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

When subsections contain a `@stream` or `@defer` directive, these subsections
are no longer required to execute serially. Execution of the deferred or
streamed sections of the subsection may be executed in parallel, as defined in
{ExecuteDeferredGroupedFieldSets} and {ExecuteStreamField}.

### Selection Set Analysis

Before execution, the selection set is converted to a grouped field set by
calling {AnalyzeSelectionSet()} and {BuildGroupedFieldSets()}. Each entry in the
grouped field set is a Field Group record describing all fields that share a
response key (the alias if defined, otherwise the field name). This ensures all
fields with the same response key (including those in referenced fragments) are
executed at the same time.

As an example, analysis of the fields of this selection set would return two
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

The depth-first-search order of the field groups produced by selection set
processing is maintained through execution, ensuring that fields appear in the
executed response in a stable and predictable order.

{AnalyzeSelectionSet()} also returns a list of references to any new deferred
fragments encountered the selection set. {BuildGroupedFieldSets()} also
potentially returns additional deferred grouped field sets related to new or
previously encountered deferred fragments. Additional grouped field sets are
constructed carefully so as to ensure that each field is executed exactly once
and so that fields are grouped according to the set of deferred fragments that
include them.

Information derived from the presence of a `@defer` directive on a fragment is
returned as a Defer Usage record, unique to the label, a structure containing:

- {label}: value of the corresponding argument to the `@defer` directive.
- {ancestors}: a list, where the first entry is the parent Defer Usage record
  corresponding to the deferred fragment enclosing this deferred fragment and
  the remaining entries are the values included within the {ancestors} entry of
  that parent Defer Usage record, or, if this Defer Usage record is deferred
  directly by the initial result, a list containing the single value
  {undefined}.

A Field Group record is a structure containing:

- {fields}: a list of Field Details records for each encountered field.
- {targets}: the set of Defer Usage records corresponding to the deferred
  fragments enclosing this field, as well as possibly the value {undefined} if
  the field is included within the initial response.

A Field Details record is a structure containing:

- {node}: the field node itself.
- {target}: the Defer Usage record corresponding to the deferred fragment
  enclosing this field or the value {undefined} if the field was not deferred.

Information about additional deferred grouped field sets are returned as a list
of Grouped Field Set Details structures containing:

- {groupedFieldSet}: the grouped field set itself.
- {shouldInitiateDefer}: a boolean value indicating whether the executor should
  defer execution of {groupedFieldSet}.

Deferred grouped field sets do not always require initiating deferral. For
example, when a parent field is deferred by multiple fragments, deferral is
initiated on the parent field. New grouped field sets for child fields will be
created if the child fields are not all present in all of the deferred
fragments, but these new grouped field sets, while representing deferred fields,
do not require additional deferral.

AnalyzeSelectionSet(objectType, selectionSet, variableValues, visitedFragments,
parentTarget, newTarget):

- If {visitedFragments} is not defined, initialize it to the empty set.
- Initialize {targetsByKey} to an empty unordered map of sets.
- Initialize {fieldsByTarget} to an empty unordered map of ordered maps.
- Initialize {newDeferUsages} to an empty list of Defer Usage records.
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
    - Let {target} be {newTarget} if {newTarget} is defined; otherwise, let
      {target} be {parentTarget}.
    - Let {targetsForKey} be the list in {targetsByKey} for {responseKey}; if no
      such list exists, create it as an empty set.
    - Add {target} to {targetsForKey}.
    - Let {fieldsForTarget} be the map in {fieldsByTarget} for {responseKey}; if
      no such map exists, create it as an unordered map.
    - Let {groupForResponseKey} be the list in {fieldsForTarget} for
      {responseKey}; if no such list exists, create it as an empty list.
    - Append {selection} to the {groupForResponseKey}.
  - If {selection} is a {FragmentSpread}:
    - Let {fragmentSpreadName} be the name of {selection}.
    - If {fragmentSpreadName} provides the directive `@defer` and its {if}
      argument is not {false} and is not a variable in {variableValues} with the
      value {false}:
      - Let {deferDirective} be that directive.
      - If this execution is for a subscription operation, raise a _field
        error_.
    - If {deferDirective} is not defined:
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
    - If {deferDirective} is defined:
      - Let {label} be the value or the variable to {deferDirective}'s {label}
        argument.
      - Let {ancestors} be an empty list.
      - Append {parentTarget} to {ancestors}.
      - If {parentTarget} is defined:
        - Let {parentAncestors} be the {ancestor} entry on {parentTarget}.
        - Append all items in {parentAncestors} to {ancestors}.
      - Let {target} be a new Defer Usage record created from {label} and
        {ancestors}.
      - Append {target} to {newDeferUsages}.
    - Otherwise:
      - Let {target} be {newTarget}.
    - Let {fragmentTargetsByKey}, {fragmentFieldsByTarget},
      {fragmentNewDeferUsages} be the result of calling
      {AnalyzeSelectionSet(objectType, fragmentSelectionSet, variableValues,
      visitedFragments, parentTarget, target)}.
    - For each {target} and {fragmentMap} in {fragmentFieldsByTarget}:
      - Let {mapForTarget} be the ordered map in {fieldsByTarget} for {target};
        if no such map exists, create it as an empty ordered map.
      - For each {responseKey} and {fragmentList} in {fragmentMap}:
        - Let {listForResponseKey} be the list in {fieldsByTarget} for
          {responseKey}; if no such list exists, create it as an empty list.
        - Append all items in {fragmentList} to {listForResponseKey}.
    - For each {responseKey} and {targetSet} in {fragmentTargetsByKey}:
      - Let {setForResponseKey} be the set in {targetsByKey} for {responseKey};
        if no such set exists, create it as the empty set.
      - Add all items in {targetSet} to {setForResponseKey}.
    - Append all items in {fragmentNewDeferUsages} to {newDeferUsages}.
  - If {selection} is an {InlineFragment}:
    - Let {fragmentType} be the type condition on {selection}.
    - If {fragmentType} is not {null} and {DoesFragmentTypeApply(objectType,
      fragmentType)} is false, continue with the next {selection} in
      {selectionSet}.
    - Let {fragmentSelectionSet} be the top-level selection set of {selection}.
    - If {InlineFragment} provides the directive `@defer` and its {if} argument
      is not {false} and is not a variable in {variableValues} with the value
      {false}:
      - Let {deferDirective} be that directive.
      - If this execution is for a subscription operation, raise a _field
        error_.
    - If {deferDirective} is defined:
      - Let {label} be the value or the variable to {deferDirective}'s {label}
        argument.
      - Let {ancestors} be an empty list.
      - Append {parentTarget} to {ancestors}.
      - If {parentTarget} is defined:
        - Let {parentAncestors} be {ancestor} on {parentTarget}.
        - Append all items in {parentAncestors} to {ancestors}.
      - Let {target} be a new Defer Usage record created from {label} and
        {ancestors}.
      - Append {target} to {newDeferUsages}.
    - Otherwise:
      - Let {target} be {newTarget}.
    - Let {fragmentTargetsByKey}, {fragmentFieldsByTarget},
      {fragmentNewDeferUsages} be the result of calling
      {AnalyzeSelectionSet(objectType, fragmentSelectionSet, variableValues,
      visitedFragments, parentTarget, target)}.
    - For each {target} and {fragmentMap} in {fragmentFieldsByTarget}:
      - Let {mapForTarget} be the ordered map in {fieldsByTarget} for {target};
        if no such map exists, create it as an empty ordered map.
      - For each {responseKey} and {fragmentList} in {fragmentMap}:
        - Let {listForResponseKey} be the list in {fieldsByTarget} for
          {responseKey}; if no such list exists, create it as an empty list.
        - Append all items in {fragmentList} to {listForResponseKey}.
    - For each {responseKey} and {targetSet} in {fragmentTargetsByKey}:
      - Let {setForResponseKey} be the set in {targetsByKey} for {responseKey};
        if no such set exists, create it as the empty set.
      - Add all items in {targetSet} to {setForResponseKey}.
    - Append all items in {fragmentNewDeferUsages} to {newDeferUsages}.
- Return {fieldsByTarget}, {targetsByKey}, and {newDeferUsages}.

Note: The steps in {AnalyzeSelectionSet()} evaluating the `@skip` and `@include`
directives may be applied in either order since they apply commutatively.

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

BuildGroupedFieldSets(fieldsByTarget, targetsByKey, parentTargets)

- If {parentTargets} is not provided, initialize it to a set containing the
  value {undefined}.
- Initialize {groupedFieldSet} to an empty ordered map.
- Initialize {groupDetailsMap} to an empty unordered map.
- For each {responseKey} and {targets} in {targetsByKey}:
  - If {IsSameSet(targets, parentTargets)} is {true}:
    - Let {fieldGroup} be the Field Group record in {groupedFieldSet} for
      {responseKey}; if no such record exists, create a new such record from the
      empty list {fields} and the set of {parentTargets}.
    - For each {target} in {targets}:
      - Let {fields} be the entry in {fieldsByTarget} for {target}.
      - Let {nodes} be the list in {fields} for {responseKey}.
      - For each {node} of {nodes}:
        - Let {fieldDetails} be a new Field Details record created from {node}
          and {target}.
        - Append {fieldDetails} to the {fields} entry on {fieldGroup}.
- Initialize {groupDetailsMap} to an empty unordered map.
- For each {maskingTargets} and {targetSetDetails} in {targetSetDetailsMap}:
  - Initialize {newGroupedFieldSet} to an empty ordered map.
  - Let {keys} be the corresponding entry on {targetSetDetails}.
  - Let {orderedResponseKeys} be the result of
    {GetOrderedResponseKeys(maskingTargets, remainingFieldsByTarget)}.
  - For each {responseKey} in {orderedResponseKeys}:
    - If {keys} does not contain {responseKey}, continue to the next member of
      {orderedResponseKeys}.
    - Let {fieldGroup} be the Field Group record in {newGroupedFieldSet} for
      {responseKey}; if no such record exists, create a new such record from the
      empty list {fields} and the set of {parentTargets}.
    - Let {targets} be the entry in {targetsByKeys} for {responseKey}.
    - For each {target} in {targets}:
      - Let {remainingFieldsForTarget} be the entry in {remainingFieldsByTarget}
        for {target}.
      - Let {nodes} be the list in {remainingFieldsByTarget} for {responseKey}.
      - Remove the entry for {responseKey} from {remainingFieldsByTarget}.
      - For each {node} of {nodes}:
        - Let {fieldDetails} be a new Field Details record created from {node}
          and {target}.
        - Append {fieldDetails} to the {fields} entry on {fieldGroup}.
  - Let {shouldInitiateDefer} be the corresponding entry on {targetSetDetails}.
  - Initialize {details} to an empty unordered map.
  - Set the entry for {groupedFieldSet} in {details} to {newGroupedFieldSet}.
  - Set the corresponding entry in {details} to {shouldInitiateDefer}.
  - Set the entry for {targets} in {groupDetailsMap} to {details}.
- Return {groupedFieldSet} and {groupDetailsMap}.

Note: entries are always added to Grouped Field Set records in the order in
which they appear for the first target. Field order for deferred grouped field
sets never alters the field order for the parent.

GetTargetSetDetails(targetsByKey, parentTargets):

- Initialize {keysWithParentTargets} to the empty set.
- Initialize {targetSetDetailsMap} to an empty unordered map.
- For each {responseKey} and {targets} in {targetsByKey}:
  - If {IsSameSet(targets, parentTargets)} is {true}:
    - Append {responseKey} to {keysWithParentTargets}.
    - Continue to the next entry in {targetsByKey}.
  - For each {key} in {targetSetDetailsMap}:
    - If {IsSameSet(targets, key)} is {true}, let {targetSetDetails} be the map
      in {targetSetDetailsMap} for {targets}.
  - If {targetSetDetails} is defined:
    - Let {keys} be the corresponding entry on {targetSetDetails}.
    - Add {responseKey} to {keys}.
  - Otherwise:
    - Initialize {keys} to the empty set.
    - Add {responseKey} to {keys}.
    - Let {shouldInitiateDefer} be {false}.
    - For each {target} in {targets}:
      - Let {remainingFieldsForTarget} be the entry in {remainingFieldsByTarget}
        for {target}.
      - Let {nodes} be the list in {remainingFieldsByTarget} for {responseKey}.
      - Remove the entry for {responseKey} from {remainingFieldsByTarget}.
      - For each {node} of {nodes}:
        - Let {fieldDetails} be a new Field Details record created from {node}
          and {target}.
        - Append {fieldDetails} to the {fields} entry on {fieldGroup}.
  - Let {shouldInitiateDefer} be the corresponding entry on {targetSetDetails}.
  - Initialize {details} to an empty unordered map.
  - Set the entry for {groupedFieldSet} in {details} to {newGroupedFieldSet}.
  - Set the corresponding entry in {details} to {shouldInitiateDefer}.
  - Set the entry for {maskingTargets} in {groupDetailsMap} to {details}.
- Return {groupedFieldSet} and {groupDetailsMap}.

Note: entries are always added to Grouped Field Set records in the order in
which they appear for the first target. Field order for deferred grouped field
sets never alters the field order for the parent.

GetTargetSetDetails(targetsByKey, parentTargets):

- Initialize {keysWithParentTargets} to the empty set.
- Initialize {targetSetDetailsMap} to an empty unordered map.
- For each {responseKey} and {targets} in {targetsByKey}:
  - Initialize {maskingTargets} to an empty set.
  - For each {target} in {targets}:
    - If {target} is not defined:
      - Add {target} to {maskingTargets}.
      - Continue to the next entry in {targets}.
    - Let {ancestors} be the corresponding entry on {target}.
    - For each {ancestor} of {ancestors}:
      - If {targets} contains {ancestor}, continue to the next member of
        {targets}.
    - Add {target} to {maskingTargets}.
  - If {IsSameSet(maskingTargets, parentTargets)} is {true}:
    - Append {responseKey} to {keysWithParentTargets}.
    - Continue to the next entry in {targetsByKey}.
  - For each {key} in {targetSetDetailsMap}:
    - If {IsSameSet(maskingTargets, key)} is {true}, let {targetSetDetails} be
      the map in {targetSetDetailsMap} for {maskingTargets}.
  - If {targetSetDetails} is defined:
    - Let {keys} be the corresponding entry on {targetSetDetails}.
    - Add {responseKey} to {keys}.
  - Otherwise:
    - Initialize {keys} to the empty set.
    - Add {responseKey} to {keys}.
    - Let {shouldInitiateDefer} be {false}.
    - For each {target} in {maskingTargets}:
      - If {parentTargets} does not contain {target}:
        - Set {shouldInitiateDefer} equal to {true}.
    - Create {newTargetSetDetails} as an map containing {keys} and
      {shouldInitiateDefer}.
    - Set the entry in {targetSetDetailsMap} for {targets} to
      {newTargetSetDetails}.
- Return {keysWithParentTargets} and {targetSetDetailsMap}.

IsSameSet(setA, setB):

- If the size of setA is not equal to the size of setB:
  - Return {false}.
- For each {item} in {setA}:
  - If {setB} does not contain {item}:
    - Return {false}.
- Return {true}.

GetOrderedResponseKeys(targets, fieldsByTarget):

- Let {firstTarget} be the first entry in {targets}.
- Assert that {firstTarget} is defined.
- Let {firstFields} be the entry for {firstTarget} in {fieldsByTarget}.
- Assert that {firstFields} is defined.
- Let {responseKeys} be the keys of {firstFields}.
- Return {responseKeys}.

## Executing Deferred Grouped Field Sets

ExecuteDeferredGroupedFieldSets(objectType, objectValue, variableValues, path,
deferredGroupedFieldSetDetails, deferMap)

- Initialize {forDeferredFragments} to an empty list.
- Initialize {futures} to an empty list.
- For each {deferredGroupedFieldSetDetails} in {detailsList}, allowing for
  parallelization:
  - Let {path}, {deferredFragments}, {groupedFieldSet}, and
    {shouldInitiateDefer} be the corresponding entries on
    {deferredGroupedFieldSetDetails}.
  - Let {future} represent the future execution of
    {ExecuteDeferredGroupedFieldSet(groupedFieldSet, objectType, objectValue,
    variableValues, path, deferredFragments, deferMap)}.
  - If {shouldInitiateDefer} is {false}:
    - Initiate {future}.
  - Otherwise, if early execution of deferred fields is desired:
    - Following any implementation specific deferral of further execution,
      initiate {future}.
  - Append all members of {deferredFragments} to {forDeferredFragments}.
  - Append {future} to {futures}.
- Return {futures} and {forDeferredFragments}.

ExecuteDeferredGroupedFieldSet(groupedFieldSet, objectType, objectValue,
variableValues, path, deferMap, deferredFragments):

- Let {data}, {newIncrementalResults}, and {futures} be the result of
  {ExecuteGroupedFieldSet(groupedFieldSet, objectType, objectValue,
  variableValues, path, deferredFragments, deferMap)}.
- Let {errors} be the list of all _field error_ raised while executing the
  {groupedFieldSet}.
- Let {deferredResult} be an unordered map containing {path},
  {deferredFragments}, {data}, {errors}, {newIncrementalResults}, and {futures}.
- Return {deferredResult}.

## Executing Fields

Each field requested in the grouped field set that is defined on the selected
objectType will result in an entry in the response map. Field execution first
coerces any provided argument values, then resolves a value for the field, and
finally completes that value either by recursively executing another selection
set or coercing a scalar value.

ExecuteField(objectType, objectValue, fieldType, fieldGroup, variableValues,
path, deferMap):

- Let {fieldDetails} be the first entry in {fieldGroup}.
- Let {node} be the corresponding entry on {fieldDetails}.
- Let {fieldName} be the field name of {node}.
- Append {fieldName} to {path}.
- Let {argumentValues} be the result of {CoerceArgumentValues(objectType, field,
  variableValues)}
- Let {resolvedValue} be {ResolveFieldValue(objectType, objectValue, fieldName,
  argumentValues)}.
- Return the result of {CompleteValue(fieldType, fields, resolvedValue,
  variableValues, path, deferMap)}.

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

#### Execute Stream Field

ExecuteStreamField(stream, iterator, fieldGroup, index, innerType,
variableValues):

- Let {path} be the corresponding entry on {stream}.
- Let {itemPath} be {path} with {index} appended.
- Let {newDeferMap} be an empty unordered map.
- Wait for the next item from {iterator}.
- If {iterator} is closed, return.
- Let {item} be the next item retrieved via {iterator}.
- Let {nextIndex} be {index} plus one.
- Let {completedItem}, {newIncrementalResults}, and {itemFutures} be the result
  of {CompleteValue(innerType, fieldGroup, item, variableValues, itemPath,
  newDeferMap)}.
- Initialize {completedItems} to an empty list.
- Append {completedItem} to {completedItems}.
- Let {future} represent the future execution of {ExecuteStreamItem(stream,
  path, iterator, fieldGroup, nextIndex, innerType, variableValues)}.
- If early execution of streamed fields is desired:
  - Following any implementation specific deferral of further execution,
    initiate {execution}.
- Initialize {futures} to an empty list.
- Append {future} to {futures}.
- Append all members of {itemFutures} to {futures}.
- Let {errors} be the list of all _field error_ raised while completing the
  item.
- Let {streamedItems} be an unordered map containing {stream}, {completedItems}
  {errors}, {newIncrementalResults}, and {futures}.
- Return {streamedItem}.

CompleteValue(fieldType, fieldGroup, result, variableValues, path, deferMap):

- If the {fieldType} is a Non-Null type:
  - Let {innerType} be the inner type of {fieldType}.
  - Let {completedResult}, {newIncrementalResults}, {forDeferredFragments}, and
    {futures} be the result of calling {CompleteValue(innerType, fieldGroup,
    result, variableValues, path)}.
  - If {completedResult} is {null}, raise a _field error_.
  - Return {completedResult}.
- If {result} is {null} (or another internal value similar to {null} such as
  {undefined}), return {null}.
- If {fieldType} is a List type:
  - Initialize {newIncrementalResults}, {forDeferredFragments}, and {futures} to
    empty lists.
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
      - Let {stream} be an unordered map containing {label} and {path}.
      - Append {stream} to {newIncrementalResults}.
      - Let {streamFieldGroup} be the result of
        {GetStreamFieldGroup(fieldGroup)}.
      - Let {future} represent the future execution of
        {ExecuteStreamField(stream, iterator, streamFieldGroup, index,
        innerType, variableValues)}.
      - If early execution of streamed fields is desired:
      - Following any implementation specific deferral of further execution,
        initiate {future}.
      - Append {future} to {futures}.
      - Return {items}, {newIncrementalResults}, {forDeferredFragments}, and
        {futures},
    - Otherwise:
      - Wait for the next item from {result} via the {iterator}.
      - If an item is not retrieved because of an error, raise a _field error_.
      - Let {item} be the item retrieved from {result}.
      - Let {itemPath} be {path} with {index} appended.
      - Let {completedItem}, {itemNewIncrementalResults} and {itemFutures} be
        the result of calling {CompleteValue(innerType, fields, item,
        variableValues, itemPath, deferMap)}.
      - Append {completedItem} to {items}.
      - Append all members of {itemNewIncrementalResults} to
        {newIncrementalResults}.
      - Append all members of {itemForDeferredFragments} to
        {forDeferredFragments}.
      - Append all members of {itemFutures} to {futures}.
      - Increment {index}.
  - Return {items}, {newIncrementalResults}, {forDeferredFragments}, and
    {futures}.
- If {fieldType} is a Scalar or Enum type:
  - Return the result of {CoerceResult(fieldType, result)}.
- If {fieldType} is an Object, Interface, or Union type:
  - If {fieldType} is an Object type.
    - Let {objectType} be {fieldType}.
  - Otherwise if {fieldType} is an Interface or Union type.
    - Let {objectType} be {ResolveAbstractType(fieldType, result)}.
  - Let {groupedFieldSet}, {groupDetailsMap}, and {deferUsages} be the result of
    {ProcessSubSelectionSets(objectType, fieldGroup, variableValues)}.
  - Let {newDeferMap} and {newIncrementalResults} be the result of
    {GetNewDeferredFragments(newDeferUsages, deferMap, path)}.
  - Let {detailsList} be the result of
    {GetDeferredGroupedFieldSetDetails(groupDetailsMap, newDeferMap, path)}.
  - Let {completed}, {nestedNewIncrementalResults},
    {nestedForDeferredFragments}, and {nestedFutures} be the result of
    evaluating {ExecuteGroupedFieldSet(groupedFieldSet, objectType, result,
    variableValues, path, newDeferMap)} _normally_ (allowing for
    parallelization).
  - In parallel, let {futures} and {forDeferredFragments} be the result of
    {ExecuteDeferredGroupedFieldSets(queryType, initialValues, variableValues,
    detailsList, newDeferMap)}.
  - Append all members of {nestedNewIncrementalResults} to
    {newIncrementalResults}.
  - Append all members of {nestedForDeferredFragments} to
    {forDeferredFragments}.
  - Append all members of {nestedFutures} to {futures}.
  - Return {completed}, {newIncrementalResults}, {forDeferredFragments}, and
    {futures}.

ProcessSubSelectionSets(objectType, fieldGroup, variableValues):

- Initialize {targetsByKey} to an empty unordered map of sets.
- Initialize {fieldsByTarget} to an empty unordered map of ordered maps.
- Initialize {newDeferUsages} to an empty list.
- Let {fields} and {targets} be the corresponding entries on {fieldGroup}.
- For each {fieldDetails} within {fields}:
  - Let {node} and {target} be the corresponding entries on {fieldDetails}.
  - Let {fieldSelectionSet} be the selection set of {fieldNode}.
  - If {fieldSelectionSet} is null or empty, continue to the next field.
  - Let {subfieldsFieldsByTarget}, {subfieldTargetsByKey}, and
    {subfieldNewDeferUsages} be the result of calling
    {AnalyzeSelectionSet(objectType, fieldSelectionSet, variableValues,
    visitedFragments, target)}.
    - For each {target} and {subfieldMap} in {subfieldFieldsByTarget}:
      - Let {mapForTarget} be the ordered map in {fieldsByTarget} for {target};
        if no such map exists, create it as an empty ordered map.
      - For each {responseKey} and {subfieldList} in {subfieldMap}:
        - Let {listForResponseKey} be the list in {fieldsByTarget} for
          {responseKey}; if no such list exists, create it as an empty list.
        - Append all items in {subfieldList} to {listForResponseKey}.
    - For each {responseKey} and {targetSet} in {subfieldTargetsByKey}:
      - Let {setForResponseKey} be the set in {targetsByKey} for {responseKey};
        if no such set exists, create it as the empty set.
      - Add all items in {targetSet} to {setForResponseKey}.
    - Append all items in {subfieldNewDeferUsages} to {newDeferUsages}.
- Let {parentTargets} be the corresponding entry on {fieldGroup}.
- Let {groupedFieldSet} and {newGroupedFieldSetDetails} be the result of calling
  {BuildGroupedFieldSets(fieldsByTarget, targetsByKey, parentTargets)}.
- Return {groupedFieldSet}, {newGroupedFieldSetDetails}, and {newDeferUsages}.

GetStreamFieldGroup(fieldGroup):

- Let {streamFields} be an empty list.
- Let {fields} be the corresponding entry on {fieldGroup}.
- For each {fieldDetails} in {fields}:
  - Let {node} be the corresponding entry on {fieldDetails}.
  - Let {newFieldDetails} be a new Field Details record created from {node} and
    {undefined}.
  - Append {newFieldDetails} to {streamFields}.
- Let {targets} be a set containing the value {undefined}.
- Let {streamFieldGroup} be a new Field Group record created from {streamFields}
  and {targets}.
- Return {streamFieldGroup}.

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

When more than one field of the same name is executed in parallel, their
selection sets are merged together when completing the value in order to
continue execution of the sub-selection sets.

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

After resolving the value for `me`, the selection sets are merged together by
calling {ProcessSubSelectionSets()} so `firstName` and `lastName` can be
resolved for one value.

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

When a field error is raised inside `ExecuteDeferredGroupedFieldSets` or
`ExecuteStreamField`, the defer and stream payloads act as error boundaries.
That is, the null resulting from a `Non-Null` type cannot propagate outside of
the boundary of the defer or stream payload.

If a field error is raised while executing the selection set of a fragment with
the `defer` directive, causing a {null} to propagate to the object containing
this fragment, the {null} should not be sent to the client, as this will
overwrite existing data. In this case, the associated Defer Payload's
`completed` entry must include the causative errors, whose presence indicated
the failure of the payload to be included within the final reconcilable object.

For example, assume the `month` field is a `Non-Null` type that raises a field
error:

```graphql example
{
  birthday {
    ... @defer(label: "monthDefer") {
      month
    }
    ... @defer(label: "yearDefer") {
      year
    }
  }
}
```

Response 1, the initial response is sent:

```json example
{
  "data": { "birthday": {} },
  "pending": [
    { "path": ["birthday"], "label": "monthDefer" }
    { "path": ["birthday"], "label": "yearDefer" }
  ],
  "hasNext": true
}
```

Response 2, the defer payload for label "monthDefer" is completed with errors.
Incremental data cannot be sent, as this would overwrite previously sent values.

```json example
{
  "completed": [
    {
      "path": ["birthday"],
      "label": "monthDefer",
      "errors": [...]
    }
  ],
  "hasNext": false
}
```

Response 3, the defer payload for label "yearDefer" is sent. The data in this
payload is unaffected by the previous null error.

```json example
{
  "incremental": [
    {
      "path": ["birthday"],
      "data": { "year": "2022" }
    }
  ],
  "completed": [
    {
      "path": ["birthday"],
      "label": "yearDefer"
    }
  ],
  "hasNext": false
}
```

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
