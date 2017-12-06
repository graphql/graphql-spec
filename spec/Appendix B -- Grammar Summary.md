# B. Appendix: Grammar Summary

SourceCharacter :: /[\u0009\u000A\u000D\u0020-\uFFFF]/


## Ignored Tokens

Ignored ::
  - UnicodeBOM
  - WhiteSpace
  - LineTerminator
  - Comment
  - Comma

UnicodeBOM :: "Byte Order Mark (U+FEFF)"

WhiteSpace ::
  - "Horizontal Tab (U+0009)"
  - "Space (U+0020)"

LineTerminator ::
  - "New Line (U+000A)"
  - "Carriage Return (U+000D)" [ lookahead ! "New Line (U+000A)" ]
  - "Carriage Return (U+000D)" "New Line (U+000A)"

Comment :: `#` CommentChar*

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
  - `"` StringCharacter* `"`
  - `"""` BlockStringCharacter* `"""`

StringCharacter ::
  - SourceCharacter but not `"` or \ or LineTerminator
  - \u EscapedUnicode
  - \ EscapedCharacter

EscapedUnicode :: /[0-9A-Fa-f]{4}/

EscapedCharacter :: one of `"` \ `/` b f n r t

BlockStringCharacter ::
  - SourceCharacter but not `"""` or `\"""`
  - `\"""`

Note: Block string values are interpreted to exclude blank initial and trailing
lines and uniform indentation with {BlockStringValue()}.


## Document

Document : Definition+

Definition :
  - OperationDefinition
  - FragmentDefinition
  - TypeSystemDefinition

OperationDefinition :
  - SelectionSet
  - OperationType Name? VariableDefinitions? Directives? SelectionSet

OperationType : one of query mutation subscription

SelectionSet : { Selection+ }

Selection :
  - Field
  - FragmentSpread
  - InlineFragment

Field : Alias? Name Arguments? Directives? SelectionSet?

Alias : Name :

Arguments[Const] : ( Argument[?Const]+ )

Argument[Const] : Name : Value[?Const]

FragmentSpread : ... FragmentName Directives?

InlineFragment : ... TypeCondition? Directives? SelectionSet

FragmentDefinition : fragment FragmentName TypeCondition Directives? SelectionSet

FragmentName : Name but not `on`

TypeCondition : on NamedType

Value[Const] :
  - [~Const] Variable
  - IntValue
  - FloatValue
  - StringValue
  - BooleanValue
  - NullValue
  - EnumValue
  - ListValue[?Const]
  - ObjectValue[?Const]

BooleanValue : one of `true` `false`

NullValue : `null`

EnumValue : Name but not `true`, `false` or `null`

ListValue[Const] :
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

Directives[Const] : Directive[?Const]+

Directive[Const] : @ Name Arguments[?Const]?

TypeSystemDefinition :
  - SchemaDefinition
  - TypeDefinition
  - TypeExtension
  - DirectiveDefinition

SchemaDefinition : schema Directives[Const]? { OperationTypeDefinition+ }

OperationTypeDefinition : OperationType : NamedType

Description : StringValue

TypeDefinition :
  - ScalarTypeDefinition
  - ObjectTypeDefinition
  - InterfaceTypeDefinition
  - UnionTypeDefinition
  - EnumTypeDefinition
  - InputObjectTypeDefinition

TypeExtension :
  - ScalarTypeExtension
  - ObjectTypeExtension
  - InterfaceTypeExtension
  - UnionTypeExtension
  - EnumTypeExtension
  - InputObjectTypeDefinition

ScalarTypeDefinition : Description? scalar Name Directives[Const]?

ScalarTypeExtension :
  - extend scalar Name Directives[Const]

ObjectTypeDefinition : Description? type Name ImplementsInterfaces? Directives[Const]? FieldDefinitions?

ObjectTypeExtension :
  - extend type Name ImplementsInterfaces? Directives[Const]? FieldDefinitions
  - extend type Name ImplementsInterfaces? Directives[Const]
  - extend type Name ImplementsInterfaces

ImplementsInterfaces : implements NamedType+

FieldDefinitions : { FieldDefinition+ }

FieldDefinition : Description? Name ArgumentsDefinition? : Type Directives[Const]?

ArgumentsDefinition : ( InputValueDefinition+ )

InputValueDefinition : Description? Name : Type DefaultValue? Directives[Const]?

InterfaceTypeDefinition : Description? interface Name Directives[Const]? FieldDefinitions?

InterfaceTypeExtension :
  - extend interface Name Directives[Const]? FieldDefinitions
  - extend interface Name Directives[Const]

UnionTypeDefinition : Description? union Name Directives[Const]? UnionMembersDefinition?

UnionMembersDefinition : = UnionMembers

UnionMembers :
  - `|`? NamedType
  - UnionMembers | NamedType

UnionTypeExtension :
  - extend union Name Directives[Const]? UnionMembersDefinition
  - extend union Name Directives[Const]

EnumTypeDefinition : Description? enum Name Directives[Const]? EnumValueDefinitions?

EnumValueDefinitions : { EnumValueDefinition+ }

EnumValueDefinition : Description? EnumValue Directives[Const]?

EnumTypeExtension :
  - extend enum Name Directives[Const]? EnumValueDefinitions
  - extend enum Name Directives[Const]

InputObjectTypeDefinition : Description? input Name Directives[Const]? InputFieldDefinitions?

InputFieldDefinitions : { InputValueDefinition+ }

InputObjectTypeExtension :
  - extend input Name Directives[Const]? InputFieldDefinitions
  - extend input Name Directives[Const]

DirectiveDefinition : Description? directive @ Name ArgumentsDefinition? on DirectiveLocations

DirectiveLocations :
  - `|`? DirectiveLocation
  - DirectiveLocations | DirectiveLocation

DirectiveLocation : one of
  `QUERY`                 `SCHEMA`                `ENUM`
  `MUTATION`              `SCALAR`                `ENUM_VALUE`
  `SUBSCRIPTION`          `OBJECT`                `INPUT_OBJECT`
  `FIELD`                 `FIELD_DEFINITION`      `INPUT_FIELD_DEFINITION`
  `FRAGMENT_DEFINITION`   `ARGUMENT_DEFINITION`
  `FRAGMENT_SPREAD`       `INTERFACE`
  `INLINE_FRAGMENT`       `UNION`
