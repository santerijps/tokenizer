# tokenizer

A simple generic string tokenizer written in `TypeScript`, this module exposes the following functions and classes:

```typescript
function* token_iterator<T extends string>(text: string, token_spec: TokenSpecification<T>);
function tokenize<T extends string>(text: string, token_spec: TokenSpecification<T>);
class TokenStream<T extends string>;
```

## Usage

```bash
npm i @santerijps/tokenizer
```

The API functions always take in a string as a parameter that should be tokenized, as well as a token specification that specifies the different tokens that will be matched. If the token specification is empty, then nothing will be returned, as only matched tokens are returned. This should be remembered as there might be some tokens that are "forgotten" and not checked, causing there to be characters in the string that are never handled.

In the example below, `Elizabeth` and the whitespace between `"King"` and `true` is ignored completely:

```typescript
import { Matchers, TokenStream } from "@santerijps/tokenizer";

const text = `{Charles}{Elizabeth}"King" true`;

const spec = {
  lbrace: "{",
  rbrace: "}",
  boolean:  /(?:true|false)/,
  string: Matchers.DoubleQuotedMultilineString,
  royalty: (text) => {
    if (text.startsWith("Charles")) {
      return "Charles";
    }
    return null;
  },
};

const stream = new TokenStream(text, spec);

for (const token of stream) {
  console.log(token);
}
```

To catch all characters, it's a good idea to include a catch-all token specification:

```typescript
const spec = {
  undefined: /./s // the s flag makes the dot match newlines as well
};
```
