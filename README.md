# Nomba Node.js SDK examples

Example server-side Node.js apps that show how to integrate with [Nomba](https://nomba.com) using the official [Nomba Node.js SDK](https://github.com/NombaOSS/nomba-node-sdk) (`@nomba/node-sdk`).

This repository holds **examples only**. The SDK itself lives at [NombaOSS/nomba-node-sdk](https://github.com/NombaOSS/nomba-node-sdk); report SDK bugs there.

## Layout

Each example is a self-contained app in its own top-level folder, with:

- a `package.json` and a committed `package-lock.json`;
- a `README.md` explaining what it demonstrates and how to run it;
- a `.env.example` listing the variables it needs, with no real values.

CI installs each example with `npm ci --ignore-scripts` on Node 22 and 24, then runs its `lint`, `test` and `build` scripts if it defines them.

## Credentials

Examples read Nomba credentials from environment variables. Use **sandbox** credentials from the Nomba dashboard, and never commit a `.env` file, real keys or account IDs. CI never has access to Nomba credentials.

## Contributing

See the [NombaOSS contributing guide](https://github.com/NombaOSS/.github/blob/main/CONTRIBUTING.md) and [security policy](https://github.com/NombaOSS/.github/blob/main/SECURITY.md). Pull requests need a passing CI run and a review from [@NombaOSS/maintainers](CODEOWNERS).

## License

[MIT](LICENSE)

