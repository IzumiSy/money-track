# Basic rules for development

## High-level Design

* Always try to have consistency among features that already exist if you make changes in codebase.
* Follow the patterns behind Object Oriented Programming to make things clean.
* Always think about decoupling states (and logic that manages them) from presentation layer (UI).
* Don't have to consider backward compatibility if you are told to do so.

## Process

* Always check code quality by checking lint errors, type errors and running tests after a set of modification, and fix all things reported.

## Documentation

* Update `README.md` if you make changes related to application feature, Remember that `README.md` is not a technical document. 
* Update `ARCHITECTURE.md` if you make changes that affect technical detail such as architecture, data flow, and code-level stuff. 
