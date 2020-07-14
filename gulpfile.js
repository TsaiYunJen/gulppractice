var gulp = require("gulp");
var $ = require("gulp-load-plugins")();
// var jade = require("gulp-jade");
// var sass = require("gulp-sass");
// var plumber = require("gulp-plumber");
// var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var mainBowerFiles = require("main-bower-files");
var browserSync = require("browser-sync").create();

//gulp.src('資料來源')
//gulp.dest('輸出目標')
//--save 正式環境   --save-dev 開發環境
//plumber出錯的時候不會停止編譯
//postcss css的後處理器
//autoprefixer 自動補上css前綴詞
//gulp-load-plugins 運用在gulp開頭的套件($字號) 簡化載入
//babel編譯ES6
//gulp-sourcemap找到相對應的程式碼檔案
//npm後端管理套件 bower前端管理套件
//gulp-minify-css css壓縮
//gulp-uglify js壓縮
//minimist 分配壓縮
//gulp-if 與minimist搭配
//gulp-clean gulp-sequence 最後輸出自動化(清除及重新依序處理)

//minimist
var envOptions = {
  string: "env",
  default: {
    env: "develop",
  },
};
var options = require("minimist")(process.argv.slice(2), envOptions);
console.log(options);

//gulp-clean
gulp.task("clean", function () {
  return gulp.src(["./.tmp", "./public"], {
    read: false
  }).pipe($.clean());
});

//copy HTML
gulp.task("copyHTML", function () {
  return gulp.src("./source/**/*.html").pipe(gulp.dest("./public"));
});

//jade
gulp.task("jade", function () {
  // var YOUR_LOCALS = {};

  return gulp
    .src("./source/**/*.jade")
    .pipe($.plumber())
    .pipe(
      $.jade({
        // locals: YOUR_LOCALS
        pretty: true,
      })
    )
    .pipe(gulp.dest("./public/"))
    .pipe(browserSync.stream()); //伺服器自動重新整理
});

//scss
gulp.task("sass", function () {
  //在gulp 4.x 新增.browserslistrc檔案
  var processors = [autoprefixer()];

  return (
    gulp
    .src("./source/scss/**/*.scss")
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass().on("error", $.sass.logError))
    //編譯完成CSS
    .pipe($.postcss(processors))
    .pipe($.if(options.env === "production", $.cleanCss()))
    .pipe($.sourcemaps.write("."))
    .pipe(gulp.dest("./public/css"))
    .pipe(browserSync.stream())
  );
});

//babel
gulp.task("babel", () =>
  gulp
  .src("./source/js/**/*.js")
  .pipe($.sourcemaps.init())
  .pipe(
    $.babel({
      presets: ["@babel/env"],
    })
  )
  .pipe($.concat("all.js"))
  .pipe(
    $.if(
      options.env === "production",
      $.uglify({
        //移除console
        compress: {
          drop_console: true,
        },
      })
    )
  )
  .pipe($.sourcemaps.write("."))
  .pipe(gulp.dest("./public/js"))
  .pipe(browserSync.stream())
);

//main-bower-files
//暫存資料夾
gulp.task("bower", function () {
  return gulp.src(mainBowerFiles()).pipe(gulp.dest("./.tmp/vendors"));
});

//在跑vendorJs任務之前 會先完成bower任務
gulp.task(
  "vendorJs",
  gulp.series("bower", function () {
    return gulp
      .src("./.tmp/vendors/**/**.js")
      .pipe($.concat("vendors.js"))
      .pipe($.if(options.env === "production", $.uglify()))
      .pipe(gulp.dest("./public/js"));
  })
);

//browser-sync 建立一個伺服器
gulp.task("browser-sync", function () {
  browserSync.init({
    server: {
      baseDir: "./public",
    },
    reloadDebounce: 2000, //重新整理間隔需超過2秒
  });
});
//gulp-imagemin
gulp.task("image-min", function () {
  gulp
    .src("./source/images/*")
    .pipe($.if(options.env === "production", $.imagemin()))
    .pipe(gulp.dest("./public/images"));
});

//監控scss有改變時
//在gulp 4.x 傳遞函數 gulp.series("任務名稱")
gulp.task("watch", function () {
  gulp.watch("./source/scss/**/*.scss", gulp.series("sass"));
  gulp.watch("./source/**/*.jade", gulp.series("jade"));
  gulp.watch("./source/js/**/*.js", gulp.series("babel"));
});

//gulp-sequence 正式發布不需要browser-sync跟watch
gulp.task(
  "build",
  gulp.series("clean", "jade", "sass", "babel", "vendorJs", "image-min")
);

//合併任務
//預設default不需輸入task名稱
gulp.task(
  "default",
  gulp.series(
    "jade",
    "sass",
    "babel",
    "vendorJs",
    "image-min",
    "browser-sync",
    "watch"
  )
);

//npm i --only=prod 只安裝正式環境
//npm i --only=dev  只安裝開發環境
//npm i 安裝全部環境
//npm prune --prod 只保留正式環境
//啊啊啊啊