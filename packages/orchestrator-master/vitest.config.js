"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true,
        environment: 'node',
        deps: {
            inline: true,
        },
        coverage: {
            reporter: ['text', 'json', 'html'],
        },
        mockReset: true,
        testTimeout: 10000,
    },
});
