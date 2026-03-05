const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  resolve: {
    alias: {
      '@mamy/shared-models': join(
        __dirname,
        '../libs/shared-models/src/index.ts'
      ),
    },
  },
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
      // Only externalize these — everything else (including @mamy/*) gets bundled
      externalDependencies: [
        '@nestjs/common',
        '@nestjs/core',
        '@nestjs/config',
        '@nestjs/jwt',
        '@nestjs/passport',
        '@nestjs/platform-express',
        '@supabase/supabase-js',
        'bcrypt',
        '@nestjs/mapped-types',
        'class-transformer',
        'class-validator',
        'express',
        'passport',
        'passport-jwt',
        'reflect-metadata',
        'rxjs',
      ],
    }),
  ],
};
