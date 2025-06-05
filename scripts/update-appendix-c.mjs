import { writeFile } from 'node:fs/promises';
import { printIntrospectionSchema, buildSchema } from 'graphql';

const FILE = './spec/Appendix C -- Built-in Definitions.md';

const sdl = printIntrospectionSchema(buildSchema(`type Query { i: Int }`));
const prefix = `
# C. Appendix: Type System Definitions

This appendix lists all the type system definitions mentioned throughout this
specification.

The descriptions are non-normative. Implementations are recommended to use them
for consistency but different descriptions are allowed.

The order of types, fields, arguments, values and directives is non-normative.

\`\`\`graphql
`

const suffix = `
\`\`\`
`
await writeFile(FILE, prefix + sdl + suffix);