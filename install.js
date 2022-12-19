const { existsSync, promises } = require('fs')
const { resolve } = require('path')
const { exec } = require("child_process");

const intall = async () => {
  await promises.mkdir(`${__dirname}/rsshub`, { recursive: true });

  const process = exec(
    `cd ${__dirname}/rsshub && yarn init -y && yarn add rsshub`
  );

  process.stdout.on("data", function (data) {
    console.log(data);
  });

  process.stderr.on("data", function (data) {
    console.log(data);
  });

  process.on("close", function (code) {
    console.log("postinstall-exit-code: " + code);
  });
}

if (!existsSync(resolve(__dirname, './lib/rsshub'))) {
  intall();
}


