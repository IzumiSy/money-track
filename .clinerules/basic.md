# Basic rules for development

## Design

* Always try to have consistency among features that already exist if you make changes in codebase.
* Follow the patterns behind Object Oriented Programming to make things clean

## Process

* Always run `pnpm type-check`, `pnpm lint` and `pnpm test` after a set of modification, and fix all things reported
* You don't have to run `pnpm dev` to check if the application runs properly unless you are commanded to do so
  * Application behaviour should be assured through unit tests as much as possible.
