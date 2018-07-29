"use strict";

const path = require("path");
const child_process = require("child_process");

module.exports = {
    tsc: (done) => {
        const tscPath = path.normalize("./node_modules/.bin/tsc");
        const command = `${tscPath} -p tsconfig.json`;

        child_process.execSync(command, {
            stdio: "inherit"
        });
        done();
    },
};