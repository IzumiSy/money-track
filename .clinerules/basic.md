# Basic rules for development

## Design

High-level rules for everything about designing the whole application structure

* Always try to have consistency among features that already exist if you make changes in codebase.
* Follow the patterns behind Object Oriented Programming to make things clean.
* Always think about decoupling states (and logic that manages them) from presentation layer (UI).
* Don't have to consider backward compatibility if you are told to do so.

## Process

Precise rules that you always have to keep in mind in making changes on codebase

* Always check code quality (run `pnpm type-check`, `pnpm lint` and `pnpm test`) after a set of modification, and fix all things reported.
* before working on you task, if you are working on `main` branch, checkout a new branch to apply your changes.
  * Use any name you want for a new branch.
  * If you are already a branch that is not `main`, you don't have to checkout a new branch. Proceed your tasks on the current one.
* You don't have to run `pnpm dev` to check if the application runs properly unless you are commanded to do so
  * Application behaviour should be assured through unit tests as much as possible.
* Once you finished a set of changes you want and checked if the code quality check passes, commit you changes by git with short but intuitive commit message.

## Documentation

* Update `README.md` if you make changes related to application feature, Remember that `README.md` is not a technical document. 
* Update `ARCHITECTURE.md` if you make changes that affect technical detail such as architecture, data flow, and code-level stuff. 
