NX := npx nx

# ── Formatting helpers ───────────────────────────────────────────────────────
BOLD  := \033[1m
CYAN  := \033[36m
RESET := \033[0m

.DEFAULT_GOAL := help

.PHONY: help \
        install sync \
        preview generate dev-web dev-api \
        build build-web build-libs build-engine-core build-ui-elements build-api build-cli \
        test test-web test-engine-core test-ui-elements test-watch test-coverage \
        typecheck typecheck-web typecheck-engine-core typecheck-ui-elements \
        e2e \
        graph affected-build affected-test \
        clean reset

# ── Help ─────────────────────────────────────────────────────────────────────

help:
	@printf "\n$(BOLD)Landing Engine — available targets$(RESET)\n\n"
	@printf "$(CYAN)Setup$(RESET)\n"
	@printf "  make install                Install all workspace dependencies\n"
	@printf "  make sync                   Sync Nx tsconfig project references\n"
	@printf "\n$(CYAN)Development$(RESET)\n"
	@printf "  make preview                Full stack preview — starts API + web (reads config.json)\n"
	@printf "  make generate PROMPT=\"...\"  AI-generate config.json from a description, then preview\n"
	@printf "  make dev-web                Start only the web dev server (http://localhost:4200)\n"
	@printf "  make dev-api                Start only the API server (http://localhost:4000)\n"
	@printf "\n$(CYAN)Build$(RESET)\n"
	@printf "  make build                  Build all projects\n"
	@printf "  make build-web              Build @org/web only\n"
	@printf "  make build-libs             Build engine-core and ui-elements\n"
	@printf "  make build-engine-core      Build @org/engine-core only\n"
	@printf "  make build-ui-elements      Build @org/ui-elements only\n"
	@printf "  make build-api              Build @org/api only\n"
	@printf "  make build-cli              Build @org/cli only\n"
	@printf "\n$(CYAN)Test$(RESET)\n"
	@printf "  make test                   Run all unit tests\n"
	@printf "  make test-web               Run @org/web tests\n"
	@printf "  make test-engine-core       Run @org/engine-core tests\n"
	@printf "  make test-ui-elements       Run @org/ui-elements tests\n"
	@printf "  make test-watch             Run all tests in watch mode\n"
	@printf "  make test-coverage          Run all tests with v8 coverage report\n"
	@printf "  make e2e                    Run Playwright e2e tests for the web app\n"
	@printf "\n$(CYAN)Type checking$(RESET)\n"
	@printf "  make typecheck              Typecheck all projects\n"
	@printf "  make typecheck-web          Typecheck @org/web\n"
	@printf "  make typecheck-engine-core  Typecheck @org/engine-core\n"
	@printf "  make typecheck-ui-elements  Typecheck @org/ui-elements\n"
	@printf "\n$(CYAN)Affected (CI-friendly)$(RESET)\n"
	@printf "  make affected-build         Build only projects affected by current changes\n"
	@printf "  make affected-test          Test only projects affected by current changes\n"
	@printf "\n$(CYAN)Utilities$(RESET)\n"
	@printf "  make graph                  Open the interactive Nx dependency graph\n"
	@printf "  make clean                  Remove all dist/ folders and Nx cache\n"
	@printf "  make reset                  Stop the Nx daemon and wipe all caches\n"
	@printf "\n"

# ── Setup ────────────────────────────────────────────────────────────────────

install:
	npm install

sync:
	$(NX) sync

# ── Development ──────────────────────────────────────────────────────────────

# Full-stack preview: CLI creates config.json in the workspace root, then starts API + web.
# Run directly (not via nx) so process.cwd() stays at the workspace root.
preview:
	node --import tsx/esm apps/cli/src/index.ts preview

# AI generator: PROMPT is required. Example: make generate PROMPT="A premium coffee roastery in Mumbai"
generate:
	node --import tsx/esm apps/cli/src/index.ts generate "$(PROMPT)"

dev-web:
	$(NX) dev @org/web

dev-api:
	$(NX) serve @org/api

# ── Build ────────────────────────────────────────────────────────────────────

build:
	$(NX) run-many --target=build --all

build-web:
	$(NX) build @org/web

build-libs:
	$(NX) run-many --target=build --projects=@org/engine-core,@org/ui-elements

build-engine-core:
	$(NX) build @org/engine-core

build-ui-elements:
	$(NX) build @org/ui-elements

build-api:
	$(NX) build @org/api

build-cli:
	$(NX) build @org/cli

# ── Test ─────────────────────────────────────────────────────────────────────

test:
	$(NX) run-many --target=test --all

test-web:
	$(NX) test @org/web

test-engine-core:
	$(NX) test @org/engine-core

test-ui-elements:
	$(NX) test @org/ui-elements

test-watch:
	$(NX) run-many --target=test --all -- --watch

test-coverage:
	$(NX) run-many --target=test --all -- --coverage

e2e:
	$(NX) e2e @org/web-e2e

# ── Type checking ────────────────────────────────────────────────────────────

typecheck:
	$(NX) run-many --target=typecheck --all

typecheck-web:
	$(NX) typecheck @org/web

typecheck-engine-core:
	$(NX) typecheck @org/engine-core

typecheck-ui-elements:
	$(NX) typecheck @org/ui-elements

# ── Affected ─────────────────────────────────────────────────────────────────

affected-build:
	$(NX) affected --target=build

affected-test:
	$(NX) affected --target=test

# ── Utilities ────────────────────────────────────────────────────────────────

graph:
	$(NX) graph

clean:
	rm -rf apps/web/dist apps/web/test-output \
	       apps/api/dist \
	       apps/cli/dist \
	       libs/engine-core/dist libs/engine-core/test-output \
	       libs/ui-elements/dist libs/ui-elements/test-output \
	       .nx/cache

reset:
	$(NX) reset
