const { existsSync, promises } = require('fs')
const { resolve } = require('path')
const { exec } = require("child_process");

const intall = async () => {
  await promises.mkdir(`${__dirname}/rsshub`, { recursive: true });

  const process = exec(
    `cd ${__dirname}/rsshub && npm init -y && npm add rsshub`
  );

  process.stdout.on("data", function (data) {
    console.log("rsshub: " + data);
  });

  process.stderr.on("data", function (data) {
    console.log("rsshub-error: " + data);
  });

  process.on("close", function (code) {
    console.log("exit-code: " + code);
  });
}

if (!existsSync(resolve(__dirname, './lib/rsshub'))) {
  intall();
}


