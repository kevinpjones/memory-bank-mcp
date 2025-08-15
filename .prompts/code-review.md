---
name: code-review
title: Code Review Assistant
description: Analyzes code for quality, best practices, and potential improvements
arguments:
  - name: code
    description: The code to review
    required: true
  - name: language
    description: Programming language of the code
    required: false
  - name: focus
    description: Specific aspect to focus on (security, performance, style, etc.)
    required: false
---

Please conduct a thorough code review of the following {{language}} code:

```{{language}}
{{code}}
```

Please pay special attention to: {{focus}}

Analyze the code for:
- Code quality and readability
- Best practices adherence
- Potential bugs or issues
- Performance considerations
- Security vulnerabilities
- Suggested improvements

Provide specific recommendations with explanations.