const path = require("path");
const fs = require("fs");
const jsYaml = require("js-yaml");

function buildSwaggerDocument() {
  const docsDir = path.join(__dirname, "../docs");

  const swaggerDocument = jsYaml.load(
    fs.readFileSync(path.join(docsDir, "openapi.yaml"), "utf8")
  );

  const modulesDir = path.join(docsDir, "modules");
  const moduleFiles = fs.readdirSync(modulesDir).filter((f) => f.endsWith(".yaml"));

  for (const file of moduleFiles) {
    const moduleDoc = jsYaml.load(
      fs.readFileSync(path.join(modulesDir, file), "utf8")
    );
    if (moduleDoc && typeof moduleDoc === "object") {
      const paths = moduleDoc.paths || moduleDoc;
      swaggerDocument.paths = { ...swaggerDocument.paths, ...paths };
    }
  }

  const schemasDir = path.join(docsDir, "schemas");
  if (fs.existsSync(schemasDir)) {
    const schemaFiles = fs.readdirSync(schemasDir).filter((f) => f.endsWith(".yaml"));
    for (const file of schemaFiles) {
      const schemaDoc = jsYaml.load(
        fs.readFileSync(path.join(schemasDir, file), "utf8")
      );
      if (schemaDoc && schemaDoc.components && schemaDoc.components.schemas) {
        swaggerDocument.components = swaggerDocument.components || {};
        swaggerDocument.components.schemas = {
          ...swaggerDocument.components.schemas,
          ...schemaDoc.components.schemas,
        };
      }
    }
  }

  return swaggerDocument;
}

module.exports = { buildSwaggerDocument };
