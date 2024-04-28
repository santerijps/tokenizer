export type TokenSpecification<T extends string> = Record<T, TokenMatcher>;
export type TokenMatcher = RegExp | string | TokenMatcherFunction;
export type TokenMatcherFunction = (text: string) => string | null;
export type Token<T extends string> = {type: T, value: string, line: number, column: number};


/**
 * Cretaes a generator for iterating over tokens.
 * @param text The text to be tokenized.
 * @param token_spec The token specification to use for matching.
 */
export function* token_iterator<T extends string>(text: string, token_spec: TokenSpecification<T>) {
  for (let i = 0; i < text.length; i++) {
    for (const [type, matcher] of Object.entries<TokenMatcher>(token_spec)) {
      const slice = text.slice(i);
      const match = match_start_of_text(slice, matcher);
      if (match !== null) {
        const [line, column] = get_line_and_column(text, i);
        yield {type, value: match, line, column} as Token<T>;
        i += match.length - 1;
        break;
      }
    }
  }
}


/**
 * Parses the text and collects the found tokens into a list and returns it.
 * @param text The text to be tokenized.
 * @param token_spec The token specification to use for matching.
 * @returns A list of tokens
 */
export function tokenize<T extends string>(text: string, token_spec: TokenSpecification<T>) {
  const iterator = token_iterator(text, token_spec);
  return Array.from(iterator);
}


function match_start_of_text(text: string, matcher: TokenMatcher) {
  if (typeof matcher === "string") {
    return text.startsWith(matcher) ? matcher : null;
  }
  else if (matcher instanceof RegExp) {
    const match = matcher.exec(text);
    return (match !== null && match.index === 0) ? match[0] : null;
  }
  else {
    return matcher(text);
  }
}


function get_line_and_column(text: string, index: number) {
  let line = 1, column = 1;
  for (let i = 0; i < index; i++) {
    if (text[i] === "\n") {
      line += 1;
      column = 1;
    }
    else {
      column += 1;
    }
  }
  return [line, column];
}


/**
 * A collection of common token matchers.
 * These can be used as examples on how to use RegEx in token matching.
 */
export const Matchers = {

  AlphabeticCharacter: /[a-zA-Z]/,
  AlphabeticWord: /[a-zA-Z]+/,
  AlphabeticUnicodeCharacter: /[\u00C0-\u1FFF\u2C00-\uD7FFa-zA-Z]/,
  AlphabeticUnicodeWord: /[\u00C0-\u1FFF\u2C00-\uD7FFa-zA-Z]+/,
  WordCharacter: /\w/,
  Word: /\w+/,
  AnyCharacter: /./s,

  AlphabeticIdentifier: /[a-zA-Z]+\w*/,
  AlphabeticUnicodeIdentifier: /[\u00C0-\u1FFF\u2C00-\uD7FFa-zA-Z]+[\u00C0-\u1FFF\u2C00-\uD7FF\w]*/,

  DoubleQuotedString: /".*?(?<!\\)"/,
  DoubleQuotedMultilineString: /".*?(?<!\\)"/s,
  SingleQuotedString: /'.*?(?<!\\)'/,
  SingleQuotedMultilineString: /'.*?(?<!\\)'/s,
  BackTickedString: /`.*?(?<!\\)`/,
  BackTickedMultilineString: /`.*?(?<!\\)`/s,

  Integer: /-?\d+/,
  IntegerWithUnderscores: /-?\d+[\d_]*/,
  FloatingPoint: /-?\d+\.\d+/,
  FloatingPointWithUnderscores: /-?\d+(?:\d|_)*\.(?:\d|_)+/,
  Number: /-?\d+(?:\.\d+)?/,
  NumberWithUnderscores: /-?\d+[\d_]*(?:\.\d+[\d_]*)?/,

  AnyWhitespace: /\s/s,
  SingleLineWhiteSpace: /\s/,
  NewLine: /\n/,

};


/**
 * Creates a stream of tokens that can be read with the `next` method.
 */
export class TokenStream<T extends string> {
  private iterator: Generator<Token<T>, void, unknown>;

  public constructor(text: string, spec: TokenSpecification<T>) {
    this.iterator = token_iterator(text, spec);
  }

  /**
   * Get the next token in the stream.
   * This function will return `null` if end of stream is reached.
   * @param ignored_types Token types to ignore when fetching the next token.
   * @returns A token or `null` if end of stream is reached.
   */
  public next(...ignored_types: T[]) {
    while (true) {
      const result = this.iterator.next();
      if (result.done) {
        return null;
      }
      else if (ignored_types.includes(result.value.type)) {
        continue;
      }
      else {
        return result.value;
      }
    }
  }

  /**
   * Closes the stream.
   * @returns The last token or `null` if end of stream was reached.
   */
  public close() {
    return this.iterator.return();
  }

  public *[Symbol.iterator] () {
    for (const token of this.iterator) {
      yield token;
    }
  }
}


export default {token_iterator, tokenize, Matchers, TokenStream};
