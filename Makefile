SHELL := /bin/bash
up:
	docker compose up -d --build
	echo "App: http://localhost:3000"

install:
	docker compose run --rm app npm install

ps:
	docker compose ps

logs:
	docker compose logs -f --tail=100 app

down:
	docker compose down

clean:
	docker compose down -v --remove-orphans || true
	docker system prune -f || true

migrate:
	docker compose exec app npx prisma migrate dev --name init || true

seed:
	docker compose exec app npm run seed || true

shell:
	docker compose exec app sh
