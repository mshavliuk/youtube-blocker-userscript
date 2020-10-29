# How to contribute

We love pull requests. And following this guidelines will make your pull request easier to merge.

If you want to contribute but don’t know what to do, take a look at these two labels: [help wanted](https://github.com/https://github.com/mshavliuk/Youtube%20blocker%20userscript/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) and [good first issue](https://github.com/https://github.com/mshavliuk/Youtube%20blocker%20userscript/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

_[Use GitHub interface](https://blog.sapegin.me/all/open-source-for-everyone/) for simple documentation changes, otherwise follow the steps below._

## Prerequisites

- If it’s your first pull request, watch [this amazing course](http://makeapullrequest.com/) by [Kent C. Dodds](https://twitter.com/kentcdodds).
- Fork the repository and clone your fork.
- Install dependencies: `npm install`.

## Development workflow

Build the js bundle for development purposes:

```bash
npm run dev
```

Build the js bundle for production purposes:

```bash
npm run build
```

Run linters:

```bash
npm run pretest
```

Run tests: [WIP]

**Don’t forget to add tests and update documentation for your changes.**

**Please update npm lock file (`package-lock.json`) if you add or update dependencies.**

## Other notes

- If you have commit access to repository and want to make big change or not sure about something, make a new branch and open pull request.
- Don’t commit generated files, like minified JavaScript.
- Don’t change version number and change log.

## Need help?

If you want to contribute but have any questions, concerns or doubts, feel free to ping maintainers. Ideally create a pull request with `WIP` (Work in progress) in its title and ask questions in the pull request description.
