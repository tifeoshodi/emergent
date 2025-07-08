.PHONY: test setup frontend-test backend-test

setup:
	bash scripts/setup_env.sh

backend-test:
	pytest -q

frontend-test:
	cd frontend && yarn test

test: setup backend-test frontend-test
