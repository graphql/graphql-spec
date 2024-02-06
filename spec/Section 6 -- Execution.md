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
- Let {path} be an empty list.
- Let {eventSourceDeliveryGroup} be a new delivery group with path {path}.
- Let {groupedFieldSet} be the result of {CollectFields(subscriptionType,
  selectionSet, variableValues, path, eventSourceDeliveryGroup)}.
- If {groupedFieldSet} does not have exactly one entry, raise a _request error_.
- Let {fields} be the value of the first entry in {groupedFieldSet}.
- Let {fieldName} be the name of the first entry in {fields}. Note: This value
  is unaffected if an alias is used.
- Let {field} be the first entry in {fields}.
- Let {argumentValues} be the result of {CoerceArgumentValues(subscriptionType,
  field, variableValues)}.
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
  - If {response} is an event stream:
    - For each {childEvent} on {response}:
      - Yield {childEvent}.
  - Otherwise:
    - Yield an event containing {response}.
- When {responseStream} completes: complete this event stream.

ExecuteSubscriptionEvent(subscription, schema, variableValues, initialValue):

- Let {subscriptionType} be the root Subscription type in {schema}.
- Assert: {subscriptionType} is an Object type.
- Let {selectionSet} be the top level Selection Set in {subscription}.
- Return {ExecuteRootSelectionSet(variableValues, initialValue,
  subscriptionType, selectionSet)}.

Note: The {ExecuteSubscriptionEvent()} algorithm is intentionally similar to
{ExecuteQuery()} since this is how each event result is produced.

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

ExecuteRootSelectionSet(variableValues, initialValue, objectType, selectionSet,
serial):

- If {serial} is not provided, initialize it to {false}.
- Let {path} be an empty list.
- Let {rootDeliveryGroup} be a new delivery group with path {path}.
- Let {groupedFieldSet} be the result of {CollectFields(objectType,
  selectionSet, variableValues, path, rootDeliveryGroup)}.
- Let {currentDeliveryGroups} be a set containing {rootDeliveryGroup}.
- Let {data} and {incrementalDetailsByPath} be the result of running
  {ExecuteGroupedFieldSet(groupedFieldSet, objectType, initialValue,
  variableValues, path, currentDeliveryGroups)} _serially_ if {serial} is true,
  _normally_ (allowing parallelization) otherwise.
- Let {errors} be the list of all _field error_ raised while executing the
  selection set.
- If {incrementalDetailsByPath} is empty:
  - Return an unordered map containing {data} and {errors}.
- Otherwise:
  - Return {IncrementalEventStream(data, errors, incrementalDetailsByPath,
    variableValues)}.

## Executing a Grouped Field Set

To execute a grouped field set, the object value being evaluated and the object
type need to be known, as well as whether it must be executed serially, or may
be executed in parallel.

Each represented field in the grouped field set produces an entry into a
response map.

ExecuteGroupedFieldSet(groupedFieldSet, objectType, objectValue, variableValues,
path, currentDeliveryGroups):

- Let {incrementalDetailsByPath} be an empty map.
- Initialize {resultMap} to an empty ordered map.
- For each {groupedFieldSet} as {responseKey} and {fieldDigests}:
  - Let {deliveryGroups} be the set of delivery groups in {fieldDigests}.
  - If {deliveryGroups} contains every delivery group in
    {currentDeliveryGroups}:
    - Let {fieldName} be the name of the field of the first entry in
      {fieldDigests}. Note: This value is unaffected if an alias is used.
    - Let {fieldType} be the return type defined for the field {fieldName} of
      {objectType}.
    - If {fieldType} is defined:
      - Let {childPath} be the result of appending {responseKey} to {path}.
      - Let {responseValue} and {childIncrementalDetailsByPath} be
        {ExecuteField(objectType, objectValue, fieldType, fieldDigests,
        variableValues, childPath, currentDeliveryGroups)}.
      - Set {responseValue} as the value for {responseKey} in {resultMap}.
      - For each {childIncrementalDetailsByPath} as {childPath} and
        {childIncrementalDetails}:
        - Set {childIncrementalDetails} as the value for {childPath} in
          {incrementalDetailsByPath}.
  - Otherwise:
    - Let {details} be the details object in {incrementalDetailsByPath} for
      {path}; if no such details object exists, create it as a details object
      containing {groupedFieldSet} as an empty map, {objectType} and
      {objectValue}.
    - Let {incrementalFieldSet} be the value for property {groupedFieldSet} in
      {details}.
    - Set {fieldDigests} as the value for {responseKey} in
      {incrementalFieldSet}.
- Return {resultMap} and {incrementalDetailsByPath}.

Note: {resultMap} is ordered by which fields appear first in the operation. This
is explained in greater detail in the Field Collection section below.

**Errors and Non-Null Fields**

If during {ExecuteGroupedFieldSet()} a field with a non-null {fieldType} raises
a _field error_ then that error must propagate to this entire selection set,
either resolving to {null} if allowed or further propagated to a parent field.

If this occurs, any sibling fields which have not yet executed or have not yet
yielded a value may be cancelled to avoid unnecessary work.

Note: See [Handling Field Errors](#sec-Handling-Field-Errors) for more about
this behavior.

Further, if this occurs, the {incrementalDetailsByPath} must be made empty.

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

CollectFields(objectType, selectionSet, variableValues, path, deliveryGroup,
visitedFragments):

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
    - Let {fieldDigest} be a new field digest containing {selection} and
      {deliveryGroup}.
    - Append {fieldDigest} to the {groupForResponseKey}.
  - If {selection} is a {FragmentSpread}:
    - Let {fragmentDeliveryGroup} be {deliveryGroup}.
    - If {selection} provides the directive `@defer`, let {deferDirective} be
      that directive.
      - If {deferDirective}'s {if} argument is not {false} and is not a variable
        in {variableValues} with the value {false}:
        - Let {label} be the value of {deferDirective}'s {label} argument (or
          the value of the associated variable) if any.
        - Let {fragmentDeliveryGroup} be a new delivery group with path {path},
          parent {deliveryGroup} and label {label}.
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
      {CollectFields(objectType, fragmentSelectionSet, variableValues, path,
      fragmentDeliveryGroup, visitedFragments)}.
    - For each {fragmentGroup} in {fragmentGroupedFieldSet}:
      - Let {responseKey} be the response key shared by all fields in
        {fragmentGroup}.
      - Let {groupForResponseKey} be the list in {groupedFields} for
        {responseKey}; if no such list exists, create it as an empty list.
      - Append all items in {fragmentGroup} to {groupForResponseKey}.
  - If {selection} is an {InlineFragment}:
    - Let {fragmentDeliveryGroup} be {deliveryGroup}.
    - If {selection} provides the directive `@defer`, let {deferDirective} be
      that directive.
      - If {deferDirective}'s {if} argument is not {false} and is not a variable
        in {variableValues} with the value {false}:
        - Let {label} be the value of {deferDirective}'s {label} argument (or
          the value of the associated variable) if any.
        - Let {fragmentDeliveryGroup} be a new delivery group with path {path},
          parent {deliveryGroup} and label {label}.
    - Let {fragmentType} be the type condition on {selection}.
    - If {fragmentType} is not {null} and {DoesFragmentTypeApply(objectType,
      fragmentType)} is false, continue with the next {selection} in
      {selectionSet}.
    - Let {fragmentSelectionSet} be the top-level selection set of {selection}.
    - Let {fragmentGroupedFieldSet} be the result of calling
      {CollectFields(objectType, fragmentSelectionSet, variableValues, path,
      fragmentDeliveryGroup, visitedFragments)}.
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

## Executing Fields

Each field requested in the grouped field set that is defined on the selected
objectType will result in an entry in the response map. Field execution first
coerces any provided argument values, then resolves a value for the field, and
finally completes that value either by recursively executing another selection
set or coercing a scalar value.

ExecuteField(objectType, objectValue, fieldType, fieldDigests, variableValues,
path, currentDeliveryGroups):

- Let {field} be the first entry in {fieldDigests}.
- Let {fieldName} be the field name of {field}.
- Let {argumentValues} be the result of {CoerceArgumentValues(objectType, field,
  variableValues)}
- Let {resolvedValue} be {ResolveFieldValue(objectType, objectValue, fieldName,
  argumentValues)}.
- Return the result of {CompleteValue(fieldType, fieldDigests, resolvedValue,
  variableValues, path, currentDeliveryGroups)}.

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

ResolveFieldValue(objectType, objectValue, fieldName, argumentValues):

- Let {resolver} be the internal function provided by {objectType} for
  determining the resolved value of a field named {fieldName}.
- Return the result of calling {resolver}, providing {objectValue} and
  {argumentValues}.

Note: It is common for {resolver} to be asynchronous due to relying on reading
an underlying database or networked service to produce a value. This
necessitates the rest of a GraphQL executor to handle an asynchronous execution
flow.

### Value Completion

After resolving the value for a field, it is completed by ensuring it adheres to
the expected return type. If the return type is another Object type, then the
field execution process continues recursively.

CompleteValue(fieldType, fieldDigests, result, variableValues, path,
currentDeliveryGroups):

- If the {fieldType} is a Non-Null type:
  - Let {innerType} be the inner type of {fieldType}.
  - Let {completedResult} and {incrementalDetailsByPath} be the result of
    calling {CompleteValue(innerType, fieldDigests, result, variableValues,
    path, currentDeliveryGroups)}.
  - If {completedResult} is {null}, raise a _field error_.
  - Return {completedResult} and {incrementalDetailsByPath}.
- If {result} is {null} (or another internal value similar to {null} such as
  {undefined}), return {null} and an empty map.
- If {fieldType} is a List type:
  - If {result} is not a collection of values, raise a _field error_.
  - Let {innerType} be the inner type of {fieldType}.
  - Let {incrementalDetailsByPath} be an empty map.
  - Let {list} be an empty list.
    - For each list item {resultItem} at 0-indexed index {resultIndex} in
      {result}:
      - Let {subpath} be the result of appending {resultIndex} to {path}.
      - Let {listValue} and {itemIncrementalDetailsByPath} be the result of
        calling {CompleteValue(innerType, fieldDigests, resultItem,
        variableValues, subpath, currentDeliveryGroups)}.
      - Append {listValue} to {list}.
      - If {listValue} is not {null}:
        - For each {itemIncrementalDetailsByPath} as {childPath} and
          {childIncrementalDetails}:
          - Set {childIncrementalDetails} as the value for {childPath} in
            {incrementalDetailsByPath}.
  - Return {list} and {incrementalDetailsByPath}.
- If {fieldType} is a Scalar or Enum type:
  - Let {completedResult} be the result of {CoerceResult(fieldType, result)}.
  - Return {completedResult} and an empty map.
- If {fieldType} is an Object, Interface, or Union type:
  - If {fieldType} is an Object type.
    - Let {objectType} be {fieldType}.
  - Otherwise if {fieldType} is an Interface or Union type.
    - Let {objectType} be {ResolveAbstractType(fieldType, result)}.
  - Let {groupedFieldSet} be the result of calling {CollectSubfields(objectType,
    fieldDigests, variableValues, path)}.
  - Return the result of evaluating {ExecuteGroupedFieldSet(groupedFieldSet,
    objectType, result, variableValues, path, currentDeliveryGroups)} _normally_
    (allowing for parallelization).

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

CollectSubfields(objectType, fieldDigests, variableValues, path):

- Let {groupedFieldSet} be an empty map.
- For each {fieldDigest} in {fieldDigests}:
  - Let {field} be the field of {fieldDigest}.
  - Let {deliveryGroup} be the delivery group of {fieldDigest}.
  - Let {fieldSelectionSet} be the selection set of {field}.
  - If {fieldSelectionSet} is null or empty, continue to the next field.
  - Let {subGroupedFieldSet} be the result of {CollectFields(objectType,
    fieldSelectionSet, variableValues, path, deliveryGroup)}.
  - For each {subGroupedFieldSet} as {responseKey} and {subfieldDigests}:
    - Let {groupForResponseKey} be the list in {groupedFieldSet} for
      {responseKey}; if no such list exists, create it as an empty list.
    - Append all field digests in {subfieldDigests} to {groupForResponseKey}.
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

If all fields from the root of the request to the source of the field error
return `Non-Null` types, then the {"data"} entry in the response should be
{null}.

## Incremental Delivery

### Delivery Group

::: A _delivery group_ represents either the root selection set or a particular
`@defer` directive at a particular {path} in the response.

::: The _root delivery group_ is the _delivery group_ that represents the root
selection set in the operation.

Each _delivery group_ belongs to a {parent} delivery group, except for the _root
delivery group_. During field collection, the delivery group of each field is
tracked, and this is used when determining when to execute and deliver deferred
fields and streamed list items.

In an operation that does not utilise the `@defer` directive, there will only be
a single delivery group, the _root delivery group_, and all fields will belong
to it.

### Incremental Event Stream

IncrementalEventStream(data, errors, initialIncrementalDetailsByPath,
variableValues):

- Let {incrementalDetailsByPath} be {initialIncrementalDetailsByPath}.
- Return a new event stream {responseStream} which yields events as follows:
  - Let {pendingDeliveryGroups} be
    {CollectDeliveryGroups(incrementalDetailsByPath)}.
  - Assert: {pendingDeliveryGroups} is not empty.
  - Let {pending} be {MakePending(pendingDeliveryGroups)}.
  - Yield an event containing {data}, {errors}, {pending}, and the value {true}
    for {hasNext}.
  - Let {streams} and {runnableDeliveryGroupsSets} be
    {IncrementalStreams(incrementalDetailsByPath)}.
  - For each {event} on each stream in {streams}:
    - Yield {event}.
  - When every stream in {streams} has completed:
    - Yield a map with {hasNext} set to {false}.

In order to increase efficiency, any two or more consecutive payloads in the
IncrementalEventStream stream may optionally be combined by concatenating the
lists therein (maintaining order) and setting {hasNext} to {false} if any of the
payloads has {hasNext} set to {false}, otherwise {true}.

CollectDeliveryGroups(incrementalDetailsByPath, excludingDeliveryGroups):

- If {excludingDeliveryGroups} is not provided, initialize it to the empty set.
- Let {allDeliveryGroup} be an empty set.
- For each {incrementalDetailsByPath} as {path} and {details}:
  - Let {objectType}, {objectValue} and {groupedFieldSet} be those properties in
    {details}.
  - For each {groupedFieldSet} as {responseKey} and {fieldDigests}:
    - For each {fieldDigests} as {fieldDigest}.
      - Let {deliveryGroup} be the delivery group in {fieldDigest}.
      - If {deliveryGroup} is not in {excludingDeliveryGroups}:
        - Add {deliveryGroup} to {allDeliveryGroups}.
- Return {allDeliveryGroups}.

MakePending(deliveryGroups):

- Let {pending} be an empty list.
- For each {deliveryGroups} as {deliveryGroup}:
  - Let {id}, {path} and {label} be those properties in {deliveryGroup}.
  - Let {pendingPayload} be an unordered map containing {id}, {path}, {label}.
  - Append {pendingPayload} to {pending}.
- Return {pending}.

IncrementalStreams(incrementalDetailsByPath):

- Let {streams} be an empty list.
- Let {runnableDeliveryGroupsSets} be the result of
  {PartitionDeliveryGroupsSets(incrementalDetailsByPath)}.
- For each {runnableDeliveryGroupsSets} as {runnableDeliveryGroupsSet}:
  - Let {stream} be {IncrementalStream(incrementalDetailsByPath,
    runnableDeliveryGroupsSet)}.
  - Append {stream} to {streams}.
- Return {streams} and {runnableDeliveryGroupsSets}.

PartitionDeliveryGroupsSets(incrementalDetailsByPath):

- Let {graph} be an empty graph, where the nodes are delivery groups.
- For each {incrementalDetailsByPath} as {path} and {details}:
  - Let {objectType}, {objectValue} and {groupedFieldSet} be those properties in
    {details}.
  - For each {groupedFieldSet} as {responseKey} and {fieldDigests}:
    - Let {deliveryGroupsSet} be the set containing the delivery group from each
      digest in {fieldDigests}.
    - Add each {deliveryGroup} in {deliveryGroupsSet} as a node to the {graph}
      (if it's not already present).
    - For each pair of delivery groups {deliveryGroup1} and {deliveryGroup2} in
      {deliveryGroupsSet}:
      - Ensure {deliveryGroup1} and {deliveryGroup2} are connected in {graph}.
- Let {partitionedDeliveryGroupsSets} be an empty unordered list.
- For each connected {subgraph} in {graph}:
  - Let {deliveryGroupsSet} be the delivery groups in {subgraph}.
  - Add {deliveryGroupsSet} to {partitionedDeliveryGroupsSets}.
- Assert: every {deliveryGroup} in {graph} must appear in exactly one set in
  {partitionedDeliveryGroupsSets}.
- Return {partitionedDeliveryGroupsSets}.

IncrementalStream(incrementalDetailsByPath, deliveryGroupsSet):

- Let {remainingIncrementalDetailsByPath}, {runnable} be
  {SplitRunnable(incrementalDetailsByPath, deliveryGroupsSet)}.
- Let {hasNext} be {true}.
- Return a new event stream {incrementalStream} which yields events as follows:
  - In the event of one or more errors, {errors}:
    - Let {completed} be an empty list.
    - For each {deliveryGroupsSet} as {deliveryGroup}:
      - {id} be the id of {deliveryGroup}.
      - Append an unordered map containing {id} and {errors} to {completed}.
    - Yield an unordered map containing {hasNext} and {completed}.
    - Complete {incrementalStream}.
    - Return.
  - Let {incremental} be an empty list.
  - For each {runnable} as {path} and {incrementalDetails} (in parallel):
    - Let {objectType}, {objectValue} and {groupedFieldSet} be those properties
      in {incrementalDetails}.
    - Assert: {objectValue} exists and is not {null}.
    - Let {data} and {childIncrementalDetailsByPath} be the result of running
      {ExecuteGroupedFieldSet(groupedFieldSet, objectType, objectValue,
      variableValues, path, deliveryGroups)} _normally_ (allowing
      parallelization).
    - Let {errors} be the list of all _field error_ raised while executing the
      grouped field set.
    - Let {remainingIncrementalDetailsByPath} be
      {MergeIncrementalDetailsByPath(remainingIncrementalDetailsByPath,
      childIncrementalDetailsByPath)}.
    - Append an unordered map containing {hasNext}, {id}, {data} and {errors} to
      {incremental}.
  - Let {pendingDeliveryGroups} be
    {CollectDeliveryGroups(remainingIncrementalDetailsByPath,
    deliveryGroupsSet)}.
  - Let {pending} be {MakePending(pendingDeliveryGroups)}.
  - Let {sentInitial} be {false}.
  - Let {streams} and {runnableDeliveryGroupsSets} be
    {IncrementalStreams(remainingIncrementalDetailsByPath)}.
  - For each {deliveryGroupsSet} as {deliveryGroup}:
    - If {deliveryGroup} is not contained in any delivery group set in
      {runnableDeliveryGroupsSets}:
      - If {sentInitial} is not {true}:
        - Let {sentInitial} be {true}.
        - Yield an unordered map containing {hasNext}, {incremental} and
          {pending}.
      - Let {id} be the id of {deliveryGroup}.
      - Let {completedItem} be an unordered map containing {id}.
      - Let {completed} be a list containing {completedItem}.
      - Yield an unordered map containing {hasNext} and {completed}.
  - For each {event} on each stream in {streams}:
    - If {sentInitial} is not {true}:
      - Let {sentInitial} be {true}.
      - Yield an unordered map containing {hasNext}, {incremental} and
        {pending}.
    - Yield {event}.
  - When every stream in {streams} has completed:
    - Complete {incrementalStreams}.

SplitRunnable(incrementalDetailsByPath, runnableDeliveryGroupsSet):

- Let {remainingIncrementalDetailsByPath} be an empty map.
- Let {runnable} be an empty map.
- For each {incrementalDetailsByPath} as {path} and {incrementalDetails}:
  - Let {objectType}, {objectValue} and {groupedFieldSet} be those properties in
    {incrementalDetails}.
  - For each {groupedFieldSet} as {responseKey} and {fieldDigests}:
    - Let {deliveryGroups} be the set containing the delivery group from each
      digest in {fieldDigests}.
    - If {deliveryGroups} contains the same number and set of delivery groups as
      {runnableDeliveryGroupsSet} (order unimportant):
      - Let {targetIncrementalDetails} be the incremental details object in
        {runnable} for {path}; if no such object exists, create it with
        {objectType}, {objectValue}, and an empty {fieldDigests} map.
    - Otherwise, if {deliveryGroups} only contains delivery groups that are also
      in {runnableDeliveryGroupsSet}:
      - Let {targetIncrementalDetails} be the incremental details object in
        {remainingIncrementalDetailsByPath} for {path}; if no such object
        exists, create it with {objectType}, {objectValue}, and an empty
        {fieldDigests} map.
    - Otherwise:
      - Continue with the next {responseKey} and {fieldDigests} in
        {groupedFieldSet}.
    - Let {targetGroupedFieldSet} be the {groupedFieldSet} property of
      {targetIncrementalDetails}.
    - Set {fieldDigests} as the value for {responseKey} in
      {targetGroupedFieldSet}.
- Return {remainingIncrementalDetailsByPath} and {runnable}.

MergeIncrementalDetailsByPath(incrementalDetailsByPath1,
incrementalDetailsByPath2):

- Let {incrementalDetailsByPath} be a copy of {incrementalDetailsByPath1}.
- For each {incrementalDetailsByPath2} as {path} and {newIncrementalDetails}:
  - Let {originalIncrementalDetails} be the value for {path} in
    {incrementalDetailsByPath}, or {null} if no such entry exists.
  - If {originalIncrementalDetails} is null:
    - Set {newIncrementalDetails} as the value for {path} in
      {incrementalDetailsByPath}.
  - Otherwise:
    - Let {originalGroupedFieldSet} be the grouped field set in
      {originalIncrementalDetails}.
    - Let {newGroupedFieldSet} be the grouped field set in
      {newIncrementalDetails}.
    - For each {newGroupedFieldSet} as {responseKey} and {newFieldDigests}:
      - Let {fieldDigests} be the value for {responseKey} in
        {originalGroupedFieldSet}; or if no such entry is found, create it as
        the empty set.
      - Add every entry in {newFieldDigests} to {fieldDigests}.
- Return {incrementalDetailsByPath}.
