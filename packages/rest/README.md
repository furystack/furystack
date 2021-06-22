# REST

REST API Model package for FuryStack

## Generic concept

An ideal way to implement REST APIs in FuryStack is the following:
1. Design the REST API - Create an interface that defines all endpoints, all requirements and all possible return values (~_this package_) You can place in a common module in a Monorepo that can be accessed both with the Backend and Frontend logic to share the API definition
1. Implement the defined API endpoint using the interface on the backend service (~@furystack/rest-service)
1. Import the predefined interface and use it on the client (@furystack/rest-client-fetch of @furystack/rest-client-got packages)
1. Be happy. Type safety can protect your ass if you do breaking changes with your REST API

## Disclaimer

1. Your service and client will be tightly coupled. However it can be beneficial if this is intentional but it doesn't fin in all REST API scenarios
1. Validation doesn't come with type definitions by default - Type safety is compile-time only