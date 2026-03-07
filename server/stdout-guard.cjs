"use strict";
const fs = require("fs");

function patchStream(stream) {
  if (!stream || !stream._write) return;
  const origWrite = stream._write.bind(stream);
  stream._write = function(chunk, encoding, cb) {
    try {
      origWrite(chunk, encoding, function(err) {
        if (err && (err.code === "EIO" || err.code === "EPIPE")) {
          cb();
        } else {
          cb(err);
        }
      });
    } catch (e) {
      cb();
    }
  };
  stream.on("error", function() {});
}

patchStream(process.stdout);
patchStream(process.stderr);
