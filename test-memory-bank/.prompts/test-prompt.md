---
name: test-prompt
title: Test Prompt Template  
description: A simple test prompt to verify the prompts management system works correctly
arguments:
  - name: topic
    description: The topic to write about
    required: true
  - name: style
    description: The writing style to use
    required: false
  - name: length
    description: The desired length of the output
    required: false
---

Please write about **{{topic}}** using the following guidelines:

## Requirements:
- Style: {{style}}
- Length: {{length}}

## Instructions:
1. Provide a clear introduction to the topic
2. Include relevant details and examples  
3. Conclude with key takeaways

Please make your response engaging and informative, tailored to the specified style and length requirements.