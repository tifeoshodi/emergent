.PHONY: test setup

setup:
	bash scripts/setup_env.sh

test: setup
	pytest -q
