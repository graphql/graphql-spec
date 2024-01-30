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
- Let {fieldDetailsList} be the value of the first entry in {groupedFieldSet}.
- Let {fieldDetails} be the first entry in {fieldDetailsList}.
- Let {node} be the corresponding entry on {fieldDetails}.
- Let {fieldName} be the name of {node}. Note: This value is unaffected if an
  alias is used.
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

First, the selection set is turned into a field plan; then, we execute this
field plan, which may yield one or more incremental results, as specified by the
{YieldIncrementalResults()} algorithm. If an operation contains `@defer` or
`@stream` directives, we return the Subsequent Result stream in addition to the
initial response. Otherwise, we return just the initial result.

ExecuteRootSelectionSet(variableValues, initialValue, objectType, selectionSet,
serial):

- Let {incrementalResults} be the result of
  {YieldIncrementalResults(variableValues, initialValue, objectType,
  selectionSet, serial)}.
- Wait for the first result in {incrementalResults} to be available.
- Let {initialResult} be that result.
- Let {initialResponse} and {ids} be the result of
  {GetInitialResponse(initialResult)}.
- Let {subsequentResponses} be the result of running
  {MapSubsequentResultToResponse(incrementalResult, ids)}.
- Return {initialResponse} and {subsequentResponses}.

MapSubsequentResultToResponse(subsequentResultStream, originalIds):

- Let {ids} be a new unordered map containing all of the entries in
  {originalIds}.
- Return a new event stream {subsequentResponseStream} which yields events as
  follows:
- For each {result} on {subsequentResultStream}:
  - Let {response} and {ids} be the result of {GetSubsequentPayload(update,
    ids)}.
  - Yield an event containing {response}.
- When {subsequentResultStream} completes: complete this event stream.

GetInitialResponse(initialResult):

- Let {newPendingResults} be entry for {pending} on {initialResult}.
- Let {pending} and {ids} be the result of {GetPending(pending)}.
- Let {data} and {errors} be the corresponding entries on {initialResult}.
- Let {initialResponse} be an unordered map containing {data} and {errors}.
- If {pending} is not empty:
  - Set the corresponding entry on {payload} to {pending}.
  - Set the entry for {hasNext} on {payload} to {true}.
- Return {initialResponse} and {ids}.

GetPending(newPendingResults, originalIds):

- Let {ids} be a new unordered map containing all of the entries in
  {originalIds}.
- Initialize {pending} to an empty list.
- For each {newPendingResult} in {newPendingResults}:
  - Let {path} and {label} be the corresponding entries on {newPendingResult}.
  - Let {id} be a unique identifier for this {newPendingResult}.
  - Set the entry for {newPendingResult} in {ids} to {id}.
  - Let {pendingEntry} be an unordered map containing {path}, {label}, and {id}.
  - Append {pendingEntry} to {pending}.
- Return {pending} and {ids}.

GetSubsequentResponse(update, originalIds):

- Let {newPendingResults} be entry for {pending} on {update}.
- Let {pending} and {ids} be the result of {GetPending(pending, originalIds)}.
- Initialize {incremental} and {completed} to empty lists.
- For each {completedEntry} in {completed} on {update}:
  - Let {newCompletedEntry} be a new empty unordered map.
  - Let {pendingResult} be the corresponding entry on {completedEntry}.
  - Let {id} be the entry for {pendingResult} on {ids}.
  - Remove the entry on {ids} for {pendingResult}.
  - Set the corresponding entry on {newCompletedEntry} to {id}.
  - Let {errors} be the corresponding entry on {completedEntry}.
  - If {errors} is defined, set the corresponding entry on {newCompletedEntry}
    to {errors}.
  - Append {newCompletedEntry} to {completed}.
- For each {incrementalResult} in {incremental} on {update}:
  - If {incrementalResult} represents completion of Stream Items:
    - Let {stream} be the corresponding entry on {incrementalResult}.
    - Let {id} be the corresponding entry on {ids} for {stream}.
    - Let {items} and {errors} be the corresponding entries on
      {incrementalResult}.
    - Let {incrementalEntry} be an unordered map containing {id}, {items}, and
      {errors}.
  - Otherwise:
    - Let {id} and {subPath} be the result of calling
      {GetIdAndSubPath(incrementalResult, ids)}.
    - Let {data} and {errors} be the corresponding entries on
      {incrementalResult}.
    - Let {incrementalEntry} be an unordered map containing {id}, {data}, and
      {errors}.
  - Append {incrementalEntry} to {incremental}.
- Let {hasNext} be {false} if {ids} is empty, otherwise {true}.
- Let {payload} be an unordered map containing {hasNext}.
- If {pending} is not empty, set the corresponding entry on {payload} to
  {pending}.
- If {incremental} is not empty, set the corresponding entry on {payload} to
  {incremental}.
- If {completed} is not empty, set the corresponding entry on {payload} to
  {completed}.
- Return {ids} and {payload}.

GetIdAndSubPath(deferredResult, ids):

- Initialize {releasedFragments} to an empty list.
- Let {deferredFragments} be the corresponding entry on {deferredResult}.
- For each {deferredFragment} in {deferredFragments}:
  - Let {id} be the entry for {deferredFragment} on {ids}.
  - If {id} is defined, append {deferredFragment} to {releasedFragments}.
- Let {currentFragment} be the first member of {releasedFragments}.
- Let {currentPath} be the entry for {path} on {firstDeferredFragment}.
- Let {currentPathLength} be the length of {currentPath}.
- For each remaining {deferredFragment} within {deferredFragments}.
  - Let {path} be the corresponding entry on {deferredFragment}.
  - Let {pathLength} be the length of {path}.
  - If {pathLength} is larger than {currentPathLength}:
    - Set {currentPathLength} to {pathLength}.
    - Set {currentFragment} to {deferredFragment}.
- Let {id} be the entry on {ids} for {currentFragment}.
- If {id} is not defined, return.
- Let {path} be the corresponding entry on {currentFragment}.
- Let {subPath} be the subset of {path}, omitting the first {currentPathLength}
  entries.
- Return {id} and {subPath}.

### Field Collection

Before execution, selection set(s) are converted to a field plan via a two-step
process. In the first step, selections are converted into a grouped field set by
calling {CollectFields()}. Each entry in a grouped field set is a list of Field
Details records describing all fields that share a response key (the alias if
defined, otherwise the field name). This ensures all fields with the same
response key (including those in referenced fragments) are executed at the same
time.

A Field Details record is a structure containing:

- {node}: the field node itself.
- {deferUsage}: the Defer Usage record corresponding to the deferred fragment
  enclosing this field, not defined if the field was not deferred.

Defer Usage records contain information derived from the presence of a `@defer`
directive on a fragment and are structures containing:

- {label}: value of the corresponding argument to the `@defer` directive.
- {parentDeferUsage}: the parent Defer Usage record corresponding to the
  deferred fragment enclosing this deferred fragment, not defined if this Defer
  Usage record is deferred directly by the initial result.

As an example, collecting the fields of this selection set would return field
details related to two instances of the field `a` and one of field `b`:

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

CollectFields(objectType, selectionSet, variableValues, deferUsage,
visitedFragments):

- If {visitedFragments} is not provided, initialize it to the empty set.
- Initialize {groupedFields} to an empty ordered map of lists.
- Initialize {newDeferUsages} to an empty list.
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
    - Let {fieldDetails} be a new Field Details record created from {selection}
      and {deferUsage}.
    - Let {groupForResponseKey} be the list in {groupedFields} for
      {responseKey}; if no such list exists, create it as an empty list.
    - Append {fieldDetails} to the {groupForResponseKey}.
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
      - Let {fragmentDeferUsage} be a new Defer Usage record created from
        {label} and {deferUsage}.
      - Append {fragmentDeferUsage} to {newDeferUsages}.
    - Otherwise:
      - Let {fragmentDeferUsage} be {deferUsage}.
    - Let {fragmentGroupedFieldSet} and {fragmentNewDeferUsages} be the result
      of calling {CollectFields(objectType, fragmentSelectionSet,
      variableValues, fragmentDeferUsage, visitedFragments)}.
    - For each {fragmentGroup} in {fragmentGroupedFieldSet}:
      - Let {responseKey} be the response key shared by all fields in
        {fragmentGroup}.
      - Let {groupForResponseKey} be the list in {groupedFields} for
        {responseKey}; if no such list exists, create it as an empty list.
      - Append all items in {fragmentGroup} to {groupForResponseKey}.
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
      - Let {fragmentDeferUsage} be a new Defer Usage record created from
        {label} and {deferUsage}.
      - Add {fragmentDeferUsage} to {newDeferUsages}.
    - Otherwise:
      - Let {fragmentDeferUsage} be {deferUsage}.
    - Let {fragmentGroupedFieldSet} and {fragmentNewDeferUsages} be the result
      of calling {CollectFields(objectType, fragmentSelectionSet,
      variableValues, fragmentDeferUsage, visitedFragments)}.
    - For each {fragmentGroup} in {fragmentGroupedFieldSet}:
      - Let {responseKey} be the response key shared by all fields in
        {fragmentGroup}.
      - Let {groupForResponseKey} be the list in {groupedFields} for
        {responseKey}; if no such list exists, create it as an empty list.
      - Append all items in {fragmentGroup} to {groupForResponseKey}.
    - Append all items in {fragmentNewDeferUsages} to {newDeferUsages}.
- Return {groupedFields} and {newDeferUsages}.

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

### Field Plan Generation

In the second step, the original grouped field set is converted into a field
plan via analysis of the Field Details.

A Field Plan record is a structure containing:

- {groupedFieldSet}: the grouped field set for the current result.
- {newGroupedFieldSets}: an unordered map containing additional grouped field
  sets for related to previously encountered Defer Usage records. The map is
  keyed by the unique set of Defer Usage records to which these new grouped
  field sets belong. (See below for an explanation of why these additional
  grouped field sets may be required.)
- {newGroupedFieldSetsRequiringDeferral}: a map containing additional grouped
  field sets for new incremental results relating to the newly encountered
  deferred fragments. The map is keyed by the set of Defer Usage records to
  which these new grouped field sets belong.

Additional grouped field sets are constructed carefully so as to ensure that
each field is executed exactly once and so that fields are grouped according to
the set of deferred fragments that include them.

Deferred grouped field sets do not always require initiating deferral. For
example, when a parent field is deferred by multiple fragments, deferral is
initiated on the parent field. New grouped field sets for child fields will be
created if the child fields are not all present in all of the deferred
fragments, but these new grouped field sets, while representing deferred fields,
do not require additional deferral. The produced field plan will also retain
this information.

BuildFieldPlan(groupedFieldSet, parentDeferUsages):

- If {parentDeferUsages} is not provided, initialize it to the empty set.
- Initialize {originalGroupedFieldSet} to an empty ordered map.
- Initialize {newGroupedFieldSets} to an empty unordered map.
- Initialize {newGroupedFieldSetsRequiringDeferral} to an empty unordered map.
- For each {responseKey} and {groupForResponseKey} of {groupedFieldSet}:
  - Let {deferUsageSet} be the result of
    {GetDeferUsageSet(groupForResponseKey)}.
  - If {IsSameSet(deferUsageSet, parentDeferUsages)} is {true}:
    - Let {groupedFieldSet} be {originalGroupedFieldSet}.
  - Otherwise:
    - Let {groupedFieldSets} be {newGroupedFieldSetsRequiringDeferral} if
      {ShouldInitiateDefer(deferUsageSet, parentDeferUsages)} is {true},
      otherwise let it be {newGroupedFieldSets}:
    - For each {key} in {groupedFieldSets}:
      - If {IsSameSet(key, deferUsageSet)} is {true}:
        - Let {groupedFieldSet} be the map in {groupedFieldSets} for {key}.
    - If {groupedFieldSet} is not defined:
      - Initialize {groupedFieldSet} to an empty ordered map.
      - Set the entry for {deferUsageSet} in {groupedFieldSets} to
        {groupedFieldSet}.
  - Set the entry for {responseKey} in {originalGroupedFieldSet} to
    {groupForResponseKey}.
- Let {fieldPlan} be a new Field Plan record created from
  {originalGroupedFieldSet}, {newGroupedFieldSets}, and
  {newGroupedFieldSetsRequiringDeferral}.
- Return {fieldPlan}.

GetDeferUsageSet(fieldDetailsList):

- Initialize {deferUsageSet} to the empty set.
- Let {inInitialResult} be {false}.
- For each {fieldDetails} in {fieldDetailsList}:
  - Let {deferUsage} be the corresponding entry on {fieldDetails}.
  - If {deferUsage} is not defined:
    - Let {inInitialResult} be {true}.
    - Continue to the next {fieldDetails} in {fieldDetailsList}.
  - Add {deferUsage} to {deferUsageSet}.
- If {inInitialResult} is true, reset {deferUsageSet} to the empty set;
  otherwise, let {deferUsageSet} be the result of
  {FilterDeferUsages(deferUsageSet)}.
- Return {deferUsageSet}.

FilterDeferUsages(deferUsages):

- Initialize {filteredDeferUsages} to the empty set.
- For each {deferUsage} in {deferUsages}:
  - Let {ancestors} be the result of {GetAncestors(deferUsage)}.
  - For each {ancestor} of {ancestors}:
    - If {ancestor} is in {deferUsages}.
    - Continue to the next {deferUsage} in {deferUsages}.
  - Add {deferUsage} to {filteredDeferUsages}.
- Return {filteredDeferUsages}.

GetAncestors(deferUsage):

- Initialize {ancestors} to an empty list.
- Let {parentDeferUsage} be the corresponding entry on {deferUsage}.
- If {parentDeferUsage} is not defined, return {ancestors}.
- Append {parentDeferUsage} to {ancestors}.
- Append all the items in {GetAncestors(parentDeferUsage)} to {ancestors}.
- Return {ancestors}.

ShouldInitiateDefer(deferUsageSet, parentDeferUsageSet):

- For each {deferUsage} in {deferUsageSet}:
  - If {parentDeferUsageSet} does not contain {deferUsage}:
    - Return {true}.
- Return {false}.

IsSameSet(setA, setB):

- If the size of setA is not equal to the size of setB:
  - Return {false}.
- For each {item} in {setA}:
  - If {setB} does not contain {item}:
    - Return {false}.
- Return {true}.

### Yielding Incremental Results

The procedure for yielding incremental results is specified by the
{YieldIncrementalResults()} algorithm.

YieldIncrementalResults(variableValues, initialValue, objectType, selectionSet,
serial):

- Let {initialFuture} be the future result of
  {ExecuteInitialResult(variableValues, initialValue, objectType, selectionSet,
  serial)}.
- Initialize {pendingResults}, {pendingFutures}, and {unsent} to the empty set.
- Initialize {newPendingResultsByFragment}, {pendingFuturesByFragment}, and
  {completedFuturesByFragment} to empty unordered maps.
- Repeat the following steps:
  - Initialize {pending}, {incremental}, and {completed} to empty lists.
  - Wait for any futures within {pendingFutures} to complete.
  - Let {completedFutures} be those completed futures.
  - For each {future} in {completedFutures}:
    - Remove {future} from {pendingFutures}.
    - Let {result} be the result of {future}.
    - If {result} represents the Initial Result:
      - Let {data} and {errors} be the corresponding entries on {result}.
    - Otherwise, if {result} incrementally completes a Stream:
      - Let {stream}, {items}, and {errors} be the corresponding entries on
        {result}.
      - If {items} is not defined, the stream has asynchronously ended:
        - Let {completedEntry} be an empty unordered map.
        - Set the entry for {pendingResult} on {completedEntry} to {stream}.
        - Append {completedEntry} to {completed}.
        - Remove {stream} from {pendingResults}.
      - Otherwise, if {items} is {null}:
        - Let {completedEntry} be an unordered map containing {errors}.
        - Set the entry for {pendingResult} on {completedEntry} to {stream}.
        - Append {completedEntry} to {completed}.
        - Remove {stream} from {pendingResults}.
      - Otherwise:
        - Append {streamItems} to {incremental}.
    - Otherwise:
      - Let {deferredFragments}, {data}, and {errors} be the corresponding
        entries on {result}.
      - If {data} is {null}:
        - For each {deferredFragment} in {deferredFragments}:
          - If {deferredFragment} is not contained by {pendingResults}, continue
            to the next {deferredFragment} in {deferredFragments}.
          - Let {completedEntry} be an unordered map containing {errors}.
          - Set the entry for {pendingResult} on {completedEntry} to
            {deferredFragment}.
          - Append {completedEntry} to {completed}.
          - Remove {deferredFragment} from {pendingResults}.
      - Otherwise:
        - For each {deferredFragment} in {deferredFragments}:
          - If {deferredFragment} is not contained by {pendingResults}, continue
            to the next {deferredFragment} in {deferredFragments}.
          - Let {completedFuturesForFragment} be the entry for
            {deferredFragment} in {completedFuturesByFragment}; if no such list
            exists, create it as an empty list.
          - Append {future} to {completedFuturesForFragment}.
          - Add {future} to {unsent}.
          - Let {pendingFuturesForFragment} be the entry for {deferredFragment}
            in {pendingFuturesByFragment}.
          - If the size of {completedFuturesForFragment} is equal to the size of
            {pendingFuturesForFragment}:
            - Let {fragmentPendingFutures}, {fragmentPending},
              {fragmentIncremental}, and {fragmentCompleted}, be the result of
              {CompleteFragment(deferredFragment, completedFuturesForFragment,
              pendingFuturesForFragment, newPendingResultsByFragment,
              completedFuturesByFragment, unsent)}.
            - Add all items in {fragmentPendingFutures} to {pendingFutures}.
            - For each {pendingResult} in {fragmentPending}:
              - Append {pendingResult} to {pending}.
              - Add {pendingResult} to {pendingResults}.
            - For each {fragmentResult} in {fragmentIncremental}:
              - Remove {fragmentResult} from {unsent}.
            - For each {completedEntry} in {completed}:
              - Let {pendingResult} be the corresponding entry on
                {completedEntry}.
              - Remove {pendingResult} from {pendingResults}.
    - For each {result} in {incremental}:
      - Let {newPendingResults} and {futures} be the corresponding entries on
        {incremental}.
      - For each {future} of {futures}:
        - If {future} represents completion of Stream Items:
          - Initiate {future} if it has not yet been initiated.
          - Add {future} to {pendingFutures}.
        - Otherwise:
          - Let {deferredFragments} be the Deferred Fragments completed by
            {future}.
          - For each {deferredFragment} in {deferredFragments}:
            - Let {pendingFuturesForFragment} be the entry for
              {deferredFragment} in {pendingFuturesByFragment}; if no such list
              exists, create it as an empty list.
            - Append {future} to {pendingFuturesForFragment}.
            - If {deferredFragment} is contained by {pendingResults}:
              - Initiate {future} if it has not yet been initiated.
              - Add {future} to {pendingFutures}.
      - For each {newPendingResult} of {newPendingResults}:
        - If {newPendingResult} represents a Stream:
          - Append {newPendingResult} to {pending}.
          - Add {newPendingResult} to {pendingResults}.
        - Otherwise:
          - Let {pendingFuturesForFragment} be the entry for {newPendingResult}
            in {pendingFuturesByFragment}; if no such list exists, continue to
            the next {newPendingResult} of {newPendingResults}.
          - Let {parent} be the corresponding entry on {newPendingResult}.
          - If {parent} is not defined or {pendingResults} does not contain
            {parent}:
            - Append {newPendingResult} to {pending}.
            - Add {newPendingResult} to {pendingResults}.
            - For each {future} in {pendingFuturesForFragment}:
              - Initiate {future} if it has not yet been initiated.
              - Add {future} to {pendingFutures}.
          - Otherwise:
            - Let {newPendingResultsForFragment} be the entry for {parent} in
              {newPendingResultsByFragment}; if no such list exists, create it
              as an empty list.
            - Append {newPendingResult} to {newPendingResultsForFragment}.
    - If {pendingResults} is empty, let {hasNext} be {false}, otherwise let it
      be {true}.
    - If {data} is defined:
      - Let {incrementalResult} be a new unordered map containing {data},
        {errors} and {pending}.
      - Yield {update}.
    - Otherwise, if {incremental} or {completed} is not empty:
      - Let {incrementalResult} be a new unordered map containing {pending},
        {incremental}, {completed} and {hasNext}.
      - Yield {update}.
    - If {hasNext} is {false}, complete this incremental result stream.

ExecuteInitialResult(variableValues, initialValue, objectType, selectionSet,
serial):

- If {serial} is not provided, initialize it to {false}.
- Let {groupedFieldSet} and {newDeferUsages} be the result of
  {CollectFields(objectType, selectionSet, variableValues)}.
- Let {fieldPlan} be the result of {BuildFieldPlan(groupedFieldSet)}.
- Let {data}, {newPendingResults}, and {futures} be the result of
  {ExecuteFieldPlan(newDeferUsages, fieldPlan, objectType, initialValue,
  variableValues, serial)}.
- Let {errors} be the list of all _field error_ raised while executing the
  {groupedFieldSet}.
- Let {initialResult} be an unordered map consisting of {data}, {errors},
  {newPendingResults}, and {futures}.
- Return {initialResult}.

CompleteFragment(deferredFragment, completedFuturesForFragment,
pendingFuturesForFragment, newPendingResultsByFragment,
completedFuturesByFragment, unsent):

- Initialize {pendingFutures} to the empty set.
- Initialize {pending}, {incremental}, and {completed} to empty lists.
- Let {completedEntry} be an empty unordered map.
- Set the entry for {pendingResult} on {completedEntry} to {deferredFragment}.
- Append {completedEntry} to {completed}.
- For each {future} in {completedFuturesForFragment}:
  - If {future} is in {unsent}:
    - Let {result} be the result of {future}.
    - Append {result} to {incremental}.
- Let {newPendingResultsForFragment} be the entry for {deferredFragment} in
  {newPendingResultsByFragment}.
- For each {deferredFragment} in {newPendingResultsForFragment}:
  - Let {fragmentPendingFuturesForFragment} be the entry for {deferredFragment}
    in {pendingFuturesByFragment}; if no such list exists, continue to the next
    {deferredFragment} in {newPendingResultsForFragment}.
  - Append {deferredFragment} to {pending}.
  - Let {fragmentCompletedFuturesForFragment} be the entry for
    {deferredFragment} in {completedFuturesByFragment}.
  - If the size of {fragmentCompletedFuturesForFragment} is equal to the size of
    {fragmentPendingFuturesForFragment}:
    - Let {fragmentNewFutures}, {fragmentPending}, {fragmentIncremental}, and
      {fragmentCompleted}, be the result of {CompleteFragment(deferredFragment,
      resultsForFragment, pendingFuturesForFragment,
      newPendingResultsByFragment, resultsByFragment, unsent)}.
    - Add all items in {fragmentPendingFutures} to {pendingFutures}.
    - Append all items in {fragmentPending} to {pending}.
    - Append all items in {fragmentIncremental} to {incremental}.
    - Append all items in {fragmentCompleted} to {completed}.
  - Otherwise:
    - For each {future} in {fragmentPendingFuturesForFragment}:
      - If {completedFuturesForFragment} does not contain {future}:
        - Initiate {future} if it has not yet been initiated.
        - Add {future} to {pendingFutures}.
- Return {pendingFutures}, {pending}, {incremental}, and {completed}.

## Executing a Field Plan

To execute a field plan, the object value being evaluated and the object type
need to be known, as well as whether the non-deferred grouped field set must be
executed serially, or may be executed in parallel.

ExecuteFieldPlan(newDeferUsages, fieldPlan, objectType, objectValue,
variableValues, serial, path, deferUsageSet, deferMap):

- If {path} is not provided, initialize it to an empty list.
- Let {groupedFieldSet}, {newGroupedFieldSets}, {newDeferUsages}, and
  {newGroupedFieldSetsRequiringDeferral} be the corresponding entries on
  {fieldPlan}.
- Let {newPendingResults} and {newDeferMap} be the result of
  {GetNewDeferredFragments(newDeferUsages, path, deferMap)}.
- Allowing for parallelization, perform the following steps:
  - Let {data}, {newPendingResults}, and {nestedFutures} be the result of
    running {ExecuteGroupedFieldSet(groupedFieldSet, objectType, objectValue,
    variableValues, path, deferUsageSet, newDeferMap)} _serially_ if {serial} is
    {true}, _normally_ (allowing parallelization) otherwise.
  - Let {supplementalFutures} be the result of
    {ExecuteDeferredGroupedFieldSets(objectType, objectValue, variableValues,
    newGroupedFieldSets, true, path, newDeferMap)}.
  - Let {deferredFutures} be the result of
    {ExecuteDeferredGroupedFieldSets(objectType, objectValue, variableValues,
    newGroupedFieldSets, false, path, newDeferMap)}.
- Let {futures} be a list containing all members of {supplementalFutures} and
  {deferredFutures}.
- Append all items in {nestedNewPendingResults} and {nestedFutures} to
  {newPendingResults} and {futures}.
- Return {data}, {newPendingResults}, and {futures}.

GetNewDeferredFragments(newDeferUsages, path, deferMap):

- If {newDeferUsages} is empty:
  - Return {deferMap}.
- Initialize {newDeferredFragments} to an empty list.
- Let {newDeferMap} be a new unordered map of Defer Usage records to Deferred
  Fragment records containing all of the entries in {deferMap}.
- For each {deferUsage} in {newDeferUsages}:
  - Let {parentDeferUsage} be the corresponding entry on {deferUsage}.
  - Let {parent} be the entry in {deferMap} for {parentDeferUsage}.
  - Let {label} be the corresponding entry on {deferUsage}.
  - Let {newDeferredFragment} be an unordered map containing {parent}, {path}
    and {label}.
  - Append {newDeferredFragment} to {newDeferredFragments}.
  - Set the entry for {deferUsage} in {newDeferMap} to {newDeferredFragment}.
- Return {newDeferredFragments} and {newDeferMap}.

ExecuteDeferredGroupedFieldSets(objectType, objectValue, variableValues,
newGroupedFieldSets, supplemental, path, deferMap):

- Initialize {futures} to an empty list.
- For each {deferUsageSet} and {groupedFieldSet} in {newGroupedFieldSets}:
  - Let {deferredFragments} be an empty list.
  - For each {deferUsage} in {deferUsageSet}:
    - Let {deferredFragment} be the entry for {deferUsage} in {deferMap}.
    - Append {deferredFragment} to {deferredFragments}.
  - Let {future} represent the future execution of
    {ExecuteDeferredGroupedFieldSet(groupedFieldSet, objectType, objectValue,
    variableValues, deferredFragments, path, deferUsageSet, deferMap)},
    incrementally completing {deferredFragments}.
    - Let {deferredFragments} be the list of Deferred Fragments incrementally
      completed by {future}.
    - If {supplemental} is {true} and any Deferred Fragment in
      {deferredFragments} has been released as pending, initiate {future}.
    - Otherwise, initiate {future} as soon as any Deferred Fragment in
      {deferredFragments} is released as pending, or, if early execution of
      deferred fields is desired, following any implementation specific deferral
      of further execution.
  - Append {future} to {futures}.
- Return {futures}.

ExecuteDeferredGroupedFieldSet(groupedFieldSet, objectType, objectValue,
variableValues, path, deferUsageSet, deferMap):

- Let {data}, {newPendingResults}, and {futures} be the result of running
  {ExecuteGroupedFieldSet(groupedFieldSet, objectType, objectValue,
  variableValues, path, deferUsageSet, deferMap)} _normally_ (allowing
  parallelization).
- Let {errors} be the list of all _field error_ raised while executing the
  {groupedFieldSet}.
- Let {deferredResult} be an unordered map containing {path},
  {deferredFragments}, {data}, {errors}, {newPendingResults}, and {futures}.
- Return {deferredResult}.

## Executing a Grouped Field Set

To execute a grouped field set, the object value being evaluated and the object
type need to be known, as well as whether it must be executed serially, or may
be executed in parallel.

Each represented field in the grouped field set produces an entry into a
response map.

ExecuteGroupedFieldSet(groupedFieldSet, objectType, objectValue, variableValues,
path, deferUsageSet, deferMap):

- Initialize {resultMap} to an empty ordered map.
- Initialize {newPendingResults} and {futures} to empty lists.
- For each {groupedFieldSet} as {responseKey} and {fields}:
  - Let {fieldName} be the name of the first entry in {fields}. Note: This value
    is unaffected if an alias is used.
  - Let {fieldType} be the return type defined for the field {fieldName} of
    {objectType}.
  - If {fieldType} is defined:
    - Let {responseValue}, {fieldNewPendingResults}, and {fieldFutures} be the
      result of {ExecuteField(objectType, objectValue, fieldType, fields,
      variableValues, path)}.
    - Set {responseValue} as the value for {responseKey} in {resultMap}.
    - Append all items in {fieldNewPendingResults} and {fieldFutures} to
      {newPendingResults} and {futures}, respectively.
- Return {resultMap}, {newPendingResults}, and {futures}.

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
streamed sections of the subsection may be executed in parallel.

## Executing Fields

Each field requested in the grouped field set that is defined on the selected
objectType will result in an entry in the response map. Field execution first
coerces any provided argument values, then resolves a value for the field, and
finally completes that value either by recursively executing another selection
set or coercing a scalar value.

ExecuteField(objectType, objectValue, fieldType, fieldDetailsList,
variableValues, path, deferUsageSet, deferMap):

- Let {fieldDetails} be the first entry in {fieldDetailsList}.
- Let {node} be the corresponding entry on {fieldDetails}.
- Let {fieldName} be the field name of {node}.
- Append {fieldName} to {path}.
- Let {argumentValues} be the result of {CoerceArgumentValues(objectType, field,
  variableValues)}
- Let {resolvedValue} be {ResolveFieldValue(objectType, objectValue, fieldName,
  argumentValues)}.
- Return the result of {CompleteValue(fieldType, fields, resolvedValue,
  variableValues, path, deferUsageSet, deferMap)}.

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

CompleteValue(fieldType, fieldDetailsList, result, variableValues, path,
deferUsageSet, deferMap):

- If the {fieldType} is a Non-Null type:
  - Let {innerType} be the inner type of {fieldType}.
  - Let {completedResult}, {newPendingResults}, and {futures} be the result of
    calling {CompleteValue(innerType, fields, result, variableValues, path)}.
  - If {completedResult} is {null}, raise a _field error_.
  - Return {completedResult}, {newPendingResults}, and {futures}.
- If {result} is {null} (or another internal value similar to {null} such as
  {undefined}), return {null}.
- If {fieldType} is a List type:
  - Initialize {newPendingResults} and {futures} to empty lists.
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
      - Let {streamFieldDetails} be the result of
        {GetStreamFieldDetailsList(fieldDetailsList)}.
      - Let {future} represent the future execution of
        {ExecuteStreamField(stream, iterator, streamFieldDetailsList, index,
        innerType, variableValues)}.
      - If early execution of streamed fields is desired:
        - Following any implementation specific deferral of further execution,
          initiate {future}.
      - Append {future} to {futures}.
      - Return {items}, {newPendingResults}, and {futures}.
    - Wait for the next item from {result} via the {iterator}.
    - If an item is not retrieved because of an error, raise a _field error_.
    - Let {item} be the item retrieved from {result}.
    - Let {itemPath} be {path} with {index} appended.
    - Let {completedItem}, {itemNewPendingResults}, and {itemFutures} be the
      result of calling {CompleteValue(innerType, fields, item, variableValues,
      itemPath)}.
    - Append {completedItem} to {items}.
    - Append all items in {itemNewPendingResults}, and {itemFutures} to
      {newPendingResults}, and {futures}, respectively.
  - Return {items}, {newPendingResults}, and {futures}.
- If {fieldType} is a Scalar or Enum type:
  - Return the result of {CoerceResult(fieldType, result)}.
- If {fieldType} is an Object, Interface, or Union type:
  - If {fieldType} is an Object type.
    - Let {objectType} be {fieldType}.
  - Otherwise if {fieldType} is an Interface or Union type.
    - Let {objectType} be {ResolveAbstractType(fieldType, result)}.
  - Let {groupedFieldSet} and {newDeferUsages} be the result of calling
    {CollectSubfields(objectType, fieldDetailsList, variableValues)}.
  - Let {fieldPlan} be the result of {BuildFieldPlan(groupedFieldSet,
    deferUsageSet)}.
  - Return the result of {ExecuteFieldPlan(newDeferUsages, fieldPlan,
    objectType, result, variableValues, false, path, deferUsageSet, deferMap)}.

GetStreamFieldDetailsList(fieldDetailsList):

- Let {streamFields} be an empty list.
- For each {fieldDetails} in {fieldDetailsList}:
  - Let {node} be the corresponding entry on {fieldDetails}.
  - Let {newFieldDetails} be a new Field Details record created from {node}.
  - Append {newFieldDetails} to {streamFields}.
- Return {streamFields}.

#### Execute Stream Field

ExecuteStreamField(stream, iterator, fieldDetailsList, index, innerType,
variableValues):

- Let {path} be the corresponding entry on {stream}.
- Let {itemPath} be {path} with {index} appended.
- Wait for the next item from {iterator}.
- If {iterator} is closed, complete this data stream and return.
- Let {item} be the next item retrieved via {iterator}.
- Let {nextIndex} be {index} plus one.
- Let {completedItem}, {newPendingResults}, and {futures} be the result of
  {CompleteValue(innerType, fields, item, variableValues, itemPath)}.
- Initialize {items} to an empty list.
- Append {completedItem} to {items}.
- Let {errors} be the list of all _field error_ raised while completing the
  item.
- Let {future} represent the future execution of {ExecuteStreamField(stream,
  path, iterator, fieldDetailsList, nextIndex, innerType, variableValues)}.
- If early execution of streamed fields is desired:
  - Following any implementation specific deferral of further execution,
    initiate {future}.
- Append {future} to {futures}.
- Let {streamedItems} be an unordered map containing {stream}, {items} {errors},
  {newPendingResults}, and {futures}.
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

CollectSubfields(objectType, fieldDetailsList, variableValues):

- Initialize {groupedFieldSet} to an empty ordered map of lists.
- Initialize {newDeferUsages} to an empty list.
- For each {fieldDetails} in {fieldDetailsList}:
  - Let {field} and {deferUsage} be the corresponding entries on {fieldDetails}.
  - Let {fieldSelectionSet} be the selection set of {field}.
  - If {fieldSelectionSet} is null or empty, continue to the next field.
  - Let {subGroupedFieldSet} and {subNewDeferUsages} be the result of
    {CollectFields(objectType, fieldSelectionSet, variableValues, deferUsage)}.
  - For each {subGroupedFieldSet} as {responseKey} and {subfields}:
    - Let {groupForResponseKey} be the list in {groupedFieldSet} for
      {responseKey}; if no such list exists, create it as an empty list.
    - Append all fields in {subfields} to {groupForResponseKey}.
  - Append all defer usages in {subNewDeferUsages} to {newDeferUsages}.
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

When a field error is raised inside `ExecuteDeferredGroupedFieldSet` or
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
