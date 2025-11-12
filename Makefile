# Aether Link Makefile
# Commands for building and managing the Aether Link containerized environment

.PHONY: help build up down logs shell clean dev prod test health

# Default target
help:
	@echo "🚀 Aether Link - Asterisk + Next.js Management Commands"
	@echo ""
	@echo "Development:"
	@echo "  dev        - Start development environment (hot reload)"
	@echo "  dev-build  - Build development containers"
	@echo "  dev-down   - Stop development environment"
	@echo ""
	@echo "Production:"
	@echo "  build      - Build production containers"
	@echo "  up         - Start production environment"
	@echo "  down       - Stop production environment"
	@echo "  restart    - Restart production environment"
	@echo ""
	@echo "Management:"
	@echo "  logs       - Show logs from all services"
	@echo "  logs-asterisk - Show Asterisk logs"
	@echo "  logs-web   - Show Next.js logs"
	@echo "  shell      - Access container shell"
	@echo "  asterisk   - Access Asterisk CLI"
	@echo "  health     - Check service health"
	@echo "  clean      - Clean up containers and images"
	@echo ""
	@echo "Database:"
	@echo "  db-backup  - Backup PostgreSQL database"
	@echo "  db-restore - Restore PostgreSQL database"
	@echo "  db-shell   - Access PostgreSQL shell"

# Development commands
dev:
	@echo "🔧 Starting development environment..."
	docker-compose -f docker-compose.dev.yml up --build

dev-build:
	@echo "🔨 Building development containers..."
	docker-compose -f docker-compose.dev.yml build

dev-down:
	@echo "🛑 Stopping development environment..."
	docker-compose -f docker-compose.dev.yml down

# Production commands
build:
	@echo "🏗️ Building production containers..."
	docker-compose build --no-cache

up:
	@echo "🚀 Starting production environment..."
	docker-compose up -d

down:
	@echo "🛑 Stopping production environment..."
	docker-compose down

restart:
	@echo "🔄 Restarting production environment..."
	docker-compose restart

# Management commands
logs:
	@echo "📋 Showing logs from all services..."
	docker-compose logs -f

logs-asterisk:
	@echo "📋 Showing Asterisk logs..."
	docker-compose logs -f aether-link | grep asterisk

logs-web:
	@echo "📋 Showing Next.js logs..."
	docker-compose logs -f aether-link | grep nextjs

shell:
	@echo "🐚 Accessing container shell..."
	docker-compose exec aether-link /bin/bash

asterisk:
	@echo "📞 Accessing Asterisk CLI..."
	docker-compose exec aether-link asterisk -rvvv

health:
	@echo "🏥 Checking service health..."
	@echo "=== Container Status ==="
	docker-compose ps
	@echo ""
	@echo "=== Web Interface Health ==="
	@curl -s http://localhost:3000/api/health | jq . || echo "Web interface not responding"
	@echo ""
	@echo "=== Asterisk Status ==="
	@docker-compose exec -T aether-link asterisk -rx "core show version" || echo "Asterisk not responding"

# Database commands
db-backup:
	@echo "💾 Backing up PostgreSQL database..."
	@mkdir -p ./backups
	@docker-compose exec -T postgres pg_dump -U aether aether_link > ./backups/backup-$(shell date +%Y%m%d-%H%M%S).sql
	@echo "✅ Backup completed in ./backups/"

db-restore:
	@echo "📥 Restoring PostgreSQL database..."
	@read -p "Enter backup file path: " backup_file; \
	docker-compose exec -T postgres psql -U aether -d aether_link < $$backup_file
	@echo "✅ Database restored"

db-shell:
	@echo "🐘 Accessing PostgreSQL shell..."
	docker-compose exec postgres psql -U aether -d aether_link

# Cleanup commands
clean:
	@echo "🧹 Cleaning up containers and images..."
	docker-compose down -v --rmi all
	docker system prune -f
	docker volume prune -f

# Testing commands
test:
	@echo "🧪 Running tests..."
	docker-compose exec aether-link npm test

lint:
	@echo "🔍 Running linting..."
	docker-compose exec aether-link npm run lint

type-check:
	@echo "🔍 Running type checking..."
	docker-compose exec aether-link npm run type-check

# Quick start for development
quick-start:
	@echo "⚡ Quick starting Aether Link for development..."
	@mkdir -p config/asterisk data/asterisk logs/asterisk spool/asterisk logs/supervisor
	@cp -r /usr/src/asterisk/configs/basic-pbx/* config/asterisk/ 2>/dev/null || echo "Using default configs"
	@make dev

# Production deployment
deploy:
	@echo "🚀 Deploying Aether Link to production..."
	@make build
	@make up
	@sleep 30
	@make health

# Monitoring commands
monitor:
	@echo "📊 Real-time monitoring..."
	@watch -n 2 'docker-compose ps && echo "" && docker stats --no-stream'

# Configuration commands
config-backup:
	@echo "💾 Backing up configuration..."
	@mkdir -p ./backups
	@tar -czf ./backups/config-backup-$(shell date +%Y%m%d-%H%M%S).tar.gz config/
	@echo "✅ Configuration backed up"

config-restore:
	@echo "📥 Restoring configuration..."
	@read -p "Enter backup file path: " backup_file; \
	tar -xzf $$backup_file
	@echo "✅ Configuration restored"
	@make restart