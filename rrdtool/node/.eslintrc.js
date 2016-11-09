"use strict";

module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true,
        "jquery": true
    },
    "extends": "eslint:recommended",
    "rules": {
        // "indent": [ "warn", 4 ],
        // "linebreak-style": [ "warn", "unix" ],
        // "quotes": [ "warn", "single" ],
        // "semi": [ "warn", "never" ],
        "eqeqeq": ["warn", "always"],
        "strict": ["error", "global"],
        "no-var": "error",
        "prefer-const": 0,//"warn",
        "no-console": 0,
        "no-mixed-spaces-and-tabs": 0
    }
};
