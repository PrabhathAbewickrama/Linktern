import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
console.log("pdf fallback:", typeof (pdf.default || pdf));
console.log("pdf() direct:", typeof pdf === 'function');
console.log("Is there a parse/extract?", Object.keys(pdf).filter(k => typeof pdf[k] === 'function'));
