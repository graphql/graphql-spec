# Execution

该部分介绍的是 GraphQL 如何根据request生成 response。

This section describes how GraphQL generates a response from a request.

## Evaluating requests

要评估一个request请求，执行器必须有一个已经解析好的‘Document’(就像该规范“Query Language”部分所定义的)和一个选定的operation
 name来运行是否该document定义了多个operation。

To evaluate a request, the executor must have a parsed `Document` (as defined
in the “Query Language” part of this spec) and a selected operation name to
run if the document defines multiple operations.

执行器应根据给定的operation name 找到 ‘Document’中的 ‘Operation’。如果没有这样的operation 存在，执行器应抛出一个错误。如果找到了operation，请求评估的结果应
该是按照“Evaluating operation”章节对operation评估的结果。

The executor should find the `Operation` in the `Document` with the given
operation name. If no such operation exists, the executor should throw an
error. If the operation is found, then the result of evaluating the request
should be the result of evaluating the operation according to the “Evaluating
operations” section.

## Evaluating operations

正如该规范“Type System”中介绍的 Type System必须有一个“Query Root” and a “Mutation Root” object.

The type system, as described in the “Type System” part of the spec, must
provide a “Query Root” and a “Mutation Root” object.

如果operation 是一个mutation，operation的结果也就是对 “Mutation Root”对象上的mutation 顶级selection set的评估结果。
应该按顺序对该selection set进行评估。

If the operation is a mutation, the result of the operation is the result of
evaluating the mutation’s top level selection set on the “Mutation Root”
object. This selection set should be evaluated serially.

如果operation 是一个query，operation的结果也就是对 “Query Root” object对象上query 顶级selection set的评估结果。

If the operation is a query, the result of the operation is the result of
evaluating the query’s top level selection set on the “Query Root” object.

## Evaluating selection sets

要评估一个  selection set，执行器需要知道它所评估的这个set的对象是什么，以及是否正在按顺序评估。

To evaluate a selection set, the executor needs to know the object on which it
is evaluating the set and whether it is being evaluated serially.

如果待评估的selection set的对象是 ‘null’，那么 该selection set的评估结果也是 ‘null’。

If the selection set is being evaluated on the `null` object, then the result
of evaluating the selection set is `null`.

否则，该selection set也就变成了一个grouped field set；grouped field set中的每个field 都是拥有同一个 responseKey的field的列表。

Otherwise, the selection set is turned into a grouped field set; each entry in
the grouped field set is a list of fields that share a responseKey.

初始化一个空的list作为`visitedFragments`， 调用`CollectFields` 将selection set  转换成grouped field set 。

The selection set is converted to a grouped field set by calling
`CollectFields`, initializing `visitedFragments` to an empty list.

CollectFields(objectType, selectionSet, visitedFragments):

  * Initialize {groupedFields} to an empty list of lists.
  * For each {selection} in {selectionSet};
    * If {selection} provides the directive `@skip`, let {skipDirective} be that directive.
      * If {skipDirective}'s {if} argument is {true}, continue with the
        next {selection} in {selectionSet}.
    * If {selection} provides the directive `@include`, let {includeDirective} be that directive.
      * If {includeDirective}'s {if} argument is {false}, continue with the
        next {selection} in {selectionSet}.
    * If {selection} is a Field:
      * Let {responseKey} be the response key of {selection}.
      * Let {groupForResponseKey} be the list in {groupedFields} for
        {responseKey}; if no such list exists, create it as an empty list.
      * Append {selection} to the {groupForResponseKey}.
    * If {selection} is a FragmentSpread:
      * Let {fragmentSpreadName} be the name of {selection}.
      * If {fragmentSpreadName} is in {visitedFragments}, continue with the
        next {selection} in {selectionSet}.
      * Add {fragmentSpreadName} to {visitedFragments}.
      * Let {fragment} be the Fragment in the current Document whose name is
        {fragmentSpreadName}.
      * If no such {fragment} exists, continue with the next {selection} in
        {selectionSet}.
      * Let {fragmentType} be the type condition on {fragment}.
      * If {doesFragmentTypeApply(objectType, fragmentType)} is false, continue
        with the next {selection} in {selectionSet}.
      * Let {fragmentSelectionSet} be the top-level selection set of {fragment}.
      * Let {fragmentGroupedFields} be the result of calling
        {CollectFields(objectType, fragmentSelectionSet)}.
      * For each {fragmentGroup} in {fragmentGroupedFields}:
        * Let {responseKey} be the response key shared by all fields in {fragmentGroup}
        * Let {groupForResponseKey} be the list in {groupedFields} for
          {responseKey}; if no such list exists, create it as an empty list.
        * Append all items in {fragmentGroup} to {groupForResponseKey}.
    * If {selection} is an inline fragment:
      * Let {fragmentType} be the type condition on {selection}.
      * If {doesFragmentTypeApply(objectType, fragmentType)} is false, continue
        with the next {selection} in {selectionSet}.
      * Let {fragmentSelectionSet} be the top-level selection set of {selection}.
      * Let {fragmentGroupedFields} be the result of calling {CollectFields(objectType, fragmentSelectionSet)}.
      * For each {fragmentGroup} in {fragmentGroupedFields}:
        * Let {responseKey} be the response key shared by all fields in {fragmentGroup}
        * Let {groupForResponseKey} be the list in {groupedFields} for
          {responseKey}; if no such list exists, create it as an empty list.
        * Append all items in {fragmentGroup} to {groupForResponseKey}.
  * Return {groupedFields}.

doesFragmentTypeApply(objectType, fragmentType):

  * If {fragmentType} is an Object Type:
    * if {objectType} and {fragmentType} are the same type, return {true}, otherwise return {false}.
  * If {fragmentType} is an Interface Type:
    * if {objectType} is an implementation of {fragmentType}, return {true} otherwise return {false}.
  * If {fragmentType} is a Union:
    * if {objectType} is a possible type of {fragmentType}, return {true} otherwise return {false}.

selection set  评估的结果是对应的grouped field set的评估结果。如果 selection set是按顺序评估，则对应grouped field set应按顺序评估，
否则应按照正常顺序评估。

The result of evaluating the selection set is the result of evaluating the
corresponding grouped field set. The corresponding grouped field set should be
evaluated serially if the selection set is being evaluated serially, otherwise
it should be evaluated normally.

## Evaluating a grouped field set

grouped field set 的评估结果是一个无序 map。grouped field set 中的每项都要在map 中有一个 entry。

The result of evaluating a grouped field set will be an unordered map. There
will be an entry in this map for every item in the grouped field set.

### Field entries

grouped field set 中每项都可能在结果map 中生成一个 entry。result map中的entry 就是对grouped field set 中对应项调用`GetFieldEntry`方法得到的结果，、
`GetFieldEntry`方法可能会返回‘null’，表示在result map中该项不应该存在entry。注意，返回一个字符串类型的key和null值，表示的是结果中应该添加一个key值为该字符串的entry，
其值为null，与前面那种情况是完全不同的。

Each item in the grouped field set can potentially create an entry in the
result map. That entry in the result map is the result is the result of calling
`GetFieldEntry` on the corresponding item in the grouped field set.
`GetFieldEntry` can return `null`, which indicates that there should be no
entry in the result map for this item. Note that this is distinct from
returning an entry with a string key and a null value, which indicates that an
entry in the result should be added for that key, and its value should be null.

`GetFieldEntry` 假定未在标准规范的该章节所定义的两个函数必须存在。type system应提供如下方法：
* `ResolveFieldOnObject`, 入参是一个object type、一个field和一个object，出参是字段是否属于该对象的结果
* `GetFieldTypeFromObjectType`,入参是一个object type、一个field，返回值是object type中该field的数据类型，或是若该字段不存在于该object type
则返回‘null’
  
`GetFieldEntry` assumes the existence of two functions that are not defined in
this section of the spec. It is expected that the type system provides these
methods:

 * `ResolveFieldOnObject`, which takes an object type, a field, and an object,
   and returns the result of resolving that field on the object.
 * `GetFieldTypeFromObjectType`, which takes an object type and a field, and
   returns that field's type on the object type, or `null` if the field is not
   valid on the object type.

GetFieldEntry(objectType, object, fields):

  * Let {firstField} be the first entry in the ordered list {fields}. Note that
    {fields} is never empty, as the entry in the grouped field set would not
    exist if there were no fields.
  * Let {responseKey} be the response key of {firstField}.
  * Let {fieldType} be the result of calling
    {GetFieldTypeFromObjectType(objectType, firstField)}.
  * If {fieldType} is {null}, return {null}, indicating that no entry exists in
    the result map.
  * Let {resolvedObject} be {ResolveFieldOnObject(objectType, object, fieldEntry)}.
  * If {resolvedObject} is {null}, return {tuple(responseKey, null)},
    indicating that an entry exists in the result map whose value is `null`.
  * Let {subSelectionSet} be the result of calling {MergeSelectionSets(fields)}.
  * Let {responseValue} be the result of calling {CompleteValue(fieldType, resolvedObject, subSelectionSet)}.
  * Return {tuple(responseKey, responseValue)}.

GetFieldTypeFromObjectType(objectType, firstField):
  * Call the method provided by the type system for determining the field type
    on a given object type.

ResolveFieldOnObject(objectType, object, firstField):
  * Call the method provided by the type system for determining the resolution
    of a field on a given object.

MergeSelectionSets(fields):
  * Let {selectionSet} be an empty list.
  * For each {field} in {fields}:
    * Let {fieldSelectionSet} be the selection set of {field}.
    * If {fieldSelectionSet} is null or empty, continue to the next field.
    * Append all selections in {fieldSelectionSet} to {selectionSet}.
  * Return {selectionSet}.

CompleteValue(fieldType, result, subSelectionSet):

  * If the {fieldType} is a Non-Null type:
    * Let {innerType} be the inner type of {fieldType}.
    * Let {completedResult} be the result of calling {CompleteValue(innerType, result)}.
    * If {completedResult} is {null}, throw a field error.
    * Return {completedResult}.
  * If {result} is {null} or a value similar to {null} such as {undefined} or
    {NaN}, return {null}.
  * If {fieldType} is a List type:
    * If {result} is not a collection of values, throw a field error.
    * Let {innerType} be the inner type of {fieldType}.
    * Return a list where each item is the result of calling
      {CompleteValue(innerType, resultItem)}, where {resultItem} is each item
      in {result}.
  * If {fieldType} is a Scalar or Enum type:
    * Return the result of "coercing" {result}, ensuring it is a legal value of
      {fieldType}, otherwise {null}.
  * If {fieldType} is an Object, Interface, or Union type:
<<<<<<< HEAD:zh-cn/spec/Section 6 -- Execution.md
    * Return the result of evaluating {subSelectionSet} on {fieldType} normally.
=======
    * If {fieldType} is an Object type.
      * Let {objectType} be {fieldType}.
    * Otherwise if {fieldType} is an Interface or Union type.
      * Let {objectType} be ResolveAbstractType({fieldType}, {result}).
    * Return the result of evaluating {subSelectionSet} on {objectType} normally.

ResolveAbstractType(abstractType, objectValue):
  * Return the result of calling the internal method provided by the type
    system for determining the Object type of {abstractType} given the
    value {objectValue}.
>>>>>>> 6097d7b32c464552bccf116201cf310adb82835c:spec/Section 6 -- Execution.md

### 正式评估 Normal evaluation

在没有按顺序执行要求对grouped field set评估时，执行器可以按它所选择决定result map中entry的顺序。
Because the resolution of fields other than top-level mutation fields
is always side effect&ndash;free and idempotent,执行顺序必须不能影响结果，因此，服务器可以自由选择它认为最优化的顺序来评估field entry。

When evaluating a grouped field set without a serial execution order requirement,
the executor can determine the entries in the result map in whatever order it
chooses. Because the resolution of fields other than top-level mutation fields
is always side effect&ndash;free and idempotent, the execution order must not
affect the result, and hence the server has the freedom to evaluate the field
entries in whatever order it deems optimal.

比如，对于如下的待评估的grouped field set：
 
For example, given the following grouped field set to be evaluated normally:

```graphql
{
  birthday {
    month
  }
  address {
    street
  }
}
```

一个执行器可以按照它所选择的顺序来处理这4个字段。

A valid GraphQL executor can resolve the four fields in whatever order it
chose.

### 按序执行 Serial execution

根据上面章节的描述，serial execution order中执行器唯一需要运行的时间在于顶层mutation
operation的selection set以及其对应的 grouped field set。

Observe that based on the above sections, the only time an executor will run in
serial execution order is on the top level selection set of a mutation
operation and on its corresponding grouped field set.

在按顺序对grouped field set进行评估时，执行器必须按照grouped field set中提供的书序来考量grouped field set中的每个entry。
在进行grouped field set组织下一个项的处理之前必须决定result map中对应的entry：

When evaluating a grouped field set serially, the executor must consider each entry
from the grouped field set in the order provided in the grouped field set. It must
determine the corresponding entry in the result map for each item to completion
before it continues on to the next item in the grouped field set:

比如如果按顺序对下述 selection set进行评估：

For example, given the following selection set to be evaluated serially:

```graphql
{
  changeBirthday(birthday: $newBirthday) {
    month
  }
  changeAddress(address: $newAddress) {
    street
  }
}
```

执行器必须按顺序执行：

- 对 `changeBirthday` 执行 `getFieldEntry` , 其中在`CompleteValue`时会正常评估`{ month }` sub-selection set
- 对`changeAddress` 执行 `getFieldEntry`  , 在 `CompleteValue` 时会正常评估 `{ street }` sub-selection set .

The executor must, in serial:

 - Run `getFieldEntry` for `changeBirthday`, which during `CompleteValue` will
   evaluate the `{ month }` sub-selection set normally.
 - Run `getFieldEntry` for `changeAddress`, which during `CompleteValue` will
   evaluate the `{ street }` sub-selection set normally.

作为一个说明性的示例，让我们假设`changeTheNumber`是一个mutation field，返回一个包含单个`theNumber`字段的对象。
如果我们按顺序执行下面的selection set:

As an illustrative example, let's assume we have a mutation field
`changeTheNumber` that returns an object containing one field,
`theNumber`. If we execute the following selection set serially:

```graphql
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

执行器会按照如下顺序进行评估：

The executor will evaluate the following serially:

 - Resolve the `changeTheNumber(newNumber: 1)` field
 - Evaluate the `{ theNumber }` sub-selection set of `first` normally
 - Resolve the `changeTheNumber(newNumber: 3)` field
 - Evaluate the `{ theNumber }` sub-selection set of `second` normally
 - Resolve the `changeTheNumber(newNumber: 2)` field
 - Evaluate the `{ theNumber }` sub-selection set of `third` normally

对于这个selection set，执行器必须产生如下的结果：

A correct executor must generate the following result for that selection set:

```js
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

### 异常处理 Error handling

<<<<<<< HEAD:zh-cn/spec/Section 6 -- Execution.md
如果处理字段时出现异常，应该视作该字段返回null来处理，必须在response中的“errors”list中添加一条error。
=======
### Nullability
>>>>>>> 6097d7b32c464552bccf116201cf310adb82835c:spec/Section 6 -- Execution.md

If the result of resolving a field is `null` (either because the function to
resolve the field returned `null` or because an error occurred), and that
field is of a `Non-Null` type, then a field error is thrown.

<<<<<<< HEAD:zh-cn/spec/Section 6 -- Execution.md
### Nullability

如果字段的处理结果是null(要么是由于处理该字段的函数返回null，要么是出现了异常)，在type system中将该字段标记成non-null，然后包含了该字段的整个field set
的评估结果现在是null。


If the result of resolving a field is null (either because the function to
resolve the field returned null or because an error occurred), and that
field is marked as being non-null in the type system, then the result
of evaluating the entire field set that contains this field is now
null.

如果由于异常导致field 为null，错误信息已经被记录过了，response 中的 “error” list必须不受影响。

If the field was null because of an error, then the error has already been
logged, and the "errors" list in the response must not be affected.

如果是field 处理函数返回null，该字段non-null，那么没有记录任何错误，应该在“errors” list中添加一条error信息。

If the field resolution function returned null, and the field was non-null,
then no error has been logged, so an appropriate error must be added to
the "errors" list.
=======
If the field was `null` because of an error which has already been added to the
`"errors"` list in the response, the `"errors"` list must not be
further affected.

If the field resolve function returned `null`, the resulting field error must be
added to the `"errors"` list in the response.


### Error handling

If an error occurs when resolving a field, it should be treated as though
the field returned `null`, and an error must be added to the `"errors"` list
in the response.

However, if the type of that field is of a `Non-Null` type, since the field
cannot be `null` the error is propagated to be dealt with by the parent field.

If all fields from the root of the request to the source of the error return
`Non-Null` types, then the `"data"` entry in the response should be `null`.
>>>>>>> 6097d7b32c464552bccf116201cf310adb82835c:spec/Section 6 -- Execution.md
