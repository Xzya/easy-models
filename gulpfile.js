"use strict";

const gulp = require("gulp");
const gulp_base = require("./gulpfile-base");
const del = require("del");

gulp.task("tsc", gulp_base.tsc);

gulp.task("clean", () => {
    return del(["coverage", "dist"]);
});

gulp.task("default", gulp.series("clean", gulp.parallel("tsc")));
gulp.task("release", gulp.series("default"));