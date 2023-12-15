**This document is a work in progress.**

# GraphQL Specification Style Guide

This document outlines the styles used in the GraphQL spec to aid editorial and
consistency. The writing style portions are inspired by the AP style guide. When
making changes to the GraphQL specification, please aim to be consistent with
this style guide.

## Auto-Formatting

The GraphQL specification is formatted using the `prettier` tool, so you should
not need to think about gaps between paragraphs and titles, nor about word
wrapping - this is handled for you.

## Headings

The GraphQL specification uses two types of headings: numbered headings and
unnumbered headings. All headings should be written in Title Case (see below).

### Numbered Headings

Lines beginning with a `#` will become numbered headings in the spec-md output.

```
# H1
## H2
### H3
#### H4
##### H5
```

### Unnumbered Headings

Unnumbered headings are added to split large blocks of text up without impacting
the spec numbering system. In the output are styled similarly to an H4. An
unnumbered heading is a line on its own that is bolded:

```md
\*\*This Is an Example of an Unnumbered Heading\*\*
```

### Title Case

Title case is used for headings. Every word in a heading (including words after
hyphens) should be capitalized, with the following exceptions:

- articles: a, an, the
- conjunctions under 4 letters in length: for, and, nor, but, or, yet, so, as,
  if
- prepositions under 4 letters in length: in, at, to, on, off, of, for, vs., per
- directive names and type names are unchanged: @include, @specifiedBy,
  \_\_EnumValue, \_\_Schema

All elements in hyphenated words follow the same rules, e.g. headings may
contain `Non-Null`, `Context-Free`, `Built-in` (`in` is a preposition, so is not
capitalized).

## Algorithms

A named algorithm definition starts with the name of the algorithm in
`PascalCase`, an open parenthesis, a comma-and-space separated list of
arguments, a close parenthesis and then a colon. It is followed by a blank
newline and a list of steps in the algorithm which may be numbered or bulleted.

Each step in an algorithm should either end in a colon (`:`) with an indented
step on the next line, or a fullstop (`.`). (A step after a step ending in a
full stop may or may not be indented, use your discretion.)

Indentation in algorithms is significant.

Every step in an algorithm should start with a capital letter.

```
MyAlgorithm(argOne, argTwo):

- Let {something} be {true}.
- For each {arg} in {argOne}:
  - If {arg} is greater than {argTwo}:
    - Let {something} be {false}.
  - Otherwise if {arg} is less than {argTwo}:
    - Let {something} be {true}.
- Return {something}.
```
