import {
  properties,
  parseCss,
  type ParsedStyleDecl,
} from "@webstudio-is/css-data";
import { type StyleProperty } from "@webstudio-is/css-engine";
import { camelCase } from "change-case";
import { lexer } from "css-tree";

/**
 * Does several attempts to parse:
 * - Custom property "--foo"
 * - Known regular property "color"
 * - Custom property without -- (user forgot to add)
 * - Custom property and value: --foo: red
 * - Property and value: color: red
 * - Multiple properties: color: red; background: blue
 */
export const parseStyleInput = (css: string): Array<ParsedStyleDecl> => {
  css = css.trim();
  // Is it a custom property "--foo"?
  if (css.startsWith("--") && lexer.match("<custom-ident>", css).matched) {
    return [
      {
        selector: "selector",
        property: css as StyleProperty,
        value: { type: "unset", value: "" },
      },
    ];
  }

  // Is it a known regular property?
  const camelCasedProperty = camelCase(css);
  if (camelCasedProperty in properties) {
    return [
      {
        selector: "selector",
        property: css as StyleProperty,
        value: { type: "unset", value: "" },
      },
    ];
  }

  // Is it a custom property "--foo"?
  if (lexer.match("<custom-ident>", `--${css}`).matched) {
    return [
      {
        selector: "selector",
        property: `--${css}`,
        value: { type: "unset", value: "" },
      },
    ];
  }

  const styles = parseCss(`selector{${css}}`);

  for (const style of styles) {
    // somethingunknown: red; -> --somethingunknown: red;
    if (
      // Note: currently in tests it returns unparsed, but in the client it returns invalid,
      // because we use native APIs when available in parseCss.
      style.value.type === "invalid" ||
      (style.value.type === "unparsed" &&
        style.property.startsWith("--") === false)
    ) {
      style.property = `--${style.property}`;
    }
  }

  return styles;
};
