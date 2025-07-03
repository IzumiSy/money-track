# Basic rules for development

## Design

* Always try to have consistency among features that already exist if you make changes in codebase.
* Follow the patterns behind Object Oriented Programming to make things clean.
* Don't have to consider backward compatibility if you are told to do so.

## Process

* Always check code quality (run `pnpm type-check`, `pnpm lint` and `pnpm test`) after a set of modification, and fix all things reported.
* before working on you task, if you are working on `main` branch, checkout a new branch to apply your changes.
  * Use any name you want for a new branch.
  * If you are already a branch that is not `main`, you don't have to checkout a new branch. Proceed your tasks on the current one.
* You don't have to run `pnpm dev` to check if the application runs properly unless you are commanded to do so
  * Application behaviour should be assured through unit tests as much as possible.
* Once you finished a set of changes you want and checked if the code quality check passes, commit you changes by git with short but intuitive commit message.
