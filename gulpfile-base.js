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
    tslint: (done) => {
        const tslintPath = path.normalize('./node_modules/.bin/tslint');
        const command = `${tslintPath} -p tsconfig.json -c tslint.json`;

        child_process.execSync(command, {
            stdio: 'inherit'
        });
        done();
    },
    test: (done) => {
        const jestPath = path.normalize("./node_modules/.bin/jest");
        const command = `${jestPath} --coverage`;

        child_process.execSync(command, {
            stdio: 'inherit'
        });
        done();
    },
    doc: (done) => {
        const typedocPath = path.normalize("./node_modules/.bin/typedoc");
        const command = `${typedocPath} --theme minimal --excludeExternals --excludePrivate --mode file --out doc lib/`;

        child_process.execSync(command, {
            stdio: "inherit"
        });
        done();
    },
};