const path = require("path");
const fs = require("fs");
const jsYaml = require("js-yaml");

function buildSwaggerDocument() {
  const docsDir = path.join(__dirname, "../docs");

  // Load base document (info, servers, tags, shared components, /health path)
  const swaggerDocument = jsYaml.load(
    fs.readFileSync(path.join(docsDir, "openapi.yaml"), "utf8")
  );

  // Merge paths from each module yaml
  const modulesDir = path.join(docsDir, "modules");
  const moduleFiles = fs.readdirSync(modulesDir).filter((f) => f.endsWith(".yaml"));

  for (const file of moduleFiles) {
    const moduleDoc = jsYaml.load(
      fs.readFileSync(path.join(modulesDir, file), "utf8")
    );
    if (moduleDoc && typeof moduleDoc === "object") {
      // Support both { paths: { ... } } and flat { '/path': { ... } } formats
      const paths = moduleDoc.paths || moduleDoc;
      swaggerDocument.paths = { ...swaggerDocument.paths, ...paths };
    }
  }

  return swaggerDocument;
}

module.exports = { buildSwaggerDocument };
