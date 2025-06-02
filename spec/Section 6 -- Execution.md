# Execution

A GraphQL service generates a response from a request via execution.

:: A _request_ for execution consists of a few pieces of information:

- {schema}: The schema to use, typically solely provided by the GraphQL service.
- {document}: A {Document} which must contain GraphQL {OperationDefinition} and
  may contain {FragmentDefinition}.
- {operationName} (optional): The name of the Operation in the Document to
  execute.
- {variableValues} (optional): Values for any Variables defined by the
  Operation.
- {initialValue} (optional): An initial value corresponding to the root type
  being executed. Conceptually, an initial value represents the "universe" of
  data available via a GraphQL Service. It is common for a GraphQL Service to
  always use the same initial value for every request.
- {extensions} (optional): A map reserved for implementation-specific additional
  information.

Given this information, the result of {ExecuteRequest(schema, document,
operationName, variableValues, initialValue)} produces the response, to be
formatted according to the Response section below.

Implementations should not add additional properties to a _request_, which may
conflict with future editions of the GraphQL specification. Instead,
{extensions} provides a reserved location for implementation-specific additional
information. If present, {extensions} must be a map, but there are no additional
restrictions on its contents. To avoid conflicts, keys should use unique
prefixes.

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
  - Otherwise if {hasValue} is {true}:
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
executing the operation’s top level _selection set_ with the query root
operation type.

An initial value may be provided when executing a query operation.

ExecuteQuery(query, schema, variableValues, initialValue):

- Let {queryType} be the root Query type in {schema}.
- Assert: {queryType} is an Object type.
- Let {selectionSet} be the top level selection set in {query}.
- Let {data} be the result of running {ExecuteSelectionSet(selectionSet,
  queryType, initialValue, variableValues)} _normally_ (allowing
  parallelization).
- Let {errors} be the list of all _execution error_ raised while executing the
  selection set.
- Return an unordered map containing {data} and {errors}.

### Mutation

If the operation is a mutation, the result of the operation is the result of
executing the operation’s top level _selection set_ on the mutation root object
type. This selection set should be executed serially.

It is expected that the top level fields in a mutation operation perform
side-effects on the underlying data system. Serial execution of the provided
mutations ensures against race conditions during these side-effects.

ExecuteMutation(mutation, schema, variableValues, initialValue):

- Let {mutationType} be the root Mutation type in {schema}.
- Assert: {mutationType} is an Object type.
- Let {selectionSet} be the top level selection set in {mutation}.
- Let {data} be the result of running {ExecuteSelectionSet(selectionSet,
  mutationType, initialValue, variableValues)} _serially_.
- Let {errors} be the list of all _execution error_ raised while executing the
  selection set.
- Return an unordered map containing {data} and {errors}.

### Subscription

If the operation is a subscription, the result is an _event stream_ called the
_response stream_ where each event in the event stream is the result of
executing the operation for each new event on an underlying _source stream_.

Executing a subscription operation creates a persistent function on the service
that maps an underlying _source stream_ to a returned _response stream_.

Subscribe(subscription, schema, variableValues, initialValue):

- Let {sourceStream} be the result of running
  {CreateSourceEventStream(subscription, schema, variableValues, initialValue)}.
- Let {responseStream} be the result of running
  {MapSourceToResponseEvent(sourceStream, subscription, schema,
  variableValues)}.
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

:: An _event stream_ represents a sequence of events: discrete emitted values
over time which can be observed. As an example, a "Pub-Sub" system may produce
an _event stream_ when "subscribing to a topic", with an value emitted for each
"publish" to that topic.

An _event stream_ may complete at any point, often because no further events
will occur. An _event stream_ may emit an infinite sequence of values, in which
it may never complete. If an _event stream_ encounters an error, it must
complete with that error.

An observer may at any point decide to stop observing an _event stream_ by
cancelling it. When an _event stream_ is cancelled, it must complete.

Internal user code also may cancel an _event stream_ for any reason, which would
be observed as that _event stream_ completing.

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

:: A _source stream_ is an _event stream_ representing a sequence of root
values, each of which will trigger a GraphQL execution. Like field value
resolution, the logic to create a _source stream_ is application-specific.

CreateSourceEventStream(subscription, schema, variableValues, initialValue):

- Let {subscriptionType} be the root Subscription type in {schema}.
- Assert: {subscriptionType} is an Object type.
- Let {selectionSet} be the top level selection set in {subscription}.
- Let {groupedFieldSet} be the result of {CollectFields(subscriptionType,
  selectionSet, variableValues)}.
- If {groupedFieldSet} does not have exactly one entry, raise a _request error_.
- Let {fields} be the value of the first entry in {groupedFieldSet}.
- Let {fieldName} be the name of the first entry in {fields}. Note: This value
  is unaffected if an alias is used.
- Let {field} be the first entry in {fields}.
- Let {argumentValues} be the result of {CoerceArgumentValues(subscriptionType,
  field, variableValues)}.
- Let {sourceStream} be the result of running
  {ResolveFieldEventStream(subscriptionType, initialValue, fieldName,
  argumentValues)}.
- Return {sourceStream}.

ResolveFieldEventStream(subscriptionType, rootValue, fieldName, argumentValues):

- Let {resolver} be the internal function provided by {subscriptionType} for
  determining the resolved _event stream_ of a subscription field named
  {fieldName}.
- Return the result of calling {resolver}, providing {rootValue} and
  {argumentValues}.

Note: This {ResolveFieldEventStream()} algorithm is intentionally similar to
{ResolveFieldValue()} to enable consistency when defining resolvers on any
operation type.

#### Response Stream

Each event from the underlying _source stream_ triggers execution of the
subscription _selection set_ using that event's value as the {initialValue}.

MapSourceToResponseEvent(sourceStream, subscription, schema, variableValues):

- Let {responseStream} be a new _event stream_.
- When {sourceStream} emits {sourceValue}:
  - Let {response} be the result of running
    {ExecuteSubscriptionEvent(subscription, schema, variableValues,
    sourceValue)}.
  - If internal {error} was raised:
    - Cancel {sourceStream}.
    - Complete {responseStream} with {error}.
  - Otherwise emit {response} on {responseStream}.
- When {sourceStream} completes normally:
  - Complete {responseStream} normally.
- When {sourceStream} completes with {error}:
  - Complete {responseStream} with {error}.
- When {responseStream} is cancelled:
  - Cancel {sourceStream}.
  - Complete {responseStream} normally.
- Return {responseStream}.

Note: Since {ExecuteSubscriptionEvent()} handles all _execution error_, and
_request error_ only occur during {CreateSourceEventStream()}, the only
remaining error condition handled from {ExecuteSubscriptionEvent()} are internal
exceptional errors not described by this specification.

ExecuteSubscriptionEvent(subscription, schema, variableValues, initialValue):

- Let {subscriptionType} be the root Subscription type in {schema}.
- Assert: {subscriptionType} is an Object type.
- Let {selectionSet} be the top level selection set in {subscription}.
- Let {data} be the result of running {ExecuteSelectionSet(selectionSet,
  subscriptionType, initialValue, variableValues)} _normally_ (allowing
  parallelization).
- Let {errors} be the list of all _execution error_ raised while executing the
  selection set.
- Return an unordered map containing {data} and {errors}.

Note: The {ExecuteSubscriptionEvent()} algorithm is intentionally similar to
{ExecuteQuery()} since this is how each event result is produced.

#### Unsubscribe

Unsubscribe cancels the _response stream_ when a client no longer wishes to
receive payloads for a subscription. This in turn also cancels the Source
Stream, which is a good opportunity to clean up any other resources used by the
subscription.

Unsubscribe(responseStream):

- Cancel {responseStream}.

## Executing Selection Sets

To execute a _selection set_, the object value being evaluated and the object
type need to be known, as well as whether it must be executed serially, or may
be executed in parallel.

First, the selection set is turned into a grouped field set; then, each
represented field in the grouped field set produces an entry into a result map.

ExecuteSelectionSet(selectionSet, objectType, objectValue, variableValues):

- Let {groupedFieldSet} be the result of {CollectFields(objectType,
  selectionSet, variableValues)}.
- Initialize {resultMap} to an empty ordered map.
- For each {groupedFieldSet} as {responseName} and {fields}:
  - Let {fieldName} be the name of the first entry in {fields}. Note: This value
    is unaffected if an alias is used.
  - Let {fieldType} be the return type defined for the field {fieldName} of
    {objectType}.
  - If {fieldType} is defined:
    - Let {responseValue} be {ExecuteField(objectType, objectValue, fieldType,
      fields, variableValues)}.
    - Set {responseValue} as the value for {responseName} in {resultMap}.
- Return {resultMap}.

Note: {resultMap} is ordered by which fields appear first in the operation. This
is explained in greater detail in the Field Collection section below.

**Errors and Non-Null Types**

<a name="sec-Executing-Selection-Sets.Errors-and-Non-Null-Fields">
  <!-- Legacy link, this section was previously titled "Errors and Non-Null Fields" -->
</a>

If during {ExecuteSelectionSet()} a _response position_ with a non-null type
raises an _execution error_ then that error must propagate to the parent
response position (the entire selection set in the case of a field, or the
entire list in the case of a list position), either resolving to {null} if
allowed or being further propagated to a parent response position.

If this occurs, any sibling response positions which have not yet executed or
have not yet yielded a value may be cancelled to avoid unnecessary work.

Note: See [Handling Execution Errors](#sec-Handling-Execution-Errors) for more
about this behavior.

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

For example, given the following mutation operation, the root _selection set_
must be executed serially:

```graphql example
mutation ChangeBirthdayAndAddress($newBirthday: String!, $newAddress: String!) {
  changeBirthday(birthday: $newBirthday) {
    month
  }
  changeAddress(address: $newAddress) {
    street
  }
}
```

Therefore the executor must, in serial:

- Run {ExecuteField()} for `changeBirthday`, which during {CompleteValue()} will
  execute the `{ month }` sub-selection set normally.
- Run {ExecuteField()} for `changeAddress`, which during {CompleteValue()} will
  execute the `{ street }` sub-selection set normally.

As an illustrative example, let's assume we have a mutation field
`changeTheNumber` that returns an object containing one field, `theNumber`. If
we execute the following _selection set_ serially:

```graphql example
# Note: This is a selection set, not a full document using the query shorthand.
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

A correct executor must generate the following result for that _selection set_:

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

Before execution, the _selection set_ is converted to a grouped field set by
calling {CollectFields()}. Each entry in the grouped field set is a list of
fields that share a _response name_ (the alias if defined, otherwise the field
name). This ensures all fields with the same response name (including those in
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
    - Let {responseName} be the _response name_ of {selection} (the alias if
      defined, otherwise the field name).
    - Let {groupForResponseName} be the list in {groupedFields} for
      {responseName}; if no such list exists, create it as an empty list.
    - Append {selection} to the {groupForResponseName}.
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
    - If {DoesFragmentTypeApply(objectType, fragmentType)} is {false}, continue
      with the next {selection} in {selectionSet}.
    - Let {fragmentSelectionSet} be the top-level selection set of {fragment}.
    - Let {fragmentGroupedFieldSet} be the result of calling
      {CollectFields(objectType, fragmentSelectionSet, variableValues,
      visitedFragments)}.
    - For each {fragmentGroup} in {fragmentGroupedFieldSet}:
      - Let {responseName} be the response name shared by all fields in
        {fragmentGroup}.
      - Let {groupForResponseName} be the list in {groupedFields} for
        {responseName}; if no such list exists, create it as an empty list.
      - Append all items in {fragmentGroup} to {groupForResponseName}.
  - If {selection} is an {InlineFragment}:
    - Let {fragmentType} be the type condition on {selection}.
    - If {fragmentType} is not {null} and {DoesFragmentTypeApply(objectType,
      fragmentType)} is {false}, continue with the next {selection} in
      {selectionSet}.
    - Let {fragmentSelectionSet} be the top-level selection set of {selection}.
    - Let {fragmentGroupedFieldSet} be the result of calling
      {CollectFields(objectType, fragmentSelectionSet, variableValues,
      visitedFragments)}.
    - For each {fragmentGroup} in {fragmentGroupedFieldSet}:
      - Let {responseName} be the response name shared by all fields in
        {fragmentGroup}.
      - Let {groupForResponseName} be the list in {groupedFields} for
        {responseName}; if no such list exists, create it as an empty list.
      - Append all items in {fragmentGroup} to {groupForResponseName}.
- Return {groupedFields}.

DoesFragmentTypeApply(objectType, fragmentType):

- If {fragmentType} is an Object Type:
  - If {objectType} and {fragmentType} are the same type, return {true},
    otherwise return {false}.
- If {fragmentType} is an Interface Type:
  - If {objectType} is an implementation of {fragmentType}, return {true}
    otherwise return {false}.
- If {fragmentType} is a Union:
  - If {objectType} is a possible type of {fragmentType}, return {true}
    otherwise return {false}.

Note: The steps in {CollectFields()} evaluating the `@skip` and `@include`
directives may be applied in either order since they apply commutatively.

## Executing Fields

Each field requested in the grouped field set that is defined on the selected
objectType will result in an entry in the result map. Field execution first
coerces any provided argument values, then resolves a value for the field, and
finally completes that value either by recursively executing another selection
set or coercing a scalar value.

ExecuteField(objectType, objectValue, fieldType, fields, variableValues):

- Let {field} be the first entry in {fields}.
- Let {fieldName} be the field name of {field}.
- Let {argumentValues} be the result of {CoerceArgumentValues(objectType, field,
  variableValues)}.
- Let {resolvedValue} be {ResolveFieldValue(objectType, objectValue, fieldName,
  argumentValues)}.
- Return the result of {CompleteValue(fieldType, fields, resolvedValue,
  variableValues)}.

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
    not {true} or {value} is {null}, raise an _execution error_.
  - Otherwise if {hasValue} is {true}:
    - If {value} is {null}:
      - Add an entry to {coercedValues} named {argumentName} with the value
        {null}.
    - Otherwise, if {argumentValue} is a {Variable}:
      - Add an entry to {coercedValues} named {argumentName} with the value
        {value}.
    - Otherwise:
      - If {value} cannot be coerced according to the input coercion rules of
        {argumentType}, raise an _execution error_.
      - Let {coercedValue} be the result of coercing {value} according to the
        input coercion rules of {argumentType}.
      - Add an entry to {coercedValues} named {argumentName} with the value
        {coercedValue}.
- Return {coercedValues}.

Any _request error_ raised as a result of input coercion during
{CoerceArgumentValues()} should be treated instead as an _execution error_.

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
flow. If the field is of a list type, each value in the collection of values
returned by {resolver} may itself be retrieved asynchronously.

### Value Completion

After resolving the value for a field, it is completed by ensuring it adheres to
the expected return type. If the return type is another Object type, then the
field execution process continues recursively.

CompleteValue(fieldType, fields, result, variableValues):

- If the {fieldType} is a Non-Null type:
  - Let {innerType} be the inner type of {fieldType}.
  - Let {completedResult} be the result of calling {CompleteValue(innerType,
    fields, result, variableValues)}.
  - If {completedResult} is {null}, raise an _execution error_.
  - Return {completedResult}.
- If {result} is {null} (or another internal value similar to {null} such as
  {undefined}), return {null}.
- If {fieldType} is a List type:
  - If {result} is not a collection of values, raise an _execution error_.
  - Let {innerType} be the inner type of {fieldType}.
  - Return a list where each list item is the result of calling
    {CompleteValue(innerType, fields, resultItem, variableValues)}, where
    {resultItem} is each item in {result}.
- If {fieldType} is a Scalar or Enum type:
  - Return the result of {CoerceResult(fieldType, result)}.
- If {fieldType} is an Object, Interface, or Union type:
  - If {fieldType} is an Object type.
    - Let {objectType} be {fieldType}.
  - Otherwise if {fieldType} is an Interface or Union type.
    - Let {objectType} be {ResolveAbstractType(fieldType, result)}.
  - Let {subSelectionSet} be the result of calling {MergeSelectionSets(fields)}.
  - Return the result of evaluating {ExecuteSelectionSet(subSelectionSet,
    objectType, result, variableValues)} _normally_ (allowing for
    parallelization).

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

- Assert: {value} is not {null}.
- Return the result of calling the internal method provided by the type system
  for determining the "result coercion" of {leafType} given the value {value}.
  This internal method must return a valid value for the type and not {null}.
  Otherwise raise an _execution error_.

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

When more than one field of the same name is executed in parallel, the
_selection set_ for each of the fields are merged together when completing the
value in order to continue execution of the sub-selection sets.

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

MergeSelectionSets(fields):

- Let {selectionSet} be an empty list.
- For each {field} in {fields}:
  - Let {fieldSelectionSet} be the selection set of {field}.
  - If {fieldSelectionSet} is null or empty, continue to the next field.
  - Append all selections in {fieldSelectionSet} to {selectionSet}.
- Return {selectionSet}.

### Handling Execution Errors

<a name="sec-Handling-Field-Errors">
  <!-- Legacy link, this section was previously titled "Handling Execution Errors" -->
</a>

An _execution error_ is an error raised during field execution, value resolution
or coercion, at a specific _response position_. While these errors must be
reported in the response, they are "handled" by producing partial {"data"} in
the _response_.

Note: This is distinct from a _request error_ which results in a response with
no data.

If an execution error is raised while resolving a field (either directly or
nested inside any lists), it is handled as though the _response position_ at
which the error occurred resolved to {null}, and the error must be added to the
{"errors"} list in the response.

If the result of resolving a _response position_ is {null} (either due to the
result of {ResolveFieldValue()} or because an execution error was raised), and
that position is of a `Non-Null` type, then an execution error is raised at that
position. The error must be added to the {"errors"} list in the response.

If a _response position_ resolves to {null} because of an execution error which
has already been added to the {"errors"} list in the response, the {"errors"}
list must not be further affected. That is, only one error should be added to
the errors list per _response position_.

Since `Non-Null` response positions cannot be {null}, execution errors are
propagated to be handled by the parent _response position_. If the parent
response position may be {null} then it resolves to {null}, otherwise if it is a
`Non-Null` type, the execution error is further propagated to its parent
_response position_.

If a `List` type wraps a `Non-Null` type, and one of the _response position_
elements of that list resolves to {null}, then the entire list _response
position_ must resolve to {null}. If the `List` type is also wrapped in a
`Non-Null`, the execution error continues to propagate upwards.

If every _response position_ from the root of the request to the source of the
execution error has a `Non-Null` type, then the {"data"} entry in the response
should be {null}.
