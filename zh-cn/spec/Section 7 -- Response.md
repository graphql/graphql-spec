# Response

当 GraphQL 服务器接收到请求时，必须返回符合要求的response。服务器response描述了所请求的操作执行结果是否成功，以及请求执行时所遇到的任何错误。

When a GraphQL server receives a request, it must return a well-formed
response. The server's response describes the result of executing the requested
operation if successful, and describes any errors encountered during the
request.

当一个字段被替换成null的错误出现时，一个 response 可能会包含一部分response和遇到的错误。

A response may contain both a partial response as well as encountered errors in
the case that an error occurred on a field which was replaced with null.

## 序列化格式 Serialization Format

GraphQL 并不要求某种特定的序列化格式。但是，客户端应该使用某一种支持 GraphQL中大部分基本类型的序列化格式。特别是，
序列化格式必须支持以下4种基本类型的表达：
* Map
* List
* String
* Null

GraphQL does not require a specific serialization format. However, clients
should use a serialization format that supports the major primitives in the
GraphQL response. In particular, the serialization format must support
representations of the following four primitives:

 * Map
 * List
 * String
 * Null
     

Serialization formats which can represent an ordered map should preserve the order of requested fields as defined by {CollectFields()} in the Execution section. Serialization formats which can only represent unordered maps should retain this order grammatically (such as JSON).

Producing a response where fields are represented in the same order in which they appear in the request improves human readability during debugging and enables more efficient parsing of responses if the order of properties can be anticipated.


序列化格式可能会支持如下的基本类型，但可以使用string来替代这些数据类型：
* Boolean
* Int
* Float
* Enum Value

A serialization format may support the following primitives, however, strings
may be used as a substitute for those primitives.

 * Boolean
 * Int
 * Float
 * Enum Value

### JSON Serialization

JSON是 GraphQL 优先选择的序列化格式，尽管如上所述，
GraphQL 并不要求某种特定的序列化格式。出于一致性和简化标记的目的，整个规范中response的例子都是用JSON来表示的。
特别是，在我们的示例中，我们使用如下的JSON 概念来表示基本数据类型：
| GraphQL Value | JSON Value        |
|:--------------|:------------------|
| Map           | Object            |
| List          | Array             |
| Null          | {null}            |
| String        | String            |
| Boolean       | {true} or {false} |
| Int           | Number            |
| Float         | Number            |
| Enum Value    | String            |


JSON is the preferred serialization format for GraphQL, though as noted above,
GraphQL does not require a specific serialization format. For consistency and
ease of notation, examples of the response are given in JSON throughout the
spec. In particular, in our JSON examples, we will represent primitives using
the following JSON concepts:

| GraphQL Value | JSON Value        |
|:--------------|:------------------|
| Map           | Object            |
| List          | Array             |
| Null          | {null}            |
| String        | String            |
| Boolean       | {true} or {false} |
| Int           | Number            |
| Float         | Number            |
| Enum Value    | String            |


## Response Format

GraphQL operation 的response 响应 必须是一个map。

A response to a GraphQL operation must be a map.

如果 operation 包含了 execution，响应的map 必须包含一个key值为‘data’的entry。这个entry值的描述在”Data”章节。如果由于语法错误、信息缺失、
校验错误，该operation 在execution执行之前就失败了，那么 entry 就不存在。


If the operation included execution, the response map must contain an entry
with key `data`. The value of this entry is described in the "Data" section. If
the operation failed before execution, due to a syntax error, missing
information, or validation error, this entry must not be present.

如果 operation 遇到任何错误，response map 必须包含一个key值为 ‘errors’的entry。该entry 值的描述在"Errors"章节。如果operation没有遇到任何错误顺利完成，
该entry必须不存在。

If the operation encountered any errors, the response map must contain an entry
with key `errors`. The value of this entry is described in the "Errors"
section. If the operation completed without encountering any errors, this entry
must not be present.

response map 也可以包含一个key值为 ‘extensions’的entry。如果存在该entry，其值必须是一个map。该entry用来让开发人员按照自己意愿来扩展该协议，
因此对于它的内容没有任何额外的限制。

The response map may also contain an entry with key `extensions`. This entry,
if set, must have a map as its value. This entry is reserved for implementors
to extend the protocol however they see fit, and hence there are no additional
restrictions on its contents.

为了保证将来协议的变更不会破坏已有的服务器和客户端，顶层的response map 必须不能包含上述三种以外的任何entry。

To ensure future changes to the protocol do not break existing servers and
clients, the top level response map must not contain any entries other than the
three described above.

### Data

response 中的`data`  entry是所请求的operation执行的结果。如果该operation 是一个query，输出结果是schema中query root类型的对象；如果是mutation，
输出结果是schema中mutation root类型的对象。

The `data` entry in the response will be the result of the execution of the
requested operation. If the operation was a query, this output will be an
object of the schema's query root type; if the operation was a mutation, this
output will be an object of the schema's mutation root type.

如果在开始执行之前遇到任何错误，结果中不应该包含`data` entry。

If an error was encountered before execution begins, the `data` entry should
not be present in the result.

如果在执行时遇到一个错误，导致response 无效，则`data`  entry应为 ‘null’。

If an error was encountered during the execution that prevented a valid
response, the `data` entry in the response should be `null`.

### Errors

response 中的`errors` entry 是一个非空的error 列表，其中每个error都是一个map。

The `errors` entry in the response is a non-empty list of errors, where each
error is a map.

如果在请求的operation 执行时没有遇到任何错误，结果中不应该存在`errors` entry 。

If no errors were encountered during the requested operation, the `errors`
entry should not be present in the result.

每个error必须包含一个key值为‘message’的entry，其值为一个字符串描述的错误信息，供开发人员来理解和校对错误。

Every error must contain an entry with the key `message` with a string
description of the error intended for the developer as a guide to understand
and correct the error.

如果错误与所请求的的 GraphQL document的某个特殊部分关联起来，则应包含一个key值为‘locations’的entry，其值为很多location的一个list，
其中每个location是一个key为`line` and `column` 的map，值为从‘1’开始的正整数，表示的是相对应的语法元素的开始。(这里也不通)

If an error can be associated to a particular point in the requested GraphQL
document, it should contain an entry with the key `locations` with a list of
locations, where each location is a map with the keys `line` and `column`, both
positive numbers starting from `1` which describe the beginning of an
associated syntax element.

GraphQL 服务器可以按需为error提供更多额外的entry来描述更多有用的或机器可读的错误信息，该规范以后的版本可能会介绍一些有关error的其他entry。

GraphQL servers may provide additional entries to error as they choose to
produce more helpful or machine-readable errors, however future versions of the
spec may describe additional entries to errors.

如果response 中 `data` 为 `null` 或不存在，response中的`errors` entry 必须存在，不能为空。其中必须包含至少一个错误error。
所包含的error应该表示没有数据返回的原因。

If the `data` entry in the response is `null` or not present, the `errors`
entry in the response must not be empty. It must contain at least one error.
The errors it contains should indicate why no data was able to be returned.

如果response 中 `data` 不为 `null`，response中的`errors` entry 可能会包含任意多个执行时遇到的错误。如果执行时发送了错误，应该包含此类错误信息。

If the `data` entry in the response is not `null`, the `errors` entry in the
response may contain any errors that occurred during execution. If errors
occurred during execution, it should contain those errors.
