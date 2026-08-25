# Automatización de Instagram — configuración del cron

Este documento explica cómo desplegar y programar
[`scripts/meam-instagram-automation.js`](../scripts/meam-instagram-automation.js)
en el servidor donde se vaya a ejecutar (por ejemplo, uno con el usuario
`claude` y Node.js instalado en `/home/claude/`).

> Este repositorio es el código fuente del script. El propio `crontab` vive
> en el servidor de destino, no en este repositorio — no hay forma de
> "instalarlo" desde aquí. Sigue estos pasos manualmente en esa máquina.

## 1. Requisitos previos

- Node.js 18 o superior (el script usa el `fetch` nativo).
- Una cuenta de Instagram Business/Creator vinculada a una página de
  Facebook, con una app de Meta y un token de larga duración — ver
  [`.claude/skills/instagram/references/authentication.md`](../.claude/skills/instagram/references/authentication.md)
  para el procedimiento completo de obtención de credenciales.

## 2. Desplegar el script

Copia (o clona este repo y enlaza) el archivo al servidor, por ejemplo:

```bash
mkdir -p /home/claude
cp scripts/meam-instagram-automation.js /home/claude/meam-instagram-automation.js
```

## 3. Configurar las credenciales

El script lee las credenciales desde variables de entorno, **nunca** desde
argumentos en línea de comandos (para que no queden expuestas en
`ps`/logs de cron). No las pongas directamente en la línea del crontab.

Crea un archivo de entorno legible solo por el usuario que ejecuta el cron,
por ejemplo `/home/claude/.env.instagram`:

```bash
INSTAGRAM_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
INSTAGRAM_BUSINESS_ACCOUNT_ID=1234567890123456
# Opcionales:
# LOG_FILE=/home/claude/logs/meam-instagram-automation.log
# FOLLOWER_DROP_ALERT_THRESHOLD=5
# PUBLISHING_LIMIT_ALERT_THRESHOLD=80
```

```bash
chmod 600 /home/claude/.env.instagram
```

## 4. Editar el crontab

```bash
crontab -e
```

Añade estas líneas al final (cargan el archivo de entorno y luego llaman
al script; ajusta las rutas si copiaste los archivos en otro sitio):

```cron
0 9 * * 1 set -a; . /home/claude/.env.instagram; set +a; node /home/claude/meam-instagram-automation.js --weekly-report >> /home/claude/logs/cron.log 2>&1
0 8 * * * set -a; . /home/claude/.env.instagram; set +a; node /home/claude/meam-instagram-automation.js --check-alerts >> /home/claude/logs/cron.log 2>&1
0 18 28-31 * * set -a; . /home/claude/.env.instagram; set +a; node /home/claude/meam-instagram-automation.js --monthly-analysis >> /home/claude/logs/cron.log 2>&1
0 17 * * 5 set -a; . /home/claude/.env.instagram; set +a; node /home/claude/meam-instagram-automation.js --all >> /home/claude/logs/cron.log 2>&1
```

Guarda y cierra el editor (en `vi`/`vim`: `ESC`, luego `:wq`, `ENTER`).

| Horario | Flag | Qué hace |
|---|---|---|
| Lunes 9:00 | `--weekly-report` | Seguidores, alcance semanal, publicación destacada de los últimos 7 días |
| Todos los días 8:00 | `--check-alerts` | Caída de seguidores, cuota de publicación cerca del límite, engagement anormalmente bajo |
| Días 28-31 a las 18:00 | `--monthly-analysis` | Resumen del mes (el script detecta si ya corrió ese mes y se salta las ejecuciones repetidas de los días 29-31) |
| Viernes 17:00 | `--all` | Ejecuta los tres modos anteriores seguidos |

## 5. Verificar

```bash
mkdir -p /home/claude/logs
set -a; . /home/claude/.env.instagram; set +a
node /home/claude/meam-instagram-automation.js --check-alerts
```

Si falta alguna variable de entorno o el token es inválido, el script
termina con código de salida `1` y un mensaje de error explícito — revísalo
antes de dar por buena la instalación en el cron.

El script guarda su propio estado (seguidores del último chequeo, si ya
corrió el análisis mensual, etc.) en un archivo JSON junto al script
(`.meam-instagram-state.json` por defecto, configurable con `STATE_FILE`).
Ese archivo y los `.env*` no deben commitearse — ver `.gitignore`.
