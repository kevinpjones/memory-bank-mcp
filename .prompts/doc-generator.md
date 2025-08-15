---
name: doc-generator
title: Documentation Generator
description: Generates comprehensive documentation for code or features
arguments:
  - name: subject
    description: The code, feature, or component to document
    required: true
  - name: type
    description: Type of documentation (API, user guide, technical spec)
    required: false
  - name: audience
    description: Target audience (developers, end users, stakeholders)
    required: false
---

Generate {{type}} documentation for the following:

{{subject}}

Target audience: {{audience}}

Please create comprehensive documentation that includes:
- Overview and purpose
- Key features and functionality
- Usage examples
- Configuration options (if applicable)
- Best practices
- Troubleshooting section

Use clear, professional language appropriate for the target audience.