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
