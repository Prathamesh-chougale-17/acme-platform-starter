# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.3.1](https://github.com/Prathamesh-chougale-17/acme-platform-starter/compare/v0.3.0...v0.3.1) (2026-04-28)

### Features

- enhance error handling and observability configuration across the platform ([f3b0c4a](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/f3b0c4acd0a2954ef6dbc2abe2aaf42703942b5b))
- **versioning:** implement app version updater and add configuration for version bumps ([0059123](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/0059123090152a872c9a4203779266d3bb821402))

## [0.3.0](https://github.com/Prathamesh-chougale-17/acme-platform-starter/compare/v0.2.0...v0.3.0) (2026-04-28)

### Features

- add pre-push hook to enforce release verification for tag pushes ([a14ed96](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/a14ed962ee01439cb3b585161f81d92ee42db094))
- **cli:** implement CLI scaffolding and project setup wizard ([25f0c3a](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/25f0c3adc2a3ed4ea5d4d704a0e8c3d4dd66d047))

### Bug Fixes

- **template:** exclude packages/cli from scaffolded template output ([28d5ed7](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/28d5ed7a2912c59e2b67a88c9b4fe45701621807))

## [0.2.0](https://github.com/Prathamesh-chougale-17/acme-platform-starter/compare/v0.1.8...v0.2.0) (2026-04-28)

### Features

- add release-skills to automate versioning, changelog generation, and npm publishing ([f3a3cb6](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/f3a3cb69bef9f556688805e628729d70b10b177d))

### [0.1.8](https://github.com/Prathamesh-chougale-17/acme-platform-starter/compare/v0.1.7...v0.1.8) (2026-04-28)

### Features

- add @clack/prompts dependency and update CLI for prompt skipping ([502fd5f](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/502fd5fa8620adac7d477e7d4e41a9ac906e94a2))
- add Prettier to lint-staged for automatic formatting ([4e0059d](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/4e0059d962a347861cd8f267f689d1c08b6b978b))

### Bug Fixes

- improve logging message formatting in create-package-cli ([b1946a2](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/b1946a2532eedd966e9b9eba8cc4da38faf75f31))

### [0.1.7](https://github.com/Prathamesh-chougale-17/acme-platform-starter/compare/v0.1.6...v0.1.7) (2026-04-28)

### Features

- update onboarding flow and workspace management ([53f2b6d](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/53f2b6de7c809b88dad0ea2e65187aedaba34b42))

### [0.1.6](https://github.com/Prathamesh-chougale-17/acme-platform-starter/compare/v0.1.5...v0.1.6) (2026-04-23)

### Bug Fixes

- support multiple local docker stacks ([c6a1c30](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/c6a1c302ca66be98121c1b9f456faf1fa5b0e002))

### [0.1.5](https://github.com/Prathamesh-chougale-17/acme-platform-starter/compare/v0.1.4...v0.1.5) (2026-04-23)

### Features

- enhance npm publishing workflow with token verification and trusted publishing options ([f2d02a7](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/f2d02a768f6313227b5688c26ce10c14469e154e))

### [0.1.4](https://github.com/Prathamesh-chougale-17/acme-platform-starter/compare/v0.1.3...v0.1.4) (2026-04-23)

### [0.1.3](https://github.com/Prathamesh-chougale-17/acme-platform-starter/compare/v0.1.2...v0.1.3) (2026-04-23)

### [0.1.2](https://github.com/Prathamesh-chougale-17/acme-platform-starter/compare/v0.1.1...v0.1.2) (2026-04-23)

### Features

- add npm token verification step in release workflow ([8bfe970](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/8bfe970fc90d1126b609785084e2eb4fab1456ec))

### 0.1.1 (2026-04-23)

### Features

- **actions:** adding CI pipeline ([a0a9339](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/a0a933954806ae675cd45a88c4432570a12904fe))
- add API_LOG_TO_LOKI configuration for logging to Loki ([8eb7735](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/8eb773553e55ea68c66f42497da5176d1e3437c9))
- add metrics reader configuration for Prometheus in OpenTelemetry Collector ([9d9547f](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/9d9547f65919b2b6e22c6207df46c0545426204d))
- add observability stack with Grafana, Loki, Tempo, and OpenTelemetry ([d275432](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/d275432c67b78f7f14648af21cf7378a2229f441))
- add OpenTelemetry Collector configuration schema and VSCode settings ([088c2bd](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/088c2bd1c638296f8aac6f3d71c460bf3bedcc4e))
- add scripts for creating and verifying the Acme Platform starter package ([3c32da2](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/3c32da2909e72cbea283087559f79c20da593464))
- add start and start:worker scripts to streamline application startup ([d1f2146](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/d1f21465e61eaac960b2225604aeb80dfe72bafa))
- **audit:** add audit logs schema and related indices ([9f37d11](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/9f37d111feabd314f06c90cf09c5d0cfdf3e212b))
- **audit:** implement audit logging functionality ([5dda621](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/5dda6219c69f32f5242711eea70429f7e520daa1))
- enhance e2e testing setup with Playwright configuration and add TypeScript support ([fc8d36d](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/fc8d36def3617800d87be09518069e61fb11f884))
- enhance logging capabilities with Loki integration and transport stream configuration ([13142ed](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/13142ed85167a5fe9e8018800d66de06a4aa3101))
- enhance UI components with improved styling and layout adjustments ([cf191a5](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/cf191a5e43abf6c5fc1540e68ecd09fd1beabe3b))
- enhance user organization management and workspace selection ([308f100](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/308f100ea6c2dd136b26ef1174c05dae5b08213e))
- implement graceful shutdown with Sentry integration and observability handling ([bd5f5c0](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/bd5f5c0ebfbbdbc41d121cffb1036194b35736e4))
- integrate OpenAPI support and enhance API documentation with new schemas and routes ([46d634b](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/46d634b2f908c3987e751ed77c4b642108e0068e))
- integrate React Query for data fetching and state management across components ([e6eb7c1](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/e6eb7c1bf20367fecfa946183a39cf3bff17fce7))
- **invitation:** increase timeout for invitation requests and handle timeout errors ([3af1a71](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/3af1a71f32e8bbdaff3bca3ec0cc809bc73ad466))
- **invitations:** implement invitation creation API with audit logging ([fda0aa4](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/fda0aa46bc2817bdfa8c516222ce044e09885167))
- **jobs:** implement webhook delivery and event handling ([c36564d](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/c36564d6425dc70048ce9ee49145793a3792bca4))
- remove recommended repository naming section from README.md ([27528fb](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/27528fb749fa6ef579b3c8bc210ffb0469cee865))
- update global environment variables in turbo.json and add auth:generate task ([c6c14e5](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/c6c14e53be94c4ebe3965fc8df466e4776698be4))
- update README.md to enhance project description, repository naming recommendations, and include detailed technology stack and architecture ([de16df7](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/de16df77b537e3b1946414f0a572bb8b077325df))
- update tempo configuration with additional metrics generator settings and storage paths ([14b6114](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/14b6114c849ed672cafe9c211ebb29b92c07abaa))
- Updated the README.md file to give better reference ([c1d3f5d](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/c1d3f5d0711949236f1de353853c6a6cbb647e07))

### Bug Fixes

- update environment variable paths for local development and database commands ([a33d19b](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/a33d19b2acd3081fc2114a05d5bb7524615ae9a9))
- update jobId format in enqueueInviteEmailJob and enqueueWebhookDeliveryJob functions ([d4f5fed](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/d4f5fedc68550bf37fa2c9d4b0d44c2a1dd55a2c))
- update PostgreSQL port to avoid conflicts and adjust migration script ([131f35b](https://github.com/Prathamesh-chougale-17/acme-platform-starter/commit/131f35b62d45d6e5eb6323211f7ed15e66797c23))
