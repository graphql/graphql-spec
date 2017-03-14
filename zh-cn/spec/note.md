# C. Appendix: 编者注         

view hierarchies   视图层次            
type system  类型体系            
terminal symbol  终结符           
literal values 字面值                             
type system 保持英文            
Field Selections  保持英文                 
interfaces 保持英文          
Fields 保持英文          
selection set 保持英文           
Formal Specification 正式规范          
Explanatory Text 说明性文字         
Selection 保持英文          
fragment 保持英文                  
Leaf Field Selections 保持英文             
arguments 保持英文                 
leaf nodes 叶节点        
query document  保持英文        
fragment spreads 保持英文              
Union type validation中                 

1. The member types of an Union type must all be Object base types;
   Scalar, Interface and Union types may not be member types of a Union.
   Similarly, wrapping types may not be member types of a Union.
   该如何理解  object base type有哪些？               
 

2.GraphQL Enums are not references for a numeric value, but are unique values in
   their own right. They serialize as a string: the name of the represented value.
   这里的name of the represented value是啥意思               

object base type 是啥


3.section 7
If an error can be associated to a particular point in the requested GraphQL
document, it should contain an entry with the key `locations` with a list of
locations, where each location is a map with the keys `line` and `column`, both
positive numbers starting from `1` which describe the beginning of an
associated syntax element.

beginning 这里也不通。                 
