# B. Appendix: Grammar Summary

SourceCharacter :: "Any Unicode code point"


## Ignored Tokens

Ignored ::
  - WhiteSpace
  - LineTerminator
  - Comment
  - Comma

WhiteSpace ::
  - "Horizontal Tab (U+0009)"
  - "Vertical Tab (U+000B)"
  - "Form Feed (U+000C)"
  - "Space (U+0020)"
  - "No-break Space (U+00A0)"

LineTerminator ::
  - "New Line (U+000A)"
  - "Carriage Return (U+000D)"
  - "Line Separator (U+2028)"
  - "Paragraph Separator (U+2029)"

Comment ::
  - `#` CommentChar*

CommentChar :: SourceCharacter but not LineTerminator

Comma :: ,


## Lexical Tokens

Token ::
  - Punctuator
  - Name
  - IntValue
  - FloatValue
  - StringValue

Punctuator :: one of ! $ ( ) ... : = @ [ ] { | }

Name :: /[_A-Za-z][_0-9A-Za-z]*/

IntValue :: IntegerPart

IntegerPart ::
  - NegativeSign? 0
  - NegativeSign? NonZeroDigit Digit*

NegativeSign :: -

Digit :: one of 0 1 2 3 4 5 6 7 8 9

NonZeroDigit :: Digit but not `0`

FloatValue ::
  - IntegerPart FractionalPart
  - IntegerPart ExponentPart
  - IntegerPart FractionalPart ExponentPart

FractionalPart :: . Digit+

ExponentPart :: ExponentIndicator Sign? Digit+

ExponentIndicator :: one of `e` `E`

Sign :: one of + -

StringValue ::
  - `""`
  - `"` StringCharacter+ `"`

StringCharacter ::
  - SourceCharacter but not `"` or \ or LineTerminator
  - \ EscapedUnicode
  - \ EscapedCharacter

EscapedUnicode :: u /[0-9A-Fa-f]{4}/

EscapedCharacter :: one of `"` \ `/` b f n r t


## Query Document

Document : Definition+

Definition :
  - OperationDefinition
  - FragmentDefinition

OperationDefinition :
  - SelectionSet
  - OperationType Name VariableDefinitions? Directives? SelectionSet

OperationType : one of query mutation

SelectionSet : { Selection+ }

Selection :
  - Field
  - FragmentSpread
  - InlineFragment

Field : Alias? Name Arguments? Directives? SelectionSet?

Alias : Name :

Arguments : ( Argument+ )

Argument : Name : Value

FragmentSpread : ... FragmentName Directives?

InlineFragment : ... on TypeCondition Directives? SelectionSet

FragmentDefinition : fragment FragmentName on TypeCondition Directives? SelectionSet

FragmentName : Name but not `on`

TypeCondition : NamedType

Value[Const] :
  - [~Const] Variable
  - IntValue
  - FloatValue
  - StringValue
  - BooleanValue
  - EnumValue
  - ArrayValue[?Const]
  - ObjectValue[?Const]

BooleanValue : one of `true` `false`

EnumValue : Name but not `true`, `false` or `null`

ArrayValue[Const] :
  - [ ]
  - [ Value[?Const]+ ]

ObjectValue[Const] :
  - { }
  - { ObjectField[?Const]+ }

ObjectField[Const] : Name : Value[?Const]

VariableDefinitions : ( VariableDefinition+ )

VariableDefinition : Variable : Type DefaultValue?

Variable : $ Name

DefaultValue : = Value[Const]

Type :
  - NamedType
  - ListType
  - NonNullType

NamedType : Name

ListType : [ Type ]

NonNullType :
  - NamedType !
  - ListType !

Directives : Directive+

Directive : @ Name Arguments?
