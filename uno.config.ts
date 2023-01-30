import { defineConfig } from "unocss";
import transformerDirectives from "@unocss/transformer-directives";
import transformerCompileClass from "@unocss/transformer-compile-class";

export default defineConfig({
  // ...
  transformers: [transformerDirectives(), transformerCompileClass()],
});
