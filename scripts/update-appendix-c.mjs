import { writeFile } from 'node:fs/promises';
import { printIntrospectionSchema, buildSchema, specifiedScalarTypes, printType } from 'graphql';

const FILE = './spec/Appendix C -- Specified Definitions.md';
function printSpecifiedScalars() {
  return specifiedScalarTypes
    .map((type) => printType(type))
    .join('\n\n');
}

const introspectionSchema = printIntrospectionSchema(buildSchema(`type Query { i: Int }`));
const prefix = `
# C. Appendix: Type System Definitions

This appendix lists the specified type system definitions.

The descriptions are non-normative. Implementations are recommended to use them
for consistency but different descriptions are allowed.

The order of types, fields, arguments, values and directives is non-normative.

\`\`\`graphql
`

const suffix = `
\`\`\`
`
await writeFile(FILE, prefix + printSpecifiedScalars() + '\n\n' + introspectionSchema + suffix);
