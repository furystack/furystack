<!-- version-type: minor -->

# @furystack/rest-client-fetch

## ✨ Features

### `onResponseParseError` callback in `ClientOptions`

`createClient` now accepts an `onResponseParseError` option, called when `response.json()` fails during response parsing. This surfaces JSON parse errors that were previously silent (the default behavior of returning `null` is unchanged).

```typescript
const client = createClient<MyApi>({
  endpointUrl: 'https://api.example.com',
  onResponseParseError: ({ response, error }) => {
    console.error(`Failed to parse response from ${response.url}:`, error)
  },
})
```

## 🧪 Tests

- Added tests for `onResponseParseError` callback invocation on JSON parse failure
