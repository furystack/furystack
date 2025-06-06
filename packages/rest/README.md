# REST

REST API model package for FuryStack.

## Generic Concept

An ideal way to implement REST APIs in FuryStack is as follows:

1. Design the REST API – Create an interface that defines all endpoints, requirements, and possible return values (this package). You can place it in a common module in a monorepo that can be accessed by both backend and frontend logic to share the API definition.
2. Implement the defined API endpoint using the interface on the backend service (see @furystack/rest-service).
3. Import the predefined interface and use it on the client (see @furystack/rest-client-fetch package).
4. Be happy. Type safety will protect you from breaking changes in your REST API.

## Disclaimer

1. Your service and client will be tightly coupled. This can be beneficial if intentional, but it doesn't fit all REST API scenarios.
2. Validation doesn't come with type definitions by default – type safety is compile-time only
