// Debug script to understand the markdown parsing
const ReactMarkdown = require('react-markdown');
const remarkGfm = require('remark-gfm');

const testMarkdown = `1. **Context Intake**
   
   • Review the change description and understand the goal of the change
   • Identify the change scope (diff, commit list, or directory)
   • Read surrounding code to understand intent and style
   • Gather test status and coverage reports if present`;

console.log("=== Testing markdown structure ===");
console.log("Input markdown:");
console.log(testMarkdown);
console.log("\n=== Expected HTML structure ===");
console.log("Should be:");
console.log(`<ol>
  <li>
    <strong>Context Intake</strong>
    <ul>
      <li>Review the change description...</li>
      <li>Identify the change scope...</li>
      <li>Read surrounding code...</li>
      <li>Gather test status...</li>
    </ul>
  </li>
</ol>`);

// Let's see what ReactMarkdown actually produces
const remark = require('remark');
const remarkParse = require('remark-parse');
const processor = remark().use(remarkParse).use(remarkGfm);

const ast = processor.parse(testMarkdown);
console.log("\n=== Actual AST structure ===");
console.log(JSON.stringify(ast, null, 2));