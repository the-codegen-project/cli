---
slug: the-codegen-project
title: The Codegen Project
authors: [jonaslagoni, andreaslagoni]
tags: [the-codegen-project]
---

![The Codegen Project banner](/img/banner.webp)

## The Idea 💡
[Apollo GraphQL code generator](https://www.apollographql.com/tutorials/lift-off-part1/09-codegen) has always been a pleasure to use, but when it comes to standards such as OpenAPI and AsyncAPI, the same level of code generator or simplicity during the implemenation phase is non-existing.

That is what this project wants to bring;
- ⚔️ Support multiple protocols (not just HTTP)
- 📖 Support multiple input standards (not just AsyncAPI and OpenAPI)
- 🔧 Integrate into any project (regardless of language)

A bit ambitious perhaps... So how?
<!-- truncate -->

## How❓
We want to achieve it through three main parts, `open source`, extensive `testing`, and `sustainability`.

### 🔓 Open source
Build on and for open source. Use it however you like in your projects enterprise or not, build your software with ease and peace in mind with [`Apache License 2.0`](https://github.com/the-codegen-project/cli/blob/main/LICENSE). It is built for multiple use-cases, as we all know, there will always be another standard. So high likelyhood that we already support what you are switching to.

### 🔎 Testing makes the dream work
The worst part about any code generator is if the generated code is either syntantically unusable or sematically incorrect. Thats why all generators are run through a set of tests, `blackbox`, `runtime` and `regular` unit testing. 

- `blackbox` lets shoot into the dark and see if anything turns up red. We test a combination of inputs and generator configurations together to see if anything gets generated that are syntatically incorrect.
- `runtime` we build some actual software in their native language and ensure they work as we expect. I.e. we write test and generated code in their actual language ensuring what is generated are sematically correct. 
- `regular` unit testing ensures we can shoot at all. Ensuring you dont encounter errors when running the generator and library.

### 🔗 Long term sustainability 
Relying only on peoples spare time is not a very good long term strategy. We want to ensure the longevity of the project and ensure that those who contribute most also can get paid by it, or even employed to work on open source.

More on that later ;)
